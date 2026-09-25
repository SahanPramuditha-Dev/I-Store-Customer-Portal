import type { Env } from '../types/env';
import { constantTimeEqual, randomToken } from '../utils/crypto';
import { unseal } from '../services/encryption';
import { error, json } from '../utils/responses';

export async function deliveryRoute(request: Request, env: Env, id: string, path: string) {
  if (!env.PC_BRIDGE_STORE_REF || !env.PC_BRIDGE_TOKEN || env.PC_BRIDGE_TOKEN.length < 32 ||
      !constantTimeEqual(request.headers.get('Authorization') || '', `Bearer ${env.PC_BRIDGE_TOKEN}`))
    return error('UNAUTHORIZED', 'Bridge authentication required.', id, 401);
  if (request.method !== 'POST') return error('METHOD_NOT_ALLOWED', 'POST required.', id, 405);
  if (path === '/internal/delivery/claim') {
    const body = await request.json<{ ready?: boolean }>().catch(() => null);
    if (typeof body?.ready !== 'boolean') return error('INVALID_REQUEST', 'Bridge readiness is required.', id, 400);
    // One write per minute at most while state is unchanged (~1,440/day).
    await env.PORTAL_DB.prepare('INSERT INTO portal_bridge_presence (store_ref, ready, last_seen) VALUES (?, ?, unixepoch()) ON CONFLICT(store_ref) DO UPDATE SET ready = excluded.ready, last_seen = excluded.last_seen WHERE portal_bridge_presence.ready != excluded.ready OR portal_bridge_presence.last_seen <= unixepoch() - 60')
      .bind(env.PC_BRIDGE_STORE_REF, body.ready ? 1 : 0).run();
    if (!body.ready) return json({ job: null }, id);
    // At most one dispatch: never re-lease an uncertain send after a PC crash.
    const claim = randomToken();
    const job = await env.PORTAL_DB.prepare("UPDATE portal_delivery_jobs SET claim_token = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = (SELECT j.id FROM portal_delivery_jobs j JOIN otp_requests o ON o.id = j.id JOIN portal_receipts r ON r.id = o.receipt_id WHERE j.store_ref = ? AND j.claimed_at IS NULL AND datetime(j.expires_at) > datetime('now', '+30 seconds') AND o.status = 'pending' AND r.revoked_at IS NULL AND datetime(r.expires_at) > datetime('now') ORDER BY j.expires_at LIMIT 1) AND claimed_at IS NULL RETURNING id, payload, expires_at")
      .bind(claim, env.PC_BRIDGE_STORE_REF).first<{ id: string; payload: string; expires_at: string }>();
    if (!job) return json({ job: null }, id);
    const payload = JSON.parse(await unseal(job.payload, env.DELIVERY_ENCRYPTION_KEY, job.id));
    return json({ job: { id: job.id, claim, expiresAt: job.expires_at, ...payload } }, id);
  }
  if (path === '/internal/delivery/ack') {
    const body = await request.json<{ id?: string; claim?: string; sent?: boolean }>().catch(() => null);
    if (!body?.id || !body.claim || typeof body.sent !== 'boolean') return error('INVALID_REQUEST', 'Invalid acknowledgment.', id, 400);
    await env.PORTAL_DB.batch([
      env.PORTAL_DB.prepare("UPDATE otp_requests SET status = ?, failure_reason = ? WHERE id = ? AND status = 'pending' AND datetime(expires_at) > datetime('now') AND EXISTS (SELECT 1 FROM portal_delivery_jobs WHERE id = otp_requests.id AND store_ref = ? AND claim_token = ? AND completed_at IS NULL)")
        .bind(body.sent ? 'sent' : 'failed', body.sent ? null : 'PC_SEND_FAILED', body.id, env.PC_BRIDGE_STORE_REF, body.claim),
      env.PORTAL_DB.prepare('UPDATE portal_delivery_jobs SET payload = NULL, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND store_ref = ? AND claim_token = ? AND completed_at IS NULL')
        .bind(body.id, env.PC_BRIDGE_STORE_REF, body.claim),
    ]);
    return json({ success: true }, id);
  }
  return error('NOT_FOUND', 'Unknown bridge route.', id, 404);
}
