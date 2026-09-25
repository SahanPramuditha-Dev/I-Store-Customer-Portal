import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
import { createHmac } from 'node:crypto';
let worker;
before(async () => {
  const result = await build({ entryPoints: ['src/index.ts'], bundle: true, format: 'esm', platform: 'browser', write: false });
  worker = (await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)).default;
});
function fixture() {
  const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync('migrations').sort()) db.exec(readFileSync(`migrations/${file}`, 'utf8'));
  function prepare(sql) {
    let params = [];
    return { bind(...values) { params = values; return this; },
      async first() { return db.prepare(sql).get(...params) || null; },
      async run() { const r = db.prepare(sql).run(...params); return { success:true, meta:{ changes:r.changes } }; },
      async all() { return { results:db.prepare(sql).all(...params) }; } };
  }
  const env = { ENVIRONMENT:'development',PORTAL_ENABLED:'true',PORTAL_ORIGIN:'https://portal.example',POS_API_BASE_URL:'https://pos.example',POS_PORTAL_API_TOKEN:'t'.repeat(43),RECEIPT_TOKEN_SECRET:'r'.repeat(43),OTP_HMAC_SECRET:'o'.repeat(43),SESSION_SECRET:'s'.repeat(43),POS_SHARED_SECRET:'p'.repeat(43),PC_BRIDGE_TOKEN:'b'.repeat(43),PC_BRIDGE_STORE_REF:'shop',DELIVERY_ENCRYPTION_KEY:'ab'.repeat(32),TURNSTILE_SITE_KEY:'test-site-key',TURNSTILE_SECRET_KEY:'test',PORTAL_DB:{ prepare, async batch(statements) { db.exec('BEGIN'); try { const result=[]; for(const s of statements) result.push(await s.run()); db.exec('COMMIT'); return result; } catch(e) { db.exec('ROLLBACK'); throw e; } } } };
  async function req(path, body, headers = {}) {
    return worker.fetch(new Request(`https://portal.example${path}`, { method:body === undefined ? 'GET':'POST', headers:{'Content-Type':'application/json',...headers}, ...(body === undefined ? {} : {body:JSON.stringify(body)}) }), env);
  }
  const pos = { 'X-POS-API-Key': env.POS_SHARED_SECRET };
  const bridge = { Authorization:`Bearer ${env.PC_BRIDGE_TOKEN}` };
  const payload = { receiptToken:'A'.repeat(43),storeRef:'shop',storeName:'Test Shop',customerPhone:'+94700000000',sourceVersion:1,bill:{invoiceRef:'TEST-1',customerName:'Synthetic customer',issuedAt:'2026-01-01T00:00:00Z',currency:'LKR',subtotal:100,discount:0,tax:0,total:100,paymentMethod:'Cash',status:'Paid',items:[{name:'Test item',quantity:1,unitPrice:100,warrantyMonths:12,serial:'TEST-SERIAL'}]} };
  return { db, env, req, pos, bridge, payload };
}
function turnstile(t) {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    return Response.json({ success:true,hostname:'portal.example',action:'portal_otp_request' });
  });
}
test('complete synthetic receipt → queued OTP → PC ack → cookie → private bill flow', async t => {
  const f=fixture(); t.after(()=>f.db.close()); turnstile(t);
  assert.equal((await f.req('/internal/bills',f.payload,f.pos)).status,200);
  const raw = f.db.prepare('SELECT encrypted_data FROM portal_bills').get().encrypted_data;
  assert.ok(!raw.includes('Synthetic customer'));
  assert.equal((await f.req('/api/portal/bills')).status,401);
  assert.equal((await f.req('/internal/delivery/claim',{ready:true},f.bridge)).status,200);
  const request={receiptToken:f.payload.receiptToken,turnstileToken:'test-challenge-token'};
  const queued=await f.req('/api/auth/otp/request',request); assert.equal(queued.status,202);
  assert.equal((await queued.json()).deliveryStatus,'queued');
  const {job}=await (await f.req('/internal/delivery/claim',{ready:true},f.bridge)).json();
  assert.equal(job.phone,f.payload.customerPhone.replace('+','')); assert.match(job.code,/^\d{6}$/);
  assert.equal((await f.req('/api/auth/otp/verify',{receiptToken:f.payload.receiptToken,code:job.code})).status,409);
  await f.req('/internal/delivery/ack',{id:job.id,claim:job.claim,sent:true},f.bridge);
  const verified=await f.req('/api/auth/otp/verify',{receiptToken:f.payload.receiptToken,code:job.code});
  assert.equal(verified.status,200); const cookie=verified.headers.get('set-cookie'); assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);
  const data=await (await f.req('/api/portal/bills',undefined,{Cookie:cookie})).json();
  assert.equal(data.bills.length,1); assert.equal(data.bills[0].invoiceRef,'TEST-1');
  // A different registered customer must never appear in the same session.
  await f.req('/internal/bills',{...f.payload,receiptToken:'B'.repeat(43),customerPhone:'+94711111111',bill:{...f.payload.bill,invoiceRef:'OTHER'}},f.pos);
  assert.equal((await (await f.req('/api/portal/bills',undefined,{Cookie:cookie})).json()).bills.length,1);
  assert.equal((await f.req('/api/auth/otp/verify',{receiptToken:f.payload.receiptToken,code:job.code})).status,401);
  await f.req('/api/auth/logout',{}, {Cookie:cookie}); assert.equal((await f.req('/api/portal/bills',undefined,{Cookie:cookie})).status,401);
});
test('offline sender blocks code creation and unauthorized bridge/foreign origins fail closed', async t => {
  const f=fixture(); t.after(()=>f.db.close()); turnstile(t);
  await f.req('/internal/bills',f.payload,f.pos);
  assert.equal((await f.req('/api/auth/otp/request',{receiptToken:f.payload.receiptToken,turnstileToken:'test-challenge-token'})).status,503);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM otp_requests').get().n,0);
  assert.equal((await f.req('/internal/delivery/claim',{ready:true})).status,401);
  assert.equal((await f.req('/api/auth/logout',{}, {Origin:'https://evil.example'})).status,403);
});
test('enabled portal fails closed when its tenant mapping is missing', async t => {
  const f=fixture(); t.after(()=>f.db.close());
  f.env.PC_BRIDGE_STORE_REF = '';
  assert.equal((await f.req('/health')).status,503);
  assert.equal((await f.req('/internal/bills',f.payload,f.pos)).status,503);
});
test('enabled portal fails closed without POS API connection', async t => {
  const f=fixture(); t.after(()=>f.db.close());
  delete f.env.POS_PORTAL_API_TOKEN;
  assert.equal((await f.req('/health')).status,503);
  f.env.POS_PORTAL_API_TOKEN='t'.repeat(43);
  delete f.env.POS_API_BASE_URL;
  assert.equal((await f.req('/health')).status,503);
});
test('bill sync is idempotent, rejects identity changes and cannot roll back a newer version', async t => {
  const f=fixture(); t.after(()=>f.db.close());
  assert.equal((await f.req('/internal/bills',f.payload)).status,401);
  for (const version of [1,2,1,2]) assert.equal((await f.req('/internal/bills',{...f.payload,sourceVersion:version},f.pos)).status,200);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM portal_bills').get().n,1);
  assert.equal(f.db.prepare('SELECT source_version FROM portal_bills').get().source_version,2);
  assert.equal((await f.req('/internal/bills',{...f.payload,customerPhone:'+94711111111'},f.pos)).status,409);
  assert.equal((await f.req('/internal/bills',{...f.payload,storeRef:'other'},f.pos)).status,400);
});

function sessionFor(f, invoice='TEST-1') {
  const row=f.db.prepare('SELECT id,customer_ref FROM portal_receipts WHERE invoice_ref=?').get(invoice);
  const token='session-test-'+invoice;
  // Match the Worker's hex HMAC format.
  const hash=createHmac('sha256',f.env.SESSION_SECRET).update(token).digest('hex');
  f.db.prepare("INSERT INTO portal_sessions(id,session_token_hash,customer_ref,receipt_id,expires_at,last_activity_at,ip_hash,user_agent_hash) VALUES(?,?,?,?,datetime('now','+30 minutes'),CURRENT_TIMESTAMP,'ip','ua')").run(token,hash,row.customer_ref,row.id);
  return {Cookie:`portal_session=${token}`};
}
test('new phone revokes existing sessions and queued jobs; old/new tokens cannot take over',async t=>{
  const f=fixture();t.after(()=>f.db.close());turnstile(t);
  await f.req('/internal/bills',f.payload,f.pos);
  const cookie=sessionFor(f);
  assert.equal((await f.req('/api/portal/bills',undefined,cookie)).status,200);
  await f.req('/internal/delivery/claim',{ready:true},f.bridge);
  await f.req('/api/auth/otp/request',{receiptToken:f.payload.receiptToken,turnstileToken:'test-challenge-token'});
  assert.equal((await f.req('/internal/bills',{...f.payload,sourceVersion:2,receiptToken:'N'.repeat(43),customerPhone:'+94711111111'},f.pos)).status,409);
  assert.equal((await f.req('/api/portal/bills',undefined,cookie)).status,401);
  assert.equal((await f.req('/api/receipts/'+f.payload.receiptToken)).status,404);
  assert.equal((await (await f.req('/internal/delivery/claim',{ready:true},f.bridge)).json()).job,null);
  assert.equal((await f.req('/internal/bills',{...f.payload,sourceVersion:3},f.pos)).status,409);
});
test('revocation arriving before a delayed upload permanently prevents publication',async t=>{
  const f=fixture();t.after(()=>f.db.close());
  const revoke={revoked:true,storeRef:'shop',invoiceRef:'TEST-1',sourceVersion:2};
  assert.equal((await f.req('/internal/bills',revoke,f.pos)).status,200);
  assert.equal((await f.req('/internal/bills',f.payload,f.pos)).status,409);
  assert.equal((await f.req('/internal/bills',{...revoke,storeRef:'other'},f.pos)).status,400);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM portal_bills').get().n,0);
});
test('delivery status is scoped to receipt and distinguishes queued, failed, expired',async t=>{
  const f=fixture();t.after(()=>f.db.close());turnstile(t);
  await f.req('/internal/bills',f.payload,f.pos);
  await f.req('/internal/bills',{...f.payload,receiptToken:'B'.repeat(43),bill:{...f.payload.bill,invoiceRef:'SECOND'}},f.pos);
  await f.req('/internal/delivery/claim',{ready:true},f.bridge);
  const queued=await (await f.req('/api/auth/otp/request',{receiptToken:f.payload.receiptToken,turnstileToken:'test-challenge-token'})).json();
  const body={receiptToken:f.payload.receiptToken,otpRequestId:queued.otpRequestId};
  assert.equal((await (await f.req('/api/auth/otp/status',body)).json()).deliveryStatus,'queued');
  assert.equal((await f.req('/api/auth/otp/status',{...body,receiptToken:'B'.repeat(43)})).status,404);
  const {job}=await (await f.req('/internal/delivery/claim',{ready:true},f.bridge)).json();
  await f.req('/internal/delivery/ack',{id:job.id,claim:job.claim,sent:false},f.bridge);
  assert.equal((await (await f.req('/api/auth/otp/status',body)).json()).deliveryStatus,'failed');
  f.db.exec("UPDATE otp_requests SET expires_at=datetime('now','-1 second')");
  assert.equal((await (await f.req('/api/auth/otp/status',body)).json()).deliveryStatus,'expired');
});
test('expired sessions cannot read bills and invoice filtering cannot cross customers',async t=>{
  const f=fixture();t.after(()=>f.db.close());
  await f.req('/internal/bills',f.payload,f.pos);
  await f.req('/internal/bills',{...f.payload,receiptToken:'C'.repeat(43),customerPhone:'+94722222222',bill:{...f.payload.bill,invoiceRef:'OTHER'}},f.pos);
  const cookie=sessionFor(f);
  assert.equal((await (await f.req('/api/portal/bills?invoice=OTHER',undefined,cookie)).json()).bills.length,0);
  const bill=(await (await f.req('/api/portal/bills',undefined,cookie)).json()).bills[0];
  assert.ok(Number.isFinite(Date.parse(bill.lastSyncedAt)));
  f.db.exec("UPDATE portal_sessions SET expires_at=datetime('now','-1 second')");
  assert.equal((await f.req('/api/portal/bills',undefined,cookie)).status,401);
});
