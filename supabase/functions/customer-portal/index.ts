import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Vary': 'Origin' },
});

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 9) return `94${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `94${digits.slice(1)}`;
  return digits;
};

const phoneVariants = (phone: string) => {
  const normalized = normalizePhone(phone);
  if (!/^94\d{9}$/.test(normalized)) return [normalized];
  const local = `0${normalized.slice(2)}`;
  return [normalized, `+${normalized}`, local, normalized.slice(2)];
};

const hash = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const whatsappWebhook = Deno.env.get('WHATSAPP_OTP_WEBHOOK_URL');
  if (!url || !serviceKey) return json({ success: false, error: 'Customer portal service is not configured.' }, 503);

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return json({ success: false, error: 'Invalid request' }, 400);
  const phone = normalizePhone(String(body.phone || ''));
  const storeId = String(body.store_id || 'default');

  if (body.action === 'verify-receipt-link') {
    if (!whatsappWebhook) return json({ success: false, error: 'Receipt verification is not configured.' }, 503);
    const invoiceNo = String(body.invoice_no || '').trim().toUpperCase();
    const receiptToken = String(body.receipt_token || '');
    if (!invoiceNo || !receiptToken) return json({ success: false, error: 'Invalid receipt link.' }, 400);
    // A QR link only starts verification. It never returns a bill or creates a
    // session; the OTP still goes to the billing mobile number.
    const { data: invoice } = await db.from('invoices').select('customer_phone, store_id').eq('id', invoiceNo).eq('token', receiptToken).maybeSingle();
    if (!invoice) return json({ success: false, error: 'Invalid or expired receipt link.' }, 401);
    const receiptPhone = normalizePhone(invoice.customer_phone);
    const code = randomCode();
    const { error } = await db.from('customer_portal_otps').insert({ phone: receiptPhone, store_id: invoice.store_id || storeId, code_hash: await hash(code), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    if (error) return json({ success: false, error: 'Could not create verification code.' }, 500);
    const delivery = await fetch(whatsappWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: receiptPhone, body: `Your I-Store verification code is ${code}. It expires in 10 minutes. Do not share this code.` }) });
    if (!delivery.ok) return json({ success: false, error: 'Could not deliver the WhatsApp code. Please try again.' }, 502);
    return json({ success: true, message: 'Verification code sent to the purchase WhatsApp number.' });
  }

  if (body.action === 'request-otp') {
    if (body.channel && body.channel !== 'whatsapp') return json({ success: false, error: 'Only WhatsApp verification is available.' }, 400);
    if (!whatsappWebhook) return json({ success: false, error: 'WhatsApp verification is not configured.' }, 503);
    if (!/^94\d{9}$/.test(phone)) return json({ success: false, error: 'Enter a valid Sri Lankan mobile number.' }, 400);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await db.from('customer_portal_otps').select('id', { count: 'exact', head: true }).eq('phone', phone).gte('created_at', tenMinutesAgo);
    if ((count || 0) >= 3) return json({ success: false, error: 'Too many codes requested. Please wait ten minutes.' }, 429);

    const code = randomCode();
    const { error } = await db.from('customer_portal_otps').insert({ phone, store_id: storeId, code_hash: await hash(code), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    if (error) return json({ success: false, error: 'Could not create verification code.' }, 500);
    const delivery = await fetch(whatsappWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: phone, body: `Your I-Store verification code is ${code}. It expires in 10 minutes. Do not share this code.` }) });
    if (!delivery.ok) return json({ success: false, error: 'Could not deliver the WhatsApp code. Please try again.' }, 502);
    return json({ success: true, message: 'Verification code sent to WhatsApp.' });
  }

  if (body.action === 'verify-otp') {
    const code = String(body.code || '');
    if (!/^94\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) return json({ success: false, error: 'Invalid verification details.' }, 400);
    const now = new Date().toISOString();
    const { data: otp } = await db.from('customer_portal_otps').select('*').eq('phone', phone).eq('store_id', storeId).is('consumed_at', null).gt('expires_at', now).lt('attempts', 5).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!otp || otp.code_hash !== await hash(code)) {
      if (otp) await db.from('customer_portal_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      return json({ success: false, error: 'Incorrect or expired verification code.' }, 401);
    }
    await db.from('customer_portal_otps').update({ consumed_at: now }).eq('id', otp.id);
    const sessionToken = randomToken();
    await db.from('customer_portal_sessions').insert({ token_hash: await hash(sessionToken), phone, store_id: storeId, expires_at: new Date(Date.now() + 30 * 60_000).toISOString() });
    const { data: invoices, error } = await db.from('invoices').select('id, store_id, customer_name, customer_phone, customer_email, subtotal, discount, tax, total, payment_method, loyalty_points, status, created_at, invoice_items(*)').eq('store_id', storeId).in('customer_phone', phoneVariants(phone)).order('created_at', { ascending: false });
    if (error) return json({ success: false, error: 'Could not load authorised bills.' }, 500);
    return json({ success: true, session_token: sessionToken, invoices: invoices || [], customer_name: invoices?.[0]?.customer_name || '' });
  }

  const sessionToken = String(body.session_token || '');
  if (!sessionToken) return json({ success: false, error: 'Verification is required.' }, 401);
  const { data: session } = await db.from('customer_portal_sessions')
    .select('phone, store_id').eq('token_hash', await hash(sessionToken)).is('revoked_at', null)
    .gt('expires_at', new Date().toISOString()).maybeSingle();
  if (!session) return json({ success: false, error: 'Your session has expired. Please verify your number again.' }, 401);

  if (body.action === 'get-invoices') {
    const { data: invoices, error } = await db.from('invoices')
      .select('id, store_id, customer_name, customer_phone, customer_email, subtotal, discount, tax, total, payment_method, loyalty_points, status, created_at, invoice_items(*)')
      .eq('store_id', session.store_id).in('customer_phone', phoneVariants(session.phone))
      .order('created_at', { ascending: false });
    if (error) return json({ success: false, error: 'Could not load authorised bills.' }, 500);
    return json({ success: true, invoices: invoices || [], customer_name: invoices?.[0]?.customer_name || '' });
  }

  if (body.action === 'get-portal-state') {
    const [repairs, claims, appointments] = await Promise.all([
      db.from('repair_tickets').select('*').eq('store_id', session.store_id).in('customer_phone', phoneVariants(session.phone)).order('created_at', { ascending: false }),
      db.from('warranty_claims').select('*').eq('store_id', session.store_id).in('contact_phone', phoneVariants(session.phone)).order('created_at', { ascending: false }),
      db.from('service_appointments').select('*').eq('store_id', session.store_id).in('customer_phone', phoneVariants(session.phone)).order('created_at', { ascending: false }),
    ]);
    return json({ success: true, repairs: repairs.data || [], claims: claims.data || [], appointments: appointments.data || [] });
  }

  if (body.action === 'create-repair') {
    const issue = String(body.issue_description || '').trim();
    const device = String(body.device_name || '').trim();
    if (!issue || !device) return json({ success: false, error: 'A device and issue description are required.' }, 400);
    const id = `REP-${Date.now()}-${crypto.getRandomValues(new Uint16Array(1))[0].toString(36).toUpperCase()}`;
    const { data, error } = await db.from('repair_tickets').insert({ id, store_id: session.store_id, customer_phone: session.phone, device_name: device, imei_or_serial: String(body.imei_or_serial || ''), issue_description: issue, status: 'Submitted' }).select().single();
    return error ? json({ success: false, error: 'Could not create repair request.' }, 500) : json({ success: true, repair: data });
  }

  if (body.action === 'create-appointment') {
    const device = String(body.device_name || '').trim();
    const service = String(body.service_type || '').trim();
    const date = String(body.date || '').trim();
    const slot = String(body.time_slot || '').trim();
    if (!device || !service || !date || !slot) return json({ success: false, error: 'Complete every appointment field.' }, 400);
    const id = `APT-${Date.now()}-${crypto.getRandomValues(new Uint16Array(1))[0].toString(36).toUpperCase()}`;
    const { data, error } = await db.from('service_appointments').insert({ id, store_id: session.store_id, customer_phone: session.phone, device_name: device, service_type: service, date, time_slot: slot, status: 'Confirmed' }).select().single();
    return error ? json({ success: false, error: 'Could not book the appointment.' }, 500) : json({ success: true, appointment: data });
  }

  if (body.action === 'create-warranty-claim') {
    const invoiceId = String(body.invoice_id || '').trim();
    const device = String(body.device_name || '').trim();
    const issue = String(body.issue_description || '').trim();
    if (!invoiceId || !device || !issue) return json({ success: false, error: 'Complete the warranty claim details.' }, 400);
    const { data: invoice } = await db.from('invoices').select('id').eq('id', invoiceId).eq('store_id', session.store_id).in('customer_phone', phoneVariants(session.phone)).maybeSingle();
    if (!invoice) return json({ success: false, error: 'This item is not available for your account.' }, 403);
    const id = `WC-${Date.now()}-${crypto.getRandomValues(new Uint16Array(1))[0].toString(36).toUpperCase()}`;
    const { data, error } = await db.from('warranty_claims').insert({ id, store_id: session.store_id, invoice_id: invoiceId, device_name: device, serial_or_imei: String(body.serial_or_imei || ''), contact_phone: session.phone, issue_category: String(body.issue_category || 'Other'), issue_description: issue, status: 'Under Review' }).select().single();
    return error ? json({ success: false, error: 'Could not submit the warranty claim.' }, 500) : json({ success: true, claim: data });
  }

  if (body.action === 'submit-feedback') {
    const rating = Number(body.rating);
    const invoiceId = String(body.invoice_id || '');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !invoiceId) return json({ success: false, error: 'A bill and rating are required.' }, 400);
    const { data: invoice } = await db.from('invoices').select('id, customer_name').eq('id', invoiceId).eq('store_id', session.store_id).in('customer_phone', phoneVariants(session.phone)).maybeSingle();
    if (!invoice) return json({ success: false, error: 'This bill is not available for feedback.' }, 403);
    const { error } = await db.from('customer_feedback').insert({ invoice_id: invoiceId, store_id: session.store_id, customer_phone: session.phone, customer_name: invoice.customer_name, rating, comment: String(body.comment || '').slice(0, 2000) });
    return error ? json({ success: false, error: 'Could not submit feedback.' }, 500) : json({ success: true });
  }
  return json({ success: false, error: 'Unsupported action' }, 400);
});
