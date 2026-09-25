import type { Env } from '../types/env';
import { constantTimeEqual, hmac } from '../utils/crypto';
import { seal, unseal } from '../services/encryption';
import { maskPhone, normalizeSriLankanPhone } from '../utils/phone';
import { requirePortalSession } from '../middleware/auth';
import { error, json } from '../utils/responses';
import { consumeRateLimit } from '../services/rateLimit';

type Bill = { invoiceRef: string; customerName: string; issuedAt: string; currency: 'LKR'; subtotal: number; discount: number; tax: number; total: number; amountPaid?: number; balanceDue?: number; refundAmount?: number; paymentMethod: string; status: string; items: { name: string; quantity: number; unitPrice: number; warrantyMonths: number; serial: string }[] };
function validBill(b: Bill) {
  return b && typeof b.invoiceRef === 'string' && b.invoiceRef.length > 0 && b.invoiceRef.length <= 100 &&
    typeof b.customerName === 'string' && b.customerName.length <= 200 && b.currency === 'LKR' &&
    typeof b.issuedAt === 'string' && Number.isFinite(Date.parse(b.issuedAt)) &&
    [b.subtotal,b.discount,b.tax,b.total].every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1e10) &&
    [b.amountPaid,b.balanceDue,b.refundAmount].every(x => x === undefined || (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1e10)) &&
    typeof b.paymentMethod === 'string' && b.paymentMethod.length <= 80 && ['Paid','Pending','Cancelled','Refunded','Partially refunded'].includes(b.status) &&
    Array.isArray(b.items) && b.items.length > 0 && b.items.length <= 200 && b.items.every(x =>
      typeof x.name === 'string' && x.name.length <= 300 && typeof x.serial === 'string' && x.serial.length <= 100 &&
      Number.isFinite(x.quantity) && x.quantity > 0 && x.quantity <= 1e6 && Number.isFinite(x.unitPrice) && x.unitPrice >= 0 && x.unitPrice <= 1e10 &&
      Number.isInteger(x.warrantyMonths) && x.warrantyMonths >= 0 && x.warrantyMonths <= 1200);
}

async function revokeBill(env: Env, store: string, invoice: string, version: number) {
  await env.PORTAL_DB.batch([
    env.PORTAL_DB.prepare('INSERT INTO portal_bill_revocations(store_ref,invoice_ref,source_version) VALUES(?,?,?) ON CONFLICT(store_ref,invoice_ref) DO UPDATE SET source_version=MAX(source_version,excluded.source_version)').bind(store,invoice,version),
    env.PORTAL_DB.prepare('UPDATE portal_receipts SET revoked_at=CURRENT_TIMESTAMP WHERE store_ref=? AND invoice_ref=? AND revoked_at IS NULL').bind(store,invoice),
    env.PORTAL_DB.prepare("UPDATE portal_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE receipt_id IN (SELECT id FROM portal_receipts WHERE store_ref=? AND invoice_ref=?) AND revoked_at IS NULL").bind(store,invoice),
    env.PORTAL_DB.prepare("UPDATE otp_requests SET status='expired' WHERE receipt_id IN (SELECT id FROM portal_receipts WHERE store_ref=? AND invoice_ref=?) AND status IN ('pending','sent','delivered')").bind(store,invoice),
    env.PORTAL_DB.prepare('UPDATE portal_delivery_jobs SET payload=NULL WHERE id IN (SELECT o.id FROM otp_requests o JOIN portal_receipts r ON r.id=o.receipt_id WHERE r.store_ref=? AND r.invoice_ref=?)').bind(store,invoice),
  ]);
}

export async function syncBill(request: Request, env: Env, id: string) {
  if (!env.POS_SHARED_SECRET || env.POS_SHARED_SECRET.length < 32 || !constantTimeEqual(request.headers.get('X-POS-API-Key') || '', env.POS_SHARED_SECRET)) return error('UNAUTHORIZED', 'POS authentication required.', id, 401);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 60000) return error('PAYLOAD_TOO_LARGE', 'Bill is too large.', id, 413);
  let b;
  try { b = JSON.parse(raw); } catch { return error('INVALID_REQUEST', 'Invalid bill.', id, 400); }
  if (!await consumeRateLimit(env, `sync:daily:${env.PC_BRIDGE_STORE_REF}:${new Date().toISOString().slice(0,10)}`, 2000, 86400)) return error('SYNC_DAILY_LIMIT', 'Daily sync budget reached. Keep changes in the POS outbox and retry tomorrow.', id, 429);
  if (b?.revoked === true) {
    if (b.storeRef !== env.PC_BRIDGE_STORE_REF || typeof b.invoiceRef !== 'string' || !b.invoiceRef || b.invoiceRef.length > 100 || !Number.isSafeInteger(b.sourceVersion) || b.sourceVersion < 1) return error('INVALID_REQUEST', 'Invalid revocation.', id, 400);
    await revokeBill(env,b.storeRef,b.invoiceRef,b.sourceVersion);
    return json({success:true,revoked:true},id);
  }
  if (!b || typeof b.receiptToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(b.receiptToken) || b.storeRef !== env.PC_BRIDGE_STORE_REF || typeof b.customerPhone !== 'string' || typeof b.storeName !== 'string' || !b.storeName || b.storeName.length > 120 || !Number.isSafeInteger(b.sourceVersion) || b.sourceVersion < 1 || !validBill(b.bill)) return error('INVALID_REQUEST', 'Invalid bill details or store.', id, 400);
  const phone = normalizeSriLankanPhone(b.customerPhone);
  if (!phone) return error('INVALID_PHONE', 'Registered phone is invalid.', id, 400);
  const tokenHash = await hmac(b.receiptToken, env.RECEIPT_TOKEN_SECRET);
  const phoneHash = await hmac(phone, env.RECEIPT_TOKEN_SECRET);
  const customerRef = await hmac(`${b.storeRef}:${phone}`, env.RECEIPT_TOKEN_SECRET);
  const receiptId = await hmac(`${b.storeRef}:${b.bill.invoiceRef}`, env.RECEIPT_TOKEN_SECRET);
  if (await env.PORTAL_DB.prepare('SELECT invoice_ref FROM portal_bill_revocations WHERE store_ref=? AND invoice_ref=?').bind(b.storeRef,b.bill.invoiceRef).first()) return error('RECEIPT_REVOKED','This bill needs explicit re-issuance by the shop.',id,409);
  // Identity is immutable. A changed customer phone requires explicit revocation
  // and re-issuance, not silently granting an existing session another bill.
  const existing = await env.PORTAL_DB.prepare('SELECT r.customer_ref, r.receipt_token_hash, b.source_version FROM portal_receipts r LEFT JOIN portal_bills b ON b.receipt_id=r.id WHERE r.id = ?').bind(receiptId).first<{ customer_ref: string; receipt_token_hash: string; source_version: number | null }>();
  if (existing && (existing.customer_ref !== customerRef || existing.receipt_token_hash !== tokenHash)) {
    if (b.sourceVersion > (existing.source_version ?? 0)) await revokeBill(env,b.storeRef,b.bill.invoiceRef,b.sourceVersion);
    return error('IDENTITY_CONFLICT', 'Receipt identity changed; access is not transferred. Contact the shop for re-issuance.', id, 409);
  }
  const clean: Bill = {
    invoiceRef: b.bill.invoiceRef, customerName: b.bill.customerName, issuedAt: b.bill.issuedAt, currency: 'LKR', subtotal: b.bill.subtotal,
    discount: b.bill.discount, tax: b.bill.tax, total: b.bill.total, paymentMethod: b.bill.paymentMethod, status: b.bill.status,
    ...(b.bill.amountPaid === undefined ? {} : {amountPaid:b.bill.amountPaid}),
    ...(b.bill.balanceDue === undefined ? {} : {balanceDue:b.bill.balanceDue}),
    ...(b.bill.refundAmount === undefined ? {} : {refundAmount:b.bill.refundAmount}),
    items: b.bill.items.map((x: Bill['items'][number]) => ({ name: x.name, quantity: x.quantity, unitPrice: x.unitPrice, warrantyMonths: x.warrantyMonths, serial: x.serial })),
  };
  await env.PORTAL_DB.batch([
    env.PORTAL_DB.prepare("INSERT INTO portal_receipts (id,receipt_token_hash,customer_ref,phone_hash,invoice_ref,store_ref,store_name,masked_phone,expires_at,encrypted_phone) VALUES (?,?,?,?,?,?,?,?,datetime('now','+5 years'),?) ON CONFLICT(id) DO NOTHING")
      .bind(receiptId,tokenHash,customerRef,phoneHash,clean.invoiceRef,b.storeRef,b.storeName,maskPhone(phone),await seal(phone,env.DELIVERY_ENCRYPTION_KEY,receiptId)),
    env.PORTAL_DB.prepare('INSERT INTO portal_bills (receipt_id,store_ref,customer_ref,invoice_ref,source_version,encrypted_data) SELECT id,store_ref,customer_ref,invoice_ref,?,? FROM portal_receipts WHERE id = ? AND customer_ref = ? AND receipt_token_hash = ? AND revoked_at IS NULL AND NOT EXISTS (SELECT 1 FROM portal_bill_revocations v WHERE v.store_ref=portal_receipts.store_ref AND v.invoice_ref=portal_receipts.invoice_ref) ON CONFLICT(receipt_id) DO UPDATE SET source_version=excluded.source_version, encrypted_data=excluded.encrypted_data, updated_at=CURRENT_TIMESTAMP WHERE excluded.source_version > portal_bills.source_version')
      .bind(b.sourceVersion,await seal(JSON.stringify(clean),env.DELIVERY_ENCRYPTION_KEY,receiptId),receiptId,customerRef,tokenHash),
  ]);
  const identity = await env.PORTAL_DB.prepare('SELECT id FROM portal_receipts WHERE id = ? AND customer_ref = ? AND receipt_token_hash = ? AND revoked_at IS NULL AND NOT EXISTS (SELECT 1 FROM portal_bill_revocations v WHERE v.store_ref=portal_receipts.store_ref AND v.invoice_ref=portal_receipts.invoice_ref)').bind(receiptId,customerRef,tokenHash).first();
  if (!identity) {
    await revokeBill(env,b.storeRef,b.bill.invoiceRef,b.sourceVersion);
    return error('IDENTITY_CONFLICT', 'Receipt is revoked or its identity changed.', id, 409);
  }
  return json({ success: true, receiptId, receiptUrl: `/r/${b.receiptToken}` }, id);
}

export async function cloudBills(request: Request, env: Env, id: string) {
  const session = await requirePortalSession(request,env);
  if (!session) return error('SESSION_EXPIRED','Verification is required.',id,401);
  const invoice = new URL(request.url).searchParams.get('invoice');
  const rows = await env.PORTAL_DB.prepare("SELECT b.receipt_id, b.encrypted_data, b.updated_at FROM portal_bills b JOIN portal_receipts r ON r.id=b.receipt_id WHERE b.store_ref=? AND b.customer_ref=? AND r.revoked_at IS NULL AND datetime(r.expires_at)>datetime('now') AND (? IS NULL OR b.invoice_ref=?) ORDER BY b.updated_at DESC LIMIT 50")
    .bind(session.storeRef,session.customerRef,invoice,invoice).all<{ receipt_id: string; encrypted_data: string; updated_at: string }>();
  const bills = await Promise.all(rows.results.map(async row => ({...JSON.parse(await unseal(row.encrypted_data,env.DELIVERY_ENCRYPTION_KEY,row.receipt_id)), lastSyncedAt:row.updated_at.replace(' ','T')+'Z'})));
  return json({ success: true, bills, limit: 50 },id);
}
