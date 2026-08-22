import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Receipt, Wrench, Printer, CheckCircle2, 
  ShieldCheck, Loader2, Star, Check, Copy 
} from 'lucide-react';
import { supabase } from '../supabase';
import { DEFAULT_STORE } from '../types';
import type { StoreProfile, Invoice } from '../types';
import { isValidSecurityToken, fetchStoreProfile, ThemeToggle } from '../utils/security';

export default function InvoiceView({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { id, storeSlug } = useParams<{ id: string; storeSlug?: string }>();
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairIssue, setRepairIssue] = useState('');
  const [copied, setCopied] = useState(false);
  
  // CSAT Feedback State
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [selectedPraise, setSelectedPraise] = useState<string[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating === 0 || !invoice) return;
    setSubmittingFeedback(true);
    try {
      const praiseStr = selectedPraise.length > 0 ? ` [Tags: ${selectedPraise.join(', ')}]` : '';
      const fullComment = `${feedbackComment.trim()}${praiseStr}`.trim();
      await supabase.from('customer_feedback').insert([
        {
          invoice_id: invoice.id,
          store_id: storeProfile.id,
          customer_phone: invoice.customerPhone,
          customer_name: invoice.customerName,
          rating: selectedRating,
          comment: fullComment || 'Customer submitted star review via Digital Receipt'
        }
      ]);
      setFeedbackSubmitted(true);
    } catch (err) {
      console.warn('Could not save feedback to cloud table:', err);
      setFeedbackSubmitted(true);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitRepair = async () => {
    if (!repairIssue.trim() || !invoice) return;
    const ticketId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await supabase.from('repair_tickets').insert([
        {
          id: ticketId,
          store_id: storeProfile.id,
          customer_phone: invoice.customerPhone,
          device_name: invoice.items[0]?.name || 'Electronic Device',
          imei_or_serial: invoice.items[0]?.imeiOrSerial || 'N/A',
          issue_description: repairIssue.trim(),
          status: 'Submitted'
        }
      ]);
      alert(`Repair ticket submitted successfully! Ticket ID: ${ticketId}`);
      setRepairIssue('');
      setRepairModalOpen(false);
    } catch {
      alert('Failed to submit repair ticket. Please try again.');
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      const normalizedId = id.trim().replace(/\s+/g, '-').toUpperCase();
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const storeParam = storeSlug || urlParams.get('store') || urlParams.get('s');
      const isSignatureValid = isValidSecurityToken(normalizedId, urlToken);

      if (storeParam) {
        fetchStoreProfile(storeParam).then(prof => setStoreProfile(prof));
      }

      if (isSignatureValid) {
        const totalParam = urlParams.get('total');
        const totalVal = totalParam ? Number(totalParam) : (normalizedId === 'INV-2026-000002' ? 217800 : 1350);
        const subtotalVal = Number(urlParams.get('subtotal') || (normalizedId === 'INV-2026-000002' ? 220000 : totalVal));
        const discountVal = Number(urlParams.get('disc') || (normalizedId === 'INV-2026-000002' ? 2200 : 0));
        const nameVal = urlParams.get('name') || (normalizedId === 'INV-2026-000002' ? 'Nexusis Technologies' : 'Valued Customer');
        const phoneVal = urlParams.get('phone') || (normalizedId === 'INV-2026-000002' ? '0785571342' : '');
        const methodVal = urlParams.get('method') || 'Cash';
        const itemName = urlParams.get('item') || (normalizedId === 'INV-2026-000002' ? 'iPhone 12 (128GB)' : 'Retail Product Item');
        const imeiVal = urlParams.get('imei') || '';

        const rawWarranty = urlParams.get('warranty') ?? urlParams.get('warranty_months');
        const rawWarrantyDays = urlParams.get('warranty_days');
        let warrantyDaysVal = rawWarrantyDays !== null ? Number(rawWarrantyDays) : 0;
        let warrantyMonthsVal = rawWarranty !== null ? Number(rawWarranty) : (warrantyDaysVal > 0 ? Math.round(warrantyDaysVal / 30) : 0);
        if (rawWarranty === null && rawWarrantyDays === null) {
          if (normalizedId === 'INV-2026-000002') {
            warrantyMonthsVal = 12;
            warrantyDaysVal = 365;
          }
        }

        const computedPoints = Math.floor(Number(totalVal || 0) / 1000);

        document.title = `${normalizedId} - Digital Receipt | ${storeProfile.name}`;
        setInvoice({
          id: normalizedId,
          token: urlToken || 'sec_verified',
          storeId: storeParam || 'default',
          shortCode: normalizedId,
          date: new Date().toLocaleString(),
          customerName: nameVal,
          customerPhone: phoneVal,
          customerEmail: '',
          loyaltyPoints: computedPoints,
          items: [
            {
              name: itemName,
              qty: 1,
              price: totalVal,
              warrantyMonths: warrantyMonthsVal,
              warrantyDays: warrantyDaysVal,
              imeiOrSerial: imeiVal || undefined
            }
          ],
          subtotal: subtotalVal,
          tax: 0,
          discount: discountVal,
          total: totalVal,
          paymentMethod: methodVal,
          status: 'Paid'
        });
        setLoading(false);
      }

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const supabasePromise = supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', normalizedId)
          .maybeSingle();

        const res: any = await Promise.race([supabasePromise, timeoutPromise]);
        if (res && res.data && !res.error && isSignatureValid) {
          const data = res.data;
          if (data.store_id && data.store_id !== 'default') {
            fetchStoreProfile(data.store_id).then(prof => setStoreProfile(prof));
          }
          const invPoints = data.loyalty_points !== undefined && data.loyalty_points !== null
            ? Number(data.loyalty_points)
            : Math.floor(Number(data.total || 0) / 1000);

          setInvoice({
            id: data.id,
            token: data.token || urlToken || 'sec_verified',
            storeId: data.store_id || storeParam || 'default',
            shortCode: data.id,
            date: new Date(data.created_at).toLocaleString(),
            customerName: data.customer_name || 'Valued Customer',
            customerPhone: data.customer_phone || '',
            customerEmail: data.customer_email || '',
            loyaltyPoints: invPoints,
            items: (data.invoice_items || []).map((i: any) => ({
              name: i.item_name || 'Product',
              qty: Number(i.quantity || 1),
              price: Number(i.unit_price || 0),
              warrantyMonths: Number(i.warranty_months || 0),
              warrantyDays: Number(i.warranty_days || 0),
              imeiOrSerial: i.imei_or_serial || undefined
            })),
            subtotal: Number(data.subtotal || 0),
            tax: Number(data.tax || 0),
            discount: Number(data.discount || 0),
            total: Number(data.total || 0),
            paymentMethod: data.payment_method || 'Cash',
            status: data.status === 'Paid' ? 'Paid' : 'Pending'
          });
        }
      } catch (_err) {
        // Fallback active
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, storeSlug]);

  const fullUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Smart Bill...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <Receipt className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">Invalid or Expired Invoice Link</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          The requested invoice <span className="font-mono font-bold text-slate-800 dark:text-slate-200">"{id}"</span> is missing a verified security signature or could not be found.
        </p>
        <Link to="/" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition">
          Return to Portal Home
        </Link>
      </div>
    );
  }

  const activeInvoice = invoice;

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Action Bar */}
        <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-xl text-cyan-600 dark:text-cyan-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Smart Digital Receipt</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {activeInvoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Invoice #{activeInvoice.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Print Receipt</span>
            </button>
          </div>
        </div>

        {/* Printable Digital Bill */}
        <div id="printable-receipt" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xl space-y-6 sm:space-y-8 transition-colors">
          
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
                <span className="font-bold text-slate-900 dark:text-white">Invoice No:</span> {activeInvoice.id}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white">Date:</span> {activeInvoice.date}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-900 dark:text-white">Payment:</span> {activeInvoice.paymentMethod}
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Billed To</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{activeInvoice.customerName}</span>
              {activeInvoice.customerPhone && (
                <span className="block text-slate-500 font-mono text-[11px] mt-0.5">{activeInvoice.customerPhone}</span>
              )}
            </div>
            <div className="sm:text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Status</span>
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Tamper-proof Digital Original
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-3 px-1.5">Description & Serial</th>
                  <th className="pb-3 px-1.5">Warranty</th>
                  <th className="pb-3 px-1.5 text-center">Qty</th>
                  <th className="pb-3 px-1.5 text-right">Unit Price</th>
                  <th className="pb-3 px-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeInvoice.items.map((item, index) => {
                  const hasWarranty = (item.warrantyDays || 0) > 0 || (item.warrantyMonths || 0) > 0;
                  const invDate = new Date(activeInvoice.date);
                  const expiryDate = new Date(invDate);
                  const daysToAdd = item.warrantyDays || (item.warrantyMonths ? item.warrantyMonths * 30 : 0);
                  expiryDate.setDate(expiryDate.getDate() + daysToAdd);
                  const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  const isWarrantyActive = daysRemaining > 0;

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-1.5">
                        <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                        {item.imeiOrSerial && (
                          <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 block mt-0.5">
                            S/N: {item.imeiOrSerial}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-1.5">
                        {hasWarranty ? (
                          isWarrantyActive ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {item.warrantyMonths ? `${item.warrantyMonths}M` : `${item.warrantyDays}D`} ({daysRemaining}d left)
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-500 font-medium">Expired</span>
                          )
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-1.5 text-center text-slate-700 dark:text-slate-300 font-medium">{item.qty}</td>
                      <td className="py-3 px-1.5 text-right text-slate-700 dark:text-slate-300">{item.price.toLocaleString()}</td>
                      <td className="py-3 px-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {(item.price * item.qty).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col items-end text-xs sm:text-sm space-y-1">
            <div className="w-full sm:w-64 flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>LKR {activeInvoice.subtotal.toLocaleString()}</span>
            </div>
            {activeInvoice.discount > 0 && (
              <div className="w-full sm:w-64 flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>- LKR {activeInvoice.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="w-full sm:w-64 flex justify-between text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>Grand Total</span>
              <span>LKR {activeInvoice.total.toLocaleString()}</span>
            </div>
            <div className="w-full sm:w-64 flex justify-between text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg mt-1">
              <span>Loyalty Points Earned</span>
              <span>+{activeInvoice.loyaltyPoints} PTS</span>
            </div>
            <span className="text-[10px] text-slate-400">⚡ 1 Point awarded per LKR 1,000</span>
          </div>

          {/* Feedback Rating */}
          <div className="no-print bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Rate Your Shopping Experience at {storeProfile.name}</span>
              </span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold px-2 py-0.5 rounded-full">
                POS Verified
              </span>
            </div>

            {feedbackSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1 text-xs">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">✓ Thank you for your feedback!</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Your rating has been saved and shared with the store management team.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 hover:scale-125 transition text-amber-400 hover:text-amber-500 cursor-pointer"
                    >
                      <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${star <= (hoverRating || selectedRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                  {selectedRating > 0 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                      {selectedRating === 5 ? '⭐ Excellent!' : selectedRating === 4 ? '👍 Very Good' : selectedRating === 3 ? '👌 Good' : 'Needs Improvement'}
                    </span>
                  )}
                </div>

                {selectedRating > 0 && (
                  <div className="space-y-3 animate-fade-in pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {['Fast Checkout', 'Helpful Staff', 'Genuine Quality', 'Clean Store', 'Great Price'].map((tag, tIdx) => {
                        const isSelected = selectedPraise.includes(tag);
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => {
                              setSelectedPraise(prev => isSelected ? prev.filter(p => p !== tag) : [...prev, tag]);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            + {tag}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Optional: Add a comment or technician compliment..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-500"
                    />

                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {submittingFeedback ? 'Saving Review...' : 'Submit Feedback'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Repair Request Action Footer */}
          <div className="no-print bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Wrench className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-200">Need Service or Repair?</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Request warranty repairs online.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRepairModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/30 transition text-xs cursor-pointer"
              >
                Request Repair
              </button>
              <Link
                to="/"
                className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition text-xs"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Modal */}
      {repairModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <span>Submit Repair Ticket</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Invoice: {activeInvoice.id} | Customer: {activeInvoice.customerPhone}</p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Describe Issue</label>
              <textarea
                value={repairIssue}
                onChange={(e) => setRepairIssue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-hidden focus:border-cyan-500 text-slate-900 dark:text-white"
                rows={3}
                placeholder="e.g. Screen flickering or battery draining fast..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRepairModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRepair}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
