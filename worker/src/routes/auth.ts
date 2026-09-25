import type { Env } from '../types/env';
import { requirePortalSession, requestContext } from '../middleware/auth';
import { audit } from '../services/audit';
import { consumeRateLimit } from '../services/rateLimit';
import { verifyTurnstile } from '../services/turnstile';
import { seal, unseal } from '../services/encryption';
import { bridgeReady } from '../services/bridge';
import { constantTimeEqual, hmac, randomToken } from '../utils/crypto';
import { clearSessionCookie, sessionCookie } from '../utils/cookies';
import { error, json } from '../utils/responses';

const OTP_TTL_SECONDS = 300;
const SESSION_TTL_SECONDS = 1800;
const code = () => {
  let value: number;
  do { value = crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= 4294000000);
  return String(value % 1_000_000).padStart(6, '0');
};

async function receiptForToken(env: Env, token: string) {
  return env.PORTAL_DB.prepare("SELECT id, customer_ref, phone_hash, masked_phone, store_ref, encrypted_phone FROM portal_receipts WHERE receipt_token_hash = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')")
    .bind(await hmac(token, env.RECEIPT_TOKEN_SECRET)).first<{ id: string; customer_ref: string; phone_hash: string; masked_phone: string; store_ref: string; encrypted_phone: string | null }>();
}

export async function requestOtp(request: Request, env: Env, id: string): Promise<Response> {
  const body = await request.json<{ receiptToken?: string; turnstileToken?: string }>().catch(() => null);
  if (typeof body?.receiptToken !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(body.receiptToken)) return error('INVALID_REQUEST', 'Verification details are invalid.', id, 400);
  const turnstile = await verifyTurnstile(body.turnstileToken, request, env);
  if (!turnstile.valid) return error('BOT_VERIFICATION_FAILED', 'Please complete the security check and try again.', id, 403);
  const receipt = await receiptForToken(env, body.receiptToken);
  if (!receipt) return error('RECEIPT_UNAVAILABLE', 'This receipt cannot be verified.', id, 404);
  if (!await bridgeReady(env, receipt.store_ref)) return error('SENDER_OFFLINE', 'The shop WhatsApp sender is offline. Please try again when the shop is online.', id, 503);
  const context = await requestContext(request, env);
  const allowed = await Promise.all([
    consumeRateLimit(env, `otp:receipt:${receipt.id}`, 5, 3600),
    consumeRateLimit(env, `otp:phone:${receipt.phone_hash}`, 5, 3600),
    consumeRateLimit(env, `otp:ip:${context.ipHash}`, 10, 3600),
  ]);
  if (allowed.includes(false)) return error('RATE_LIMITED', 'Please wait before requesting another code.', id, 429);
  if (!await consumeRateLimit(env, `otp:cooldown:${receipt.id}`, 1, 60)) return error('RESEND_COOLDOWN', 'Please wait one minute before requesting another code.', id, 429);
  const latest = await env.PORTAL_DB.prepare("SELECT created_at, resend_count FROM otp_requests WHERE receipt_id = ? AND status IN ('pending', 'sent', 'delivered') AND datetime(expires_at) > datetime('now') ORDER BY created_at DESC LIMIT 1").bind(receipt.id).first<{ created_at: string; resend_count: number }>();
  if (latest && latest.resend_count >= 3) return error('RESEND_LIMIT_REACHED', 'Too many codes were requested for this receipt.', id, 429);
  if (!await consumeRateLimit(env, `otp:store:${receipt.store_ref}:${new Date().toISOString().slice(0, 10)}`, 100, 86400)) return error('DAILY_LIMIT_REACHED', 'The shop verification limit has been reached. Please contact the shop.', id, 429);
  const otp = code();
  const otpId = crypto.randomUUID();
  if (!receipt.encrypted_phone || receipt.store_ref !== env.PC_BRIDGE_STORE_REF) return error('DELIVERY_NOT_READY', 'Verification delivery is not configured for this receipt.', id, 503);
  const phone = await unseal(receipt.encrypted_phone, env.DELIVERY_ENCRYPTION_KEY, receipt.id);
  await env.PORTAL_DB.prepare("UPDATE otp_requests SET status = 'expired' WHERE receipt_id = ? AND status IN ('pending', 'sent', 'delivered')").bind(receipt.id).run();
  await env.PORTAL_DB.prepare('INSERT INTO otp_requests (id, receipt_id, phone_hash, otp_hash, expires_at, resend_count, status, ip_hash, user_agent_hash) VALUES (?, ?, ?, ?, datetime(\'now\', \'+5 minutes\'), ?, ?, ?, ?)')
    .bind(otpId, receipt.id, receipt.phone_hash, await hmac(`${receipt.id}:${otp}`, env.OTP_HMAC_SECRET), latest ? latest.resend_count + 1 : 0, 'pending', context.ipHash, context.userAgentHash).run();
  await env.PORTAL_DB.prepare("INSERT INTO portal_delivery_jobs (id, store_ref, payload, expires_at) SELECT id, ?, ?, expires_at FROM otp_requests WHERE id = ?")
    .bind(receipt.store_ref, await seal(JSON.stringify({ phone, code: otp }), env.DELIVERY_ENCRYPTION_KEY, otpId), otpId).run();
  await audit(env, 'otp_queued', { customerRef: receipt.customer_ref, receiptId: receipt.id, ...context });
  return json({ success: true, otpRequestId: otpId, deliveryStatus: 'queued', maskedPhone: receipt.masked_phone, expiresInSeconds: OTP_TTL_SECONDS }, id, 202);
}

export async function otpStatus(request: Request, env: Env, id: string): Promise<Response> {
  const body = await request.json<{receiptToken?:string; otpRequestId?:string}>().catch(()=>null);
  if (typeof body?.receiptToken !== 'string' || typeof body.otpRequestId !== 'string' || body.otpRequestId.length > 80) return error('INVALID_REQUEST','Invalid verification request.',id,400);
  const receipt = await receiptForToken(env,body.receiptToken);
  if (!receipt) return error('RECEIPT_UNAVAILABLE','Receipt is unavailable.',id,404);
  const row = await env.PORTAL_DB.prepare("SELECT status, MAX(0,unixepoch(expires_at)-unixepoch()) AS remaining FROM otp_requests WHERE id=? AND receipt_id=?").bind(body.otpRequestId,receipt.id).first<{status:string; remaining:number}>();
  if (!row) return error('NOT_FOUND','Verification request not found.',id,404);
  if (!await consumeRateLimit(env,`otp:status:${body.otpRequestId}`,35,360)) return error('RATE_LIMITED','Please wait before checking again.',id,429);
  const deliveryStatus = row.remaining === 0 ? 'expired' : row.status === 'pending' ? 'queued' : row.status;
  return json({success:true,deliveryStatus,senderOnline:await bridgeReady(env,receipt.store_ref),expiresInSeconds:row.remaining},id);
}

export async function verifyOtp(request: Request, env: Env, id: string): Promise<Response> {
  const body = await request.json<{ receiptToken?: string; code?: string }>().catch(() => null);
  if (typeof body?.receiptToken !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(body.receiptToken) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return error('INVALID_REQUEST', 'Verification details are invalid.', id, 400);
  const receipt = await receiptForToken(env, body.receiptToken);
  if (!receipt) return error('RECEIPT_UNAVAILABLE', 'This receipt cannot be verified.', id, 404);
  const context = await requestContext(request, env);
  const otp = await env.PORTAL_DB.prepare("SELECT id, otp_hash, attempt_count FROM otp_requests WHERE receipt_id = ? AND status = 'sent' AND datetime(expires_at) > datetime('now') ORDER BY created_at DESC LIMIT 1").bind(receipt.id).first<{ id: string; otp_hash: string; attempt_count: number }>();
  if (!otp) {
    const pending = await env.PORTAL_DB.prepare("SELECT id FROM otp_requests WHERE receipt_id = ? AND status = 'pending' AND datetime(expires_at) > datetime('now') LIMIT 1").bind(receipt.id).first();
    if (pending) return error('OTP_PENDING', 'Your code is still awaiting WhatsApp delivery. Please wait a moment.', id, 409);
    return error('OTP_EXPIRED', 'This verification code has expired or could not be sent. Request a new code.', id, 401);
  }
  const matches = constantTimeEqual(otp.otp_hash, await hmac(`${receipt.id}:${body.code}`, env.OTP_HMAC_SECRET));
  if (!matches) {
    const updated = await env.PORTAL_DB.prepare("UPDATE otp_requests SET attempt_count = attempt_count + 1, status = CASE WHEN attempt_count + 1 >= 5 THEN 'blocked' ELSE 'sent' END WHERE id = ? AND status = 'sent' AND attempt_count < 5 AND datetime(expires_at) > datetime('now') RETURNING attempt_count").bind(otp.id).first<{ attempt_count: number }>();
    const attempts = updated?.attempt_count ?? 5;
    await audit(env, 'otp_rejected', { customerRef: receipt.customer_ref, receiptId: receipt.id, ...context });
    return error(attempts >= 5 ? 'OTP_BLOCKED' : 'OTP_INVALID', attempts >= 5 ? 'Too many unsuccessful attempts. Request a new code.' : 'That code is incorrect.', id, 401);
  }
  const consumed = await env.PORTAL_DB.prepare("UPDATE otp_requests SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'sent' AND attempt_count < 5 AND datetime(expires_at) > datetime('now') RETURNING id").bind(otp.id).first<{ id: string }>();
  if (!consumed) return error('OTP_UNAVAILABLE', 'This code has already been used or is no longer valid.', id, 401);
  const token = randomToken(); const sessionId = crypto.randomUUID();
  await env.PORTAL_DB.prepare("INSERT INTO portal_sessions (id, session_token_hash, customer_ref, receipt_id, expires_at, last_activity_at, ip_hash, user_agent_hash) VALUES (?, ?, ?, ?, datetime('now', '+30 minutes'), CURRENT_TIMESTAMP, ?, ?)")
    .bind(sessionId, await hmac(token, env.SESSION_SECRET), receipt.customer_ref, receipt.id, context.ipHash, context.userAgentHash).run();
  await audit(env, 'session_created', { customerRef: receipt.customer_ref, receiptId: receipt.id, ...context });
  const response = json({ success: true, expiresInSeconds: SESSION_TTL_SECONDS }, id);
  response.headers.set('Set-Cookie', sessionCookie(token, SESSION_TTL_SECONDS));
  return response;
}

export async function logout(request: Request, env: Env, id: string): Promise<Response> {
  const session = await requirePortalSession(request, env);
  if (session) { await env.PORTAL_DB.prepare('UPDATE portal_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?').bind(session.id).run(); await audit(env, 'session_revoked', { customerRef: session.customerRef, receiptId: session.receiptId }); }
  const response = json({ success: true }, id); response.headers.set('Set-Cookie', clearSessionCookie()); return response;
}

export async function session(request: Request, env: Env, id: string): Promise<Response> {
  const current = await requirePortalSession(request, env);
  return current ? json({ success: true, authenticated: true }, id) : error('SESSION_EXPIRED', 'Verification is required.', id, 401);
}
