import type { Env } from '../types/env';

export async function sendAuthenticationCode(env: Env, phone: string, code: string): Promise<{ ok: boolean; messageId?: string }> {
  if (!env.WHATSAPP_SERVICE_URL || !env.WHATSAPP_SERVICE_SECRET) return { ok: false };
  const endpoint = new URL('/api/send-message', env.WHATSAPP_SERVICE_URL);
  if (endpoint.protocol !== 'https:') return { ok: false };
  try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'X-Internal-Secret': env.WHATSAPP_SERVICE_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message: `Your I-Store verification code is ${code}. It expires in 5 minutes. Do not share this code.` }),
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json<{ success?: boolean; messageId?: string }>();
  return { ok: response.ok && data.success === true, messageId: data.messageId };
  } catch {
    return { ok: false };
  }
}
