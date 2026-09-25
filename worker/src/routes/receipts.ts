import type { Env } from '../types/env';
import { audit } from '../services/audit';
import { seal } from '../services/encryption';
import { bridgeReady } from '../services/bridge';
import { constantTimeEqual, hmac, randomToken } from '../utils/crypto';
import { maskPhone, normalizeSriLankanPhone } from '../utils/phone';
import { error, json } from '../utils/responses';

interface CreateReceiptBody {
  customerRef: string;
  customerPhone: string;
  invoiceRef: string;
  storeRef: string;
  storeName: string;
  expiresAt: string;
  posSyncReference?: string;
}

async function requestHash(request: Request, secret: string): Promise<{ ipHash: string; userAgentHash: string }> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return { ipHash: await hmac(ip, secret), userAgentHash: await hmac(userAgent, secret) };
}

export async function createReceipt(request: Request, env: Env, id: string): Promise<Response> {
  const suppliedSecret = request.headers.get('X-POS-API-Key') || '';
  if (!env.POS_SHARED_SECRET || env.POS_SHARED_SECRET.length < 32) return error('PORTAL_NOT_READY', 'Receipt creation is not configured.', id, 503);
  if (!constantTimeEqual(suppliedSecret, env.POS_SHARED_SECRET)) return error('UNAUTHORIZED', 'This endpoint is for the POS only.', id, 401);
  const body = await request.json<CreateReceiptBody>().catch(() => null);
  if (!body || !body.customerRef || !body.invoiceRef || !body.storeRef || !body.storeName || !body.expiresAt) return error('INVALID_REQUEST', 'Required receipt data is missing.', id, 400);
  const phone = normalizeSriLankanPhone(body.customerPhone);
  if (body.storeRef !== env.PC_BRIDGE_STORE_REF) return error('INVALID_STORE', 'Store is not configured for this POS.', id, 403);
  const expiresAt = new Date(body.expiresAt);
  if (!phone || Number.isNaN(expiresAt.valueOf()) || expiresAt <= new Date()) return error('INVALID_REQUEST', 'Receipt phone or expiry is invalid.', id, 400);

  const token = randomToken();
  const receiptId = crypto.randomUUID();
  const tokenHash = await hmac(token, env.RECEIPT_TOKEN_SECRET);
  const phoneHash = await hmac(phone, env.RECEIPT_TOKEN_SECRET);
  await env.PORTAL_DB.prepare(
    'INSERT INTO portal_receipts (id, receipt_token_hash, customer_ref, phone_hash, invoice_ref, store_ref, store_name, masked_phone, expires_at, pos_sync_reference, encrypted_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(receiptId, tokenHash, body.customerRef, phoneHash, body.invoiceRef, body.storeRef, body.storeName.slice(0, 120), maskPhone(phone), expiresAt.toISOString(), body.posSyncReference ?? null, await seal(phone, env.DELIVERY_ENCRYPTION_KEY, receiptId)).run();
  const hashes = await requestHash(request, env.RECEIPT_TOKEN_SECRET);
  await audit(env, 'receipt_created', { customerRef: body.customerRef, receiptId, ...hashes });
  return json({ success: true, receiptId, receiptToken: token, receiptUrl: `/r/${token}`, expiresAt: expiresAt.toISOString() }, id, 201);
}

export async function lookupReceipt(request: Request, env: Env, token: string, id: string): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return json({ valid: false, verificationRequired: true }, id, 404);
  const tokenHash = await hmac(token, env.RECEIPT_TOKEN_SECRET);
  const receipt = await env.PORTAL_DB.prepare(
    "SELECT id, customer_ref, store_ref, store_name, masked_phone FROM portal_receipts WHERE receipt_token_hash = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')",
  ).bind(tokenHash).first<{ id: string; customer_ref: string; store_ref: string; store_name: string; masked_phone: string }>();
  if (!receipt) return json({ valid: false, verificationRequired: true }, id, 404);
  const hashes = await requestHash(request, env.RECEIPT_TOKEN_SECRET);
  await audit(env, 'receipt_opened', { customerRef: receipt.customer_ref, receiptId: receipt.id, ...hashes });
  return json({ valid: true, storeName: receipt.store_name, maskedPhone: receipt.masked_phone, verificationRequired: true, senderOnline: await bridgeReady(env, receipt.store_ref) }, id);
}
