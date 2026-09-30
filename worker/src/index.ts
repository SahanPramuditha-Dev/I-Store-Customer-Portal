import type { Env } from './types/env';
import { error, json, requestId } from './utils/responses';
import { createReceipt, lookupReceipt } from './routes/receipts';
import { logout, requestOtp, session, verifyOtp, otpStatus } from './routes/auth';
import { portalRoute } from './routes/portal';
import { deliveryRoute } from './routes/delivery';
import { syncBill, cloudBills } from './routes/bills';

const allowedMethods = 'GET, POST, PATCH, DELETE, OPTIONS';

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  if (origin && origin === env.PORTAL_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  headers.set('Access-Control-Allow-Methods', allowedMethods);
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
  headers.set('Vary', 'Origin');
  return headers;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = requestId();
    if (env.PORTAL_ENABLED === 'true' && (
      !env.PORTAL_DB || !env.PC_BRIDGE_STORE_REF ||
      !env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY ||
      !/^https:\/\//.test(env.PORTAL_ORIGIN || '') ||
      [env.POS_SHARED_SECRET, env.RECEIPT_TOKEN_SECRET, env.OTP_HMAC_SECRET,
        env.SESSION_SECRET, env.PC_BRIDGE_TOKEN, env.DELIVERY_ENCRYPTION_KEY]
        .some(value => !value || value.length < 32)
    )) return error('PORTAL_NOT_CONFIGURED', 'Customer access is not configured.', id, 503);
    const cors = corsHeaders(request, env);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('Origin') && request.headers.get('Origin') !== env.PORTAL_ORIGIN) return error('ORIGIN_REJECTED', 'Request origin is not allowed.', id, 403);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    let response: Response;
    try {
    if (request.method === 'GET' && url.pathname === '/health') {
      response = json({ success: true, service: 'customer-portal-api', environment: env.ENVIRONMENT, customerAccessEnabled: env.PORTAL_ENABLED === 'true' }, id);
    } else if (url.pathname === '/api/config' && request.method === 'GET') {
      response = json({ enabled: env.PORTAL_ENABLED === 'true', siteKey: env.TURNSTILE_SITE_KEY || '' }, id);
    } else if (url.pathname.startsWith('/internal/delivery/')) {
      response = await deliveryRoute(request, env, id, url.pathname);
    } else if (url.pathname === '/internal/bills' && request.method === 'POST') {
      response = await syncBill(request, env, id);
    } else if (env.PORTAL_ENABLED !== 'true') {
      response = error('PORTAL_NOT_READY', 'Customer access is temporarily unavailable while setup is completed.', id, 503);
    } else if (request.method === 'POST' && url.pathname === '/internal/receipts') {
      response = await createReceipt(request, env, id);
    } else if (request.method === 'GET' && url.pathname.startsWith('/api/receipts/')) {
      response = await lookupReceipt(request, env, decodeURIComponent(url.pathname.slice('/api/receipts/'.length)), id);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/otp/request') {
      response = await requestOtp(request, env, id);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/otp/verify') {
      response = await verifyOtp(request, env, id);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/otp/status') {
      response = await otpStatus(request, env, id);
    } else if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      response = await logout(request, env, id);
    } else if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      response = await session(request, env, id);
    } else if (url.pathname === '/api/portal/bills' && request.method === 'GET') {
      response = await cloudBills(request, env, id);
    } else if (url.pathname.startsWith('/api/portal/')) {
      response = await portalRoute(request, env, id, url.pathname);
    } else {
      response = error('NOT_FOUND', 'The requested API endpoint does not exist.', id, 404);
    }
    } catch {
      console.error(JSON.stringify({ event: 'portal_request_failed', requestId: id }));
      response = error('PORTAL_UNAVAILABLE', 'The portal is temporarily unavailable. Please try again later.', id, 503);
    }
    cors.forEach((value, key) => response.headers.set(key, value));
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    if (!env.PORTAL_DB) return;
    // Retain OTPs briefly, sessions for operational diagnosis, and audit logs
    // longer; never delete POS accounting records from this Worker.
    await env.PORTAL_DB.batch([
      env.PORTAL_DB.prepare("DELETE FROM portal_delivery_jobs WHERE datetime(expires_at) <= datetime('now')"),
      env.PORTAL_DB.prepare("DELETE FROM portal_rate_limits WHERE expires_at < unixepoch()"),
      env.PORTAL_DB.prepare("DELETE FROM otp_requests WHERE datetime(created_at) < datetime('now', '-30 days')"),
      env.PORTAL_DB.prepare("DELETE FROM portal_sessions WHERE (revoked_at IS NOT NULL OR datetime(expires_at) < datetime('now')) AND datetime(created_at) < datetime('now', '-30 days')"),
      env.PORTAL_DB.prepare("DELETE FROM portal_audit_logs WHERE datetime(created_at) < datetime('now', '-365 days')"),
    ]);
  },
} satisfies ExportedHandler<Env>;
