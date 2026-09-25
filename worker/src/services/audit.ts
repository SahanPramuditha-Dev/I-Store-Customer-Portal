import type { Env } from '../types/env';

export async function audit(env: Env, eventType: string, details: { customerRef?: string; receiptId?: string; ipHash?: string; userAgentHash?: string; metadata?: Record<string, string> }): Promise<void> {
  await env.PORTAL_DB.prepare(
    'INSERT INTO portal_audit_logs (id, event_type, customer_ref, receipt_id, ip_hash, user_agent_hash, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(crypto.randomUUID(), eventType, details.customerRef ?? null, details.receiptId ?? null, details.ipHash ?? null, details.userAgentHash ?? null, details.metadata ? JSON.stringify(details.metadata) : null).run();
}
