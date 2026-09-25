import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const source = readFileSync(new URL('./src/routes/delivery.ts', import.meta.url), 'utf8');
const claim = source.match(/prepare\("(UPDATE portal_delivery_jobs[^\"]+)"\)/)[1];
const ack = source.match(/prepare\("(UPDATE otp_requests[^\"]+)"\)/)[1];
function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const name of ['0001_portal_security', '0002_rate_limits', '0003_pc_delivery']) db.exec(readFileSync(new URL(`./migrations/${name}.sql`, import.meta.url), 'utf8'));
  db.exec(`INSERT INTO portal_receipts (id,receipt_token_hash,customer_ref,phone_hash,invoice_ref,store_ref,store_name,masked_phone,expires_at) VALUES ('r','h','c','p','i','store','Store','***',datetime('now','+1 day'));
    INSERT INTO otp_requests (id,receipt_id,phone_hash,otp_hash,expires_at,status,ip_hash,user_agent_hash) VALUES ('o','r','p','h',datetime('now','+5 minutes'),'pending','ip','ua');
    INSERT INTO portal_delivery_jobs (id,store_ref,payload,expires_at) VALUES ('o','store','encrypted',datetime('now','+5 minutes'));`);
  return db;
}
test('claim is store-scoped and at most once, including competing pollers', () => {
  const db = fixture();
  assert.equal(db.prepare(claim).get('a','other'), undefined);
  assert.equal(db.prepare(claim).get('a','store').id, 'o');
  assert.equal(db.prepare(claim).get('b','store'), undefined);
  db.close();
});
test('expired, superseded and revoked jobs are never dispatched', () => {
  for (const mutation of ["UPDATE portal_delivery_jobs SET expires_at=datetime('now','-1 second')", "UPDATE otp_requests SET status='expired'", "UPDATE portal_receipts SET revoked_at=CURRENT_TIMESTAMP"]) {
    const db = fixture(); db.exec(mutation);
    assert.equal(db.prepare(claim).get('a','store'), undefined); db.close();
  }
});
test('ack requires matching claim and store and cannot revive an expired OTP', () => {
  const db = fixture(); db.prepare(claim).get('a','store');
  assert.equal(db.prepare(ack).run('sent',null,'o','other','a').changes,0);
  assert.equal(db.prepare(ack).run('sent',null,'o','store','wrong').changes,0);
  assert.equal(db.prepare(ack).run('sent',null,'o','store','a').changes,1);
  assert.equal(db.prepare(ack).run('failed','failure','o','store','a').changes,0);
  db.exec("UPDATE otp_requests SET status='expired'");
  assert.equal(db.prepare(ack).run('sent',null,'o','store','a').changes,0);
  db.close();
});
