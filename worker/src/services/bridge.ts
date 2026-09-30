import type { Env } from '../types/env';

export async function bridgeReady(env: Env, storeRef: string): Promise<boolean> {
  return !!await env.PORTAL_DB.prepare('SELECT store_ref FROM portal_bridge_presence WHERE store_ref = ? AND ready = 1 AND last_seen > unixepoch() - 120').bind(storeRef).first();
}
