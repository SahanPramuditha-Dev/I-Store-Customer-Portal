import type { Env } from '../types/env';

export async function posRequest(env: Env, customerRef: string, receiptId: string, path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(path, env.POS_API_BASE_URL.endsWith('/') ? env.POS_API_BASE_URL : `${env.POS_API_BASE_URL}/`);
  return fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${env.POS_PORTAL_API_TOKEN}`, 'Content-Type': 'application/json', 'X-Portal-Customer-Ref': customerRef, 'X-Portal-Receipt-Id': receiptId, ...(init.headers || {}) },
  });
}
