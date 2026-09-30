import type { Env } from '../types/env';
import { hmac } from '../utils/crypto';
import { getCookie } from '../utils/cookies';
import { clientIp, userAgent } from './security';

export interface PortalSession { id: string; customerRef: string; receiptId: string; storeRef: string; }

export async function requirePortalSession(request: Request, env: Env): Promise<PortalSession | null> {
  const token = getCookie(request, 'portal_session');
  if (!token) return null;
  const tokenHash = await hmac(token, env.SESSION_SECRET);
  const row = await env.PORTAL_DB.prepare(
    "SELECT s.id, s.customer_ref, s.receipt_id, r.store_ref FROM portal_sessions s JOIN portal_receipts r ON r.id = s.receipt_id WHERE s.session_token_hash = ? AND s.revoked_at IS NULL AND r.revoked_at IS NULL AND datetime(r.expires_at) > datetime('now') AND datetime(s.expires_at) > datetime('now')",
  ).bind(tokenHash).first<{ id: string; customer_ref: string; receipt_id: string; store_ref: string }>();
  if (!row) return null;
  await env.PORTAL_DB.prepare("UPDATE portal_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ? AND datetime(last_activity_at) < datetime('now','-5 minutes')").bind(row.id).run();
  return { id: row.id, customerRef: row.customer_ref, receiptId: row.receipt_id, storeRef: row.store_ref };
}

export async function requestContext(request: Request, env: Env): Promise<{ ipHash: string; userAgentHash: string }> {
  return { ipHash: await hmac(clientIp(request), env.SESSION_SECRET), userAgentHash: await hmac(userAgent(request), env.SESSION_SECRET) };
}
