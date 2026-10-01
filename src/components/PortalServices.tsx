import { useEffect, useState } from 'react';

type RequestApi = (path: string, body?: unknown, method?: string) => Promise<{ data: Data }>;
type Warranty = { id: number; code: string; product: string; status: string; endDate: string };
type Repair = { id: number; ticketNumber: string; deviceModel: string; status: string; issue: string };
type ServiceRequest = { id: string; kind: string; message: string; status: string; requestedAt?: string; staffResponse?: string };
type Data = { warranties: Warranty[]; repairs: Repair[]; requests: ServiceRequest[] };

export default function PortalServices({ request, invoiceRef }: { request: RequestApi; invoiceRef?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('repairs');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [warrantyId, setWarrantyId] = useState('');
  const [editing, setEditing] = useState('');

  async function load() {
    const results = await Promise.all(['warranties', 'repairs', 'requests'].map(name => request(`/api/portal/${name}`)));
    setData({ warranties: results[0].data.warranties, repairs: results[1].data.repairs, requests: results[2].data.requests });
  }
  useEffect(() => {
    let active = true;
    void Promise.all(['warranties', 'repairs', 'requests'].map(name => request(`/api/portal/${name}`))).then(results => {
      if (active) setData({ warranties: results[0].data.warranties, repairs: results[1].data.repairs, requests: results[2].data.requests });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [request]);

  async function submit() {
    setBusy(true); setError(''); setNotice('');
    try {
      const body = { message, ...(kind === 'warranty-claims' ? { warranty_id: Number(warrantyId) } : {}), ...(kind === 'appointments' ? { requested_at: new Date(date).toISOString() } : {}) };
      await request(`/api/portal/${kind}${editing ? `/${encodeURIComponent(editing)}` : ''}`, body, editing ? 'PATCH' : 'POST');
      setNotice('Your request was saved for shop review. An appointment is confirmed only when its status says confirmed.');
      setMessage(''); setDate(''); setEditing(''); await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function cancel(id: string) {
    setBusy(true); setError(''); setNotice('');
    try { await request(`/api/portal/appointments/${encodeURIComponent(id)}`, undefined, 'DELETE'); await load(); setNotice('Appointment cancelled.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError(''); setNotice('');
    try { await request(`/api/portal/bills/${encodeURIComponent(invoiceRef!)}/resend`, {}); await load(); setNotice('The shop received your resend request. This does not confirm WhatsApp delivery.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const field = 'w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-900 p-3';
  return <section className="mt-10 rounded-2xl border border-slate-200 p-6 print:hidden" aria-label="Shop services">
    <h2 className="text-xl font-semibold">Shop services</h2>
    <p className="mt-2 text-sm text-slate-500">Live records need the shop service online. Requests are reviewed by staff.</p>
    {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="my-4 text-cyan-700">{notice}</p>}
    {!data && !error && <p className="mt-4">Loading services…</p>}
    {data && <>
      <div className="grid gap-6 my-6 md:grid-cols-2"><div><h3 className="font-semibold">Warranties</h3>{data.warranties.length === 0 && <p>No warranty records.</p>}{data.warranties.map(w => <p key={w.id} className="mt-3 text-sm">{w.product} · {w.code} · {w.status}<br/>Ends {new Date(w.endDate).toLocaleDateString()}</p>)}</div><div><h3 className="font-semibold">Repairs</h3>{data.repairs.length === 0 && <p>No repair records.</p>}{data.repairs.map(r => <p key={r.id} className="mt-3 text-sm">{r.ticketNumber} · {r.deviceModel} · {r.status}<br/>{r.issue}</p>)}</div></div>
      {invoiceRef && <button disabled={busy} onClick={() => void resend()} className="my-3 underline">Request WhatsApp resend of {invoiceRef}</button>}
      <form onSubmit={e => { e.preventDefault(); void submit(); }} className="grid gap-4 max-w-lg">
        <label>Request type<select value={kind} disabled={busy || !!editing} onChange={e => setKind(e.target.value)} className={field}><option value="repairs">Repair enquiry</option><option value="warranty-claims">Warranty claim request</option><option value="appointments">Appointment request</option><option value="feedback">Feedback</option></select></label>
        {kind === 'warranty-claims' && <label>Warranty<select required value={warrantyId} onChange={e => setWarrantyId(e.target.value)} className={field}><option value="">Select a warranty</option>{data.warranties.map(w => <option key={w.id} value={w.id}>{w.code} · {w.product}</option>)}</select></label>}
        {kind === 'appointments' && <label>Preferred date and time<input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className={field}/></label>}
        <label>Message<textarea required minLength={5} maxLength={2000} rows={3} value={message} onChange={e => setMessage(e.target.value)} className={field}/></label>
        <button disabled={busy || message.trim().length < 5} className="rounded-lg bg-cyan-700 p-3 text-white disabled:opacity-50">{editing ? 'Request appointment change' : 'Submit request'}</button>
        {editing && <button type="button" onClick={() => { setEditing(''); setMessage(''); setDate(''); }}>Discard change</button>}
      </form>
      <h3 className="font-semibold mt-8">Your requests</h3>{data.requests.length === 0 && <p>No requests yet.</p>}
      {data.requests.map(r => <div key={r.id} className="border-b border-slate-200 py-4"><p className="font-medium">{r.kind.replaceAll('_',' ')} · {r.status}</p><p className="text-sm mt-1">{r.message}</p>{r.requestedAt && <p className="text-sm">{new Date(r.requestedAt).toLocaleString()}</p>}{r.staffResponse && <p className="text-sm text-cyan-700">Shop response: {r.staffResponse}</p>}{r.kind === 'appointment' && ['pending','confirmed'].includes(r.status) && <div className="flex gap-4 mt-2"><button disabled={busy} onClick={() => { setKind('appointments'); setEditing(r.id); setMessage(r.message); setDate(''); }} className="underline">Change</button><button disabled={busy} onClick={() => void cancel(r.id)} className="underline">Cancel appointment</button></div>}</div>)}
    </>}
  </section>;
}
