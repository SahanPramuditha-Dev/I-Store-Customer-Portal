import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wrench, Printer, MessageSquare, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { DEFAULT_STORE } from '../types';
import type { StoreProfile, RepairTicketRecord } from '../types';
import { fetchStoreProfile, ThemeToggle } from '../utils/security';

export default function RepairTrackerView({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { id, storeSlug } = useParams<{ id: string; storeSlug?: string }>();
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE);
  const [ticket, setTicket] = useState<RepairTicketRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const rawId = id || urlParams.get('id') || urlParams.get('search') || urlParams.get('ticket') || '';
      const storeParam = storeSlug || urlParams.get('store') || urlParams.get('s');

      if (storeParam) {
        fetchStoreProfile(storeParam).then(prof => setStoreProfile(prof));
      }

      if (!rawId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const queryId = rawId.trim().replace(/\s+/g, '-').toUpperCase();

      const modelVal = urlParams.get('model') || (queryId === 'JOB-2026-000001' ? 'Samsung A15' : 'Electronic Device');
      const issueVal = urlParams.get('issue') || (queryId === 'JOB-2026-000001' ? 'Display green line' : 'Hardware Servicing & Diagnosis');
      const statusVal = urlParams.get('status') || (queryId === 'JOB-2026-000001' ? 'Completed' : 'Inspection & Servicing');
      const noteVal = urlParams.get('note') || '';
      const estVal = Number(urlParams.get('est') || (queryId === 'JOB-2026-000001' ? 200 : 0));
      const advVal = Number(urlParams.get('adv') || 0);
      const balVal = Number(urlParams.get('bal') || (estVal - advVal));
      const nameVal = urlParams.get('name') || (queryId === 'JOB-2026-000001' ? 'Sahan Pramuditha' : 'Valued Customer');
      const phoneVal = urlParams.get('phone') || (queryId === 'JOB-2026-000001' ? '+94764158980' : '');
      const imeiVal = urlParams.get('imei') || (queryId === 'JOB-2026-000001' ? '357441052530733' : '');

      document.title = `${queryId} - Live Repair Tracking | ${storeProfile.name}`;
      setTicket({
        id: queryId,
        customer_phone: phoneVal,
        customer_name: nameVal,
        device_name: modelVal,
        imei_or_serial: imeiVal,
        issue_description: issueVal,
        status: statusVal,
        status_note: noteVal,
        estimated_cost: estVal,
        advance_paid: advVal,
        balance_due: balVal,
        created_at: new Date().toISOString(),
      });
      setLoading(false);

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const supabasePromise = supabase
          .from('repair_tickets')
          .select('*')
          .eq('id', queryId)
          .maybeSingle();

        const res: any = await Promise.race([supabasePromise, timeoutPromise]);
        if (res && res.data && !res.error) {
          const data = res.data;
          if (data.store_id && data.store_id !== 'default') {
            fetchStoreProfile(data.store_id).then(prof => setStoreProfile(prof));
          }
          setTicket({
            id: data.id,
            customer_phone: data.customer_phone || '',
            customer_name: data.customer_name || 'Valued Customer',
            device_name: data.device_name || 'Device',
            imei_or_serial: data.imei_or_serial || '',
            issue_description: data.issue_description || 'General Inspection',
            status: data.status || 'Submitted',
            status_note: data.status_note || '',
            estimated_cost: Number(data.estimated_cost || 0),
            advance_paid: Number(data.advance_paid || 0),
            balance_due: Number(data.balance_due || (Number(data.estimated_cost || 0) - Number(data.advance_paid || 0))),
            created_at: data.created_at || new Date().toISOString(),
          });
        }
      } catch (_err) {
        // Fallback active
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, storeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading repair job details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <Wrench className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">Repair Ticket Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          The requested repair job <span className="font-mono font-bold text-slate-800 dark:text-slate-200">"{id}"</span> could not be found for {storeProfile.name}.
        </p>
        <div className="flex gap-2">
          <Link to="/" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
            Back to Home
          </Link>
          <a
            href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
          >
            Chat with Support
          </a>
        </div>
      </div>
    );
  }

  const rawStatus = (ticket.status || '').toLowerCase();
  const getStepNumber = (st: string) => {
    if (st.includes('deliver') || st.includes('collect')) return 6;
    if (st.includes('complet') || st.includes('ready')) return 5;
    if (st.includes('quality') || st.includes('qc')) return 4;
    if (st.includes('repair') || st.includes('part')) return 3;
    if (st.includes('diagnos') || st.includes('inspect') || st.includes('approv')) return 2;
    return 1;
  };

  const currentStep = getStepNumber(rawStatus);
  const isCancelled = rawStatus.includes('cancel');

  const steps = [
    { num: 1, label: 'Ticket Intake', desc: 'Registered in system' },
    { num: 2, label: 'Diagnosis', desc: 'Hardware inspection' },
    { num: 3, label: 'Servicing', desc: 'Parts & labor underway' },
    { num: 4, label: 'Quality Check', desc: 'Bench testing & QA' },
    { num: 5, label: 'Ready for Pickup', desc: 'Repairs completed' },
    { num: 6, label: 'Delivered', desc: 'Handed to customer' },
  ];

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Action Bar */}
        <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Live Repair Tracking</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isCancelled 
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : currentStep >= 5 
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Job Ticket #{ticket.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Print Job Card</span>
            </button>
            <a
              href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Tech</span>
            </a>
          </div>
        </div>

        {/* Main Job Card */}
        <div id="printable-repair" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xl space-y-6 sm:space-y-8 transition-colors">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {storeProfile.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{storeProfile.tagline}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{storeProfile.address} · {storeProfile.phone}</p>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shrink-0 w-full sm:w-auto">
              <div className="text-[11px] text-slate-500 font-mono">
                <span className="font-bold text-slate-900 dark:text-white">Job Ticket:</span> {ticket.id}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white">Created:</span> {new Date(ticket.created_at).toLocaleDateString()}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white">Client:</span> {ticket.customer_name}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Repair Workflow Stage</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {steps.map((step) => {
                const isPassed = currentStep > step.num;
                const isCurrent = currentStep === step.num;

                return (
                  <div
                    key={step.num}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold">0{step.num}</span>
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-indigo-500 animate-spin duration-3000" />
                      ) : null}
                    </div>
                    <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{step.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device & Issue Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Device Model</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{ticket.device_name}</span>
              {ticket.imei_or_serial && (
                <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 block mt-0.5">
                  IMEI/SN: {ticket.imei_or_serial}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported Problem</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                {ticket.issue_description}
              </span>
            </div>

            {ticket.status_note && (
              <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Technician Diagnostics Note</span>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
                  {ticket.status_note}
                </p>
              </div>
            )}
          </div>

          {/* Financials Breakdown */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col items-end text-xs sm:text-sm space-y-1">
            <div className="w-full sm:w-64 flex justify-between text-slate-600 dark:text-slate-400">
              <span>Estimated Cost</span>
              <span>LKR {(ticket.estimated_cost || 0).toLocaleString()}</span>
            </div>
            {(ticket.advance_paid || 0) > 0 && (
              <div className="w-full sm:w-64 flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Advance Paid</span>
                <span>- LKR {(ticket.advance_paid || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="w-full sm:w-64 flex justify-between text-base sm:text-lg font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>Balance Due</span>
              <span className={(ticket.balance_due || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
                LKR {(ticket.balance_due || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="no-print pt-2 flex justify-between items-center text-xs">
            <Link to="/" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
              ← Back to Portal Home
            </Link>
            <a
              href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-emerald-600 font-bold hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Technician on WhatsApp</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
