import type { Env } from '../types/env';
import { requirePortalSession, requestContext } from '../middleware/auth';
import { audit } from '../services/audit';
import { posRequest } from '../services/pos';
import { error, json } from '../utils/responses';

async function securedPos(request: Request, env: Env, id: string, posPath: string, init?: RequestInit, eventType?: string): Promise<Response> {
  const session = await requirePortalSession(request, env);
  if (!session) return error('SESSION_EXPIRED', 'Verification is required.', id, 401);
  const upstream = await posRequest(env, session.customerRef, session.receiptId, posPath, init);
  if (!upstream.ok) return error('PORTAL_DATA_UNAVAILABLE', 'Portal data is temporarily unavailable.', id, upstream.status >= 500 ? 503 : upstream.status);
  const body = await upstream.json().catch(() => null);
  if (eventType) await audit(env, eventType, { customerRef: session.customerRef, receiptId: session.receiptId, ...(await requestContext(request, env)) });
  return json({ success: true, data: body }, id, upstream.status);
}

export async function portalRoute(request: Request, env: Env, id: string, pathname: string): Promise<Response> {
  const method = request.method;
  const billMatch = pathname.match(/^\/api\/portal\/bills\/([^/]+)(?:\/(download|resend))?$/);
  const warrantyMatch = pathname.match(/^\/api\/portal\/warranties\/([^/]+)$/);
  const repairMatch = pathname.match(/^\/api\/portal\/repairs\/([^/]+)$/);
  const appointmentMatch = pathname.match(/^\/api\/portal\/appointments\/([^/]+)$/);
  if (method === 'GET' && pathname === '/api/portal/bills') return securedPos(request, env, id, '/portal/bills');
  if (billMatch && method === 'GET' && !billMatch[2]) return securedPos(request, env, id, `/portal/bills/${encodeURIComponent(billMatch[1])}`, undefined, 'invoice_viewed');
  if (billMatch?.[2] === 'download' && method === 'GET') return securedPos(request, env, id, `/portal/bills/${encodeURIComponent(billMatch[1])}/download`, undefined, 'invoice_downloaded');
  if (billMatch?.[2] === 'resend' && method === 'POST') return securedPos(request, env, id, `/portal/bills/${encodeURIComponent(billMatch[1])}/resend`, { method: 'POST' }, 'invoice_resent');
  if (method === 'GET' && pathname === '/api/portal/warranties') return securedPos(request, env, id, '/portal/warranties');
  if (warrantyMatch && method === 'GET') return securedPos(request, env, id, `/portal/warranties/${encodeURIComponent(warrantyMatch[1])}`);
  if (method === 'POST' && pathname === '/api/portal/warranty-claims') return securedPos(request, env, id, '/portal/warranty-claims', { method: 'POST', body: await request.text() }, 'warranty_claim_created');
  if (method === 'GET' && pathname === '/api/portal/repairs') return securedPos(request, env, id, '/portal/repairs');
  if (repairMatch && method === 'GET') return securedPos(request, env, id, `/portal/repairs/${encodeURIComponent(repairMatch[1])}`);
  if (method === 'POST' && pathname === '/api/portal/repairs') return securedPos(request, env, id, '/portal/repairs', { method: 'POST', body: await request.text() }, 'repair_created');
  if (method === 'GET' && pathname === '/api/portal/appointments') return securedPos(request, env, id, '/portal/appointments');
  if (appointmentMatch && method === 'PATCH') return securedPos(request, env, id, `/portal/appointments/${encodeURIComponent(appointmentMatch[1])}`, { method: 'PATCH', body: await request.text() }, 'appointment_updated');
  if (appointmentMatch && method === 'DELETE') return securedPos(request, env, id, `/portal/appointments/${encodeURIComponent(appointmentMatch[1])}`, { method: 'DELETE' }, 'appointment_cancelled');
  if (method === 'POST' && pathname === '/api/portal/appointments') return securedPos(request, env, id, '/portal/appointments', { method: 'POST', body: await request.text() }, 'appointment_created');
  if (method === 'POST' && pathname === '/api/portal/feedback') return securedPos(request, env, id, '/portal/feedback', { method: 'POST', body: await request.text() }, 'feedback_created');
  return error('NOT_FOUND', 'The requested portal endpoint does not exist.', id, 404);
}
