import type { Env } from '../types/env';

export async function posRequest(env: Env, customerRef: string, receiptId: string, path: string, init: RequestInit = {}): Promise<Response> {
  const receipt = await env.PORTAL_DB.prepare('SELECT invoice_ref, store_ref FROM portal_receipts WHERE id=? AND customer_ref=? AND revoked_at IS NULL AND datetime(expires_at)>datetime(\'now\')').bind(receiptId, customerRef).first<{ invoice_ref: string; store_ref: string }>();
  if (!receipt) return new Response(null, { status: 401 });
  const url = new URL(path, env.POS_API_BASE_URL.endsWith('/') ? env.POS_API_BASE_URL : `${env.POS_API_BASE_URL}/`);
  return fetch(url, {
    ...init,
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    headers: { ...(init.headers || {}), Authorization: `Bearer ${env.POS_PORTAL_API_TOKEN}`, 'Content-Type': 'application/json', 'X-Portal-Customer-Ref': customerRef, 'X-Portal-Receipt-Id': receiptId, 'X-Portal-Store-Ref': receipt.store_ref, 'X-Portal-Invoice-Ref': receipt.invoice_ref },
  });
}
