import type { Env } from '../types/env';

export async function consumeRateLimit(env: Env, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.PORTAL_DB.prepare(`
    INSERT INTO portal_rate_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN expires_at <= ? THEN 1 ELSE count + 1 END,
      expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
    WHERE expires_at <= ? OR count < ?
    RETURNING count
  `).bind(key, now + windowSeconds, now, now, now, limit).first();
  return row !== null;
}
