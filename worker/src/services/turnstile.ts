import type { Env } from '../types/env';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
}

export interface TurnstileVerification {
  valid: boolean;
  reason?: string;
}

export async function verifyTurnstile(token: unknown, request: Request, env: Env, expectedAction = 'portal_otp_request'): Promise<TurnstileVerification> {
  if (typeof token !== 'string' || token.length < 10 || token.length > 4096) return { valid: false, reason: 'MISSING_OR_INVALID_TOKEN' };

  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', token);
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) form.set('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { valid: false, reason: 'VERIFICATION_UNAVAILABLE' };
    const result = await response.json<TurnstileResponse>();
    if (!result.success) return { valid: false, reason: result['error-codes']?.[0] || 'VERIFICATION_FAILED' };
    if (result.action !== expectedAction) return { valid: false, reason: 'ACTION_MISMATCH' };
    if (!env.PORTAL_ORIGIN || result.hostname !== new URL(env.PORTAL_ORIGIN).hostname) return { valid: false, reason: 'HOSTNAME_MISMATCH' };
    return { valid: true };
  } catch {
    return { valid: false, reason: 'VERIFICATION_UNAVAILABLE' };
  }
}
