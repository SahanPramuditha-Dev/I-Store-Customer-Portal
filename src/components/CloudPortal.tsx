import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, Receipt, Printer, LogOut, ArrowLeft } from 'lucide-react';
import PortalServices from './PortalServices';

type Bill = { invoiceRef: string; customerName: string; issuedAt: string; currency: string; subtotal: number; discount: number; tax: number; total: number; amountPaid?: number; balanceDue?: number; refundAmount?: number; lastSyncedAt: string; paymentMethod: string; status: string; items: { name: string; quantity: number; unitPrice: number; warrantyMonths: number; serial: string }[] };
type Turnstile = { render: (el: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
const api = async (path: string, body?: unknown, method?: string) => {
  const response = await fetch(path, { method: method || (body === undefined ? 'GET' : 'POST'), credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('The portal service is unavailable. Please try again later.');
  }
  const data = await response.json().catch(() => {
    throw new Error('The portal service returned an invalid response. Please try again later.');
  });
  if (!response.ok) throw new Error(data.error?.message || 'Connection unavailable. Please try again.');
  return data;
};
const money = (value: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(value);

export default function CloudPortal() {
  const token = window.location.pathname.match(/^\/r\/([A-Za-z0-9_-]{32,128})$/)?.[1] || '';
  const [config, setConfig] = useState<{ enabled: boolean; siteKey: string; servicesEnabled?: boolean } | null>(null);
  const [receipt, setReceipt] = useState<{ storeName: string; maskedPhone: string; senderOnline: boolean } | null>(null);
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [challenge, setChallenge] = useState('');
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const widget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otpRequestId || bills) return;
    let active = true;
    let checks = 0;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (!active || ++checks > 30) return;
      if (document.hidden) { timer = setTimeout(check,10000); return; }
      try {
        const status = await api('/api/auth/otp/status',{receiptToken:token,otpRequestId});
        if (!active) return;
        const messages: Record<string,string> = {
          queued: status.senderOnline ? 'Code queued. Waiting for the shop PC to send it.' : 'Code queued, but the shop sender is offline. Delivery may expire; please retry when it reconnects.',
          sent: 'Code sent to WhatsApp. Enter it below. This confirms sending, not delivery to your phone.',
          failed: 'The sender could not confirm sending your code. Please request another code after the cooldown.',
          expired: 'This code has expired. Request a new code.', blocked: 'Too many incorrect attempts. Request a new code.',
        };
        setNotice(messages[status.deliveryStatus] || 'Verification completed.');
        if (status.deliveryStatus !== 'queued') return;
      } catch { if (active) setNotice('Unable to check delivery status. This does not mean your code was sent.'); }
      if (active) timer=setTimeout(check,10000);
    };
    timer=setTimeout(check,10000);
    return () => { active=false; clearTimeout(timer); };
  },[otpRequestId,bills,token]);

  useEffect(() => {
    let active = true;
    void api('/api/config').then(async cfg => {
      if (!active) return;
      setConfig(cfg);
      if (!cfg.enabled) return;
      const session = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
      if (session.ok) {
        const data = await api('/api/portal/bills');
        if (active) setBills(data.bills);
      } else if (token) {
        const data = await api(`/api/receipts/${token}`);
        if (active) setReceipt(data);
      }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    if (!retryAt) return;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [retryAt]);
  useEffect(() => {
    if (!config?.enabled || !config.siteKey || !receipt || bills || !widget.current) return;
    let removed = false;
    let widgetId: string | undefined;
    const ts = () => (window as unknown as { turnstile?: Turnstile }).turnstile;
    const render = () => {
      if (removed || !widget.current || !ts()) return;
      widgetId = ts()!.render(widget.current, { sitekey: config.siteKey, action: 'portal_otp_request', callback: (value: string) => setChallenge(value), 'expired-callback': () => setChallenge(''), 'error-callback': () => { setChallenge(''); setError('Security check unavailable. Please retry.'); } });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-portal-turnstile]');
    if (ts()) render();
    else {
      if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.dataset.portalTurnstile = 'true'; script.async = true; document.head.appendChild(script); }
      script.addEventListener('load', render);
    }
    return () => { removed = true; script?.removeEventListener('load', render); if (widgetId) ts()?.remove(widgetId); };
  }, [config, receipt, bills, challengeVersion]);

  async function requestCode() {
    setBusy(true); setError('');
    try {
      const result = await api('/api/auth/otp/request', { receiptToken: token, turnstileToken: challenge });
      setOtpRequestId(result.otpRequestId);
      setNotice('Your code is queued for WhatsApp. Allow up to 30 seconds while the shop PC is connected. Codes expire after 5 minutes.');
      setRetryAt(Date.now() + 60000); setClock(Date.now());
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); setChallenge(''); setChallengeVersion(v => v + 1); }
  }
  async function verify() {
    setBusy(true); setError('');
    try {
      await api('/api/auth/otp/verify', { receiptToken: token, code: otp });
      const data = await api('/api/portal/bills'); setBills(data.bills); setOtp(''); setOtpRequestId(''); setNotice('');
      window.history.replaceState(null, '', '/'); // Receipt capability need not remain in browser history.
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await api('/api/auth/logout', {}); setBills(null); setSelected(null); setReceipt(null); setNotice('Signed out. Reopen your receipt link to sign in again.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-4xl px-5 py-12 text-slate-900 dark:text-slate-100">
    <header className="flex justify-between items-center mb-10 print:hidden"><div className="flex items-center gap-3"><Receipt className="text-cyan-600"/><div><h1 className="text-xl font-bold">{receipt?.storeName || 'I-Store'} customer portal</h1><p className="text-sm text-slate-500">Your bills, securely in one place</p></div></div>{bills && <button disabled={busy} onClick={logout} className="flex gap-2 items-center"><LogOut size={16}/>Sign out</button>}</header>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 print:hidden">{error}</p>}
    {notice && <p role="status" className="mb-5 rounded-xl bg-cyan-50 p-4 text-cyan-950 print:hidden">{notice}</p>}
    {!config && !error && <p role="status">Connecting securely…</p>}
    {config && !config.enabled && <section className="rounded-2xl border border-slate-200 p-8 bg-white dark:bg-slate-900"><LockKeyhole className="mb-4 text-cyan-600"/><h2 className="text-xl font-semibold">Customer access is being prepared</h2><p className="mt-3 text-slate-500">The shop is completing WhatsApp verification and bill syncing. Please keep your receipt and try again later.</p></section>}
    {config?.enabled && !bills && !receipt && !error && <p>Open the secure link or scan the QR code on your shop receipt to access your bills.</p>}
    {config?.enabled && receipt && !bills && <section className="max-w-md rounded-2xl border border-slate-200 p-7 bg-white dark:bg-slate-900">
      <LockKeyhole className="text-cyan-600 mb-4"/><h2 className="text-xl font-semibold">Verify it’s you</h2><p className="mt-3 mb-4 text-slate-500">We’ll send a code to the registered WhatsApp number {receipt.maskedPhone}.</p>
      {!receipt.senderOnline && <p className="text-amber-800 mb-3">The shop sender was offline when this page loaded. You can retry when it reconnects.</p>}
      <div ref={widget}/>
      <button disabled={busy || !challenge || clock < retryAt} onClick={requestCode} className="w-full rounded-xl bg-cyan-700 px-5 py-3 mt-4 text-white disabled:opacity-50">{clock < retryAt ? `Request again in ${Math.ceil((retryAt-clock)/1000)}s` : 'Send WhatsApp code'}</button>
      <form onSubmit={e => { e.preventDefault(); void verify(); }} className="mt-6"><label htmlFor="otp" className="block mb-2 text-sm font-semibold">Six-digit code</label><input id="otp" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required className="w-full border border-slate-300 rounded-xl p-3 text-xl tracking-widest"/><button disabled={busy || otp.length !== 6} className="mt-3 w-full rounded-xl bg-slate-900 text-white px-5 py-3 disabled:opacity-50">Verify and view bills</button></form>
    </section>}
    {bills && !selected && <section><h2 className="text-2xl font-semibold mb-5">Your bills</h2><p className="text-sm text-slate-500 mb-4">Most recent 50 synced bills. Only bills linked to your verified number are shown.</p>{bills.length === 0 && <p>No bills have been synced yet. Please contact the shop.</p>}<div className="grid gap-3">{bills.map(b => <button key={b.invoiceRef} onClick={() => setSelected(b)} className="flex justify-between text-left rounded-xl border border-slate-200 bg-white dark:bg-slate-900 p-5"><div><p className="font-semibold">{b.invoiceRef}</p><p className="text-sm text-slate-500">{new Date(b.issuedAt).toLocaleDateString()} · {b.status}</p></div><span className="font-semibold">{money(b.total)}</span></button>)}</div></section>}
    {selected && <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 p-6 print:border-0 print:text-black print:bg-white">
      <div className="flex justify-between mb-8 print:hidden"><button onClick={() => setSelected(null)} className="flex gap-2 items-center"><ArrowLeft size={16}/>All bills</button><button onClick={() => window.print()} className="flex gap-2 items-center"><Printer size={16}/>Print / Save PDF</button></div>
      <h2 className="text-2xl font-bold">Bill {selected.invoiceRef}</h2><p className="mt-2">{selected.customerName}</p><p className="text-sm text-slate-500">{new Date(selected.issuedAt).toLocaleString()} · {selected.status}</p>
      <p className="text-xs text-slate-500 mt-2">Last synced: {new Date(selected.lastSyncedAt).toLocaleString()}. Later shop changes may not appear until the PC reconnects.</p>
      <div className="overflow-x-auto"><table className="w-full my-8 text-left"><thead><tr className="border-b"><th className="py-3">Item</th><th>Qty</th><th className="text-right">Unit price</th></tr></thead><tbody>{selected.items.map((x,i) => <tr key={i} className="border-b border-slate-100"><td className="py-4">{x.name}{x.serial && <p className="text-xs text-slate-500">Serial: {x.serial}</p>}{x.warrantyMonths > 0 && <p className="text-xs text-slate-500">Warranty: {x.warrantyMonths} months</p>}</td><td>{x.quantity}</td><td className="text-right">{money(x.unitPrice)}</td></tr>)}</tbody></table></div>
      <dl className="ml-auto max-w-xs space-y-2">{[['Subtotal',selected.subtotal],['Discount',selected.discount],['Tax',selected.tax],['Total',selected.total],['Amount paid',selected.amountPaid],['Balance due',selected.balanceDue],['Refunded',selected.refundAmount]].filter(([,value])=>value!==undefined).map(([label,value]) => <div key={String(label)} className="flex justify-between"><dt>{label}</dt><dd className="font-semibold">{money(Number(value))}</dd></div>)}</dl><p className="mt-6 text-sm">Payment: {selected.paymentMethod}</p>
    </article>}
    {bills && config?.servicesEnabled && <PortalServices request={api} invoiceRef={selected?.invoiceRef} />}
    <footer className="mt-12 text-xs text-slate-500 print:hidden">Never share your verification code. Synced bills remain accessible during an active session even when the shop PC is offline.</footer>
  </main>;
}
