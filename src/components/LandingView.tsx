import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Sparkles, Lock, Search, ArrowRight, Loader2, ShieldCheck, 
  MessageSquare, Shield, Clock, Award, Building2, Store, CircleCheck
} from 'lucide-react';
import { DEFAULT_STORE } from '../types';
import type { StoreProfile } from '../types';
import { fetchStoreProfile, ThemeToggle } from '../utils/security';
import { PortalFooter } from './layout/PortalFooter';
import CustomerDashboard from './CustomerDashboard';
import { requestVerificationOtp, verifyCustomerOtpCode, getStoredCustomerSession, clearCustomerSession } from '../services/customerAuth';
import { getAuthorizedInvoices } from '../services/portalActions';
import { resolveStoreSlug } from '../utils/domainResolver';

export default function LandingView({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(DEFAULT_STORE);
  const [searchId, setSearchId] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const activeStoreSlug = resolveStoreSlug(storeSlug);
  const isPlatformHome = activeStoreSlug === 'default';

  useEffect(() => {
    if (activeStoreSlug && activeStoreSlug !== 'default') {
      fetchStoreProfile(activeStoreSlug).then(prof => {
        setStoreProfile(prof);
        document.title = `${prof.name} | Official Customer Care & Lifecycle Portal`;
      });
    } else {
      setStoreProfile(DEFAULT_STORE);
      document.title = 'E-STORE | Customer Portal Network';
    }

    let active = true;
    sessionStorage.removeItem('customer_portal_session');
    const savedSession = getStoredCustomerSession();
    if (savedSession?.session_token && savedSession.store_id === activeStoreSlug) {
      getAuthorizedInvoices().then((result) => {
        if (!active) return;
        const invoices = result.invoices || [];
        if (invoices.length > 0) loginCustomer(invoices, result.customer_name || invoices[0]?.customer_name || 'Customer', savedSession.phone);
      }).catch(() => { if (active) clearCustomerSession(); });
    }
    return () => { active = false; };
  }, [storeSlug]);

  const getPhoneVariations = (rawPhone: string): string[] => {
    const cleaned = rawPhone.replace(/[^\d]/g, '');
    if (!cleaned) return [];
    const variations: string[] = [cleaned];
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      const core = cleaned.slice(1);
      variations.push(`94${core}`, core);
    } else if (cleaned.startsWith('94') && cleaned.length === 11) {
      const core = cleaned.slice(2);
      variations.push(`0${core}`, core);
    } else if (cleaned.length === 9) {
      variations.push(`0${cleaned}`, `94${cleaned}`);
    }
    return Array.from(new Set(variations));
  };

  const handleAccessPurchases = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLogin.trim()) {
      setAuthError('Please enter your mobile number.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const variations = getPhoneVariations(phoneLogin);
    if (variations.length === 0) {
      setAuthError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }
    // A phone number is an identifier, not proof of ownership. Send an OTP
    // before any customer records are requested.
    await handleRequestWhatsAppOtp();
  };

  const handleRequestWhatsAppOtp = async () => {
    if (!phoneLogin.trim()) {
      setAuthError('Please enter your mobile number.');
      return;
    }
    setLoading(true);
    setAuthError('');
    const res = await requestVerificationOtp(phoneLogin, 'whatsapp', storeProfile.name, storeProfile.id);
    setLoading(false);
    if (res.success) {
      setOtpStep('otp');
      setAuthSuccess('6-digit code sent to your WhatsApp!');
    } else {
      setAuthError(res.error || 'Failed to dispatch WhatsApp OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setLoading(true);
    setAuthError('');
    const res = await verifyCustomerOtpCode(phoneLogin, otpCode, storeProfile.id);
    if (res.success && res.session) {
      // The API must return the authorised records with the verified session;
      // do not query Supabase from the browser using a phone number.
      const sessionData = res as typeof res & { invoices?: any[]; customer_name?: string };
      const invoices = sessionData.invoices || [];
      if (invoices.length === 0) {
        setLoading(false);
        setAuthError('Your number was verified, but no authorised bills were returned. Please reopen the receipt link or contact the store.');
        return;
      }
      loginCustomer(invoices, sessionData.customer_name || invoices[0]?.customer_name || 'Valued Customer', phoneLogin);
    } else {
      setLoading(false);
      setAuthError(res.error || 'Invalid OTP code.');
    }
  };

  const loginCustomer = (invoices: any[], name: string, phone: string) => {
    setCustomerInvoices(invoices);
    setCustomerName(name);
    setCustomerPhone(phone);
    setUserLoggedIn(true);
  };

  const handleSignOut = () => {
    clearCustomerSession();
    sessionStorage.removeItem('customer_portal_session');
    setUserLoggedIn(false);
    setCustomerInvoices([]);
    setCustomerPhone('');
    setCustomerName('');
    setOtpStep('phone');
  };

  if (userLoggedIn) {
    return (
      <CustomerDashboard
        customerName={customerName}
        customerPhone={customerPhone}
        invoices={customerInvoices}
        storeProfile={storeProfile}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onSignOut={handleSignOut}
      />
    );
  }

  if (isPlatformHome) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-slate-950 dark:text-white bg-[#f7f9fc] dark:bg-[#070b16] overflow-hidden">
        <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/30"><Building2 className="w-5 h-5" /></div>
              <div><span className="text-base font-extrabold tracking-tight block">E-STORE</span><span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-[0.12em] block -mt-0.5">Customer portal network</span></div>
            </div>
            <div className="flex items-center gap-2.5"><span className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]" />Secure access, by branch</span><ThemeToggle isDark={isDark} onToggle={toggleTheme} /></div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-12 md:py-20">
          <section className="relative grid lg:grid-cols-[minmax(0,1fr)_29rem] gap-12 lg:gap-20 items-center min-h-[540px]">
            <div className="absolute -z-10 h-[34rem] w-[34rem] rounded-full bg-cyan-300/25 dark:bg-cyan-500/10 blur-3xl -top-36 -left-44" />
            <div className="absolute -z-10 h-80 w-80 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl top-10 right-1/4" />
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Sparkles className="w-3 h-3" /></span>E-STORE CUSTOMER NETWORK</div>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-[4.35rem] font-black tracking-[-0.055em] leading-[1.02]">Every purchase,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400">connected to its store.</span></h1>
              <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">E-STORE connects you to the right branch portal for receipts, warranties, repairs, and device history—without mixing records across stores.</p>
              <div className="mt-8 grid sm:grid-cols-3 gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300"><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><ShieldCheck className="w-4 h-4" /></span>Branch-scoped</div><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600"><Store className="w-4 h-4" /></span>Official records</div><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600"><Clock className="w-4 h-4" /></span>Always available</div></div>
            </div>

            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 rounded-[2rem] shadow-[0_24px_70px_-30px_rgba(15,23,42,.35)] dark:shadow-[0_24px_70px_-30px_rgba(0,0,0,.7)] ring-1 ring-white dark:ring-slate-700/40">
              <div className="h-1 w-20 rounded-b-full bg-gradient-to-r from-cyan-400 to-blue-600 absolute top-0 right-8" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400"><Store className="w-5 h-5" /></div>
              <h2 className="mt-5 text-xl font-extrabold tracking-tight">Open your digital record</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Use the secure receipt, warranty, or repair link sent by your store. It already identifies the correct branch and protects your records.</p>
              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3 text-sm text-slate-600 dark:text-slate-300"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600"><CircleCheck className="w-4 h-4" /></span><span>Scan the QR code on your receipt</span></div><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600"><CircleCheck className="w-4 h-4" /></span><span>Open your store’s WhatsApp or email link</span></div></div>
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex gap-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"><CircleCheck className="w-4 h-4 shrink-0 text-emerald-500" />If you cannot find your link, contact the branch where you made the purchase. A verified recovery flow will be added before public launch.</div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-200">E-STORE</span><span className="mx-2 text-slate-300 dark:text-slate-700">•</span>Your store. Your records. Your customer portal.</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 bg-[#f7f9fc] dark:bg-[#070b16] overflow-hidden">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-950 dark:text-white block tracking-tight">
                {storeProfile.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-[0.12em] block -mt-0.5">
                Customer portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="hidden lg:inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mr-2"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]" />Secure customer access</span>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <a
              href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Care</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero & Access Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-9 md:py-16">
        
        <section className="relative grid lg:grid-cols-[minmax(0,1fr)_31rem] gap-10 lg:gap-16 items-center min-h-[580px] animate-fade-in">
          <div className="absolute -z-10 h-[30rem] w-[30rem] rounded-full bg-cyan-300/25 dark:bg-cyan-500/10 blur-3xl -top-28 -left-44" />
          <div className="absolute -z-10 h-72 w-72 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl top-20 right-1/4" />
          <div className="text-left max-w-2xl py-6 lg:py-0">
            <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Sparkles className="w-3 h-3" /></span>
              <span>{storeProfile.name.toUpperCase()} CUSTOMER CARE</span>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl xl:text-[4.2rem] font-black text-slate-950 dark:text-white tracking-[-0.055em] leading-[1.02]">
              Everything you own,<span className="hidden sm:inline"> </span><br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400">always within reach.</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              One secure place for your official receipts, warranty cover, repairs, and device history—ready when you need it.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><ShieldCheck className="w-4 h-4" /></span>Private by design</div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600"><Clock className="w-4 h-4" /></span>Always available</div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600"><Award className="w-4 h-4" /></span>Official records</div>
            </div>
          </div>

          {/* Focal Access Card */}
          <div className="w-full max-w-lg mx-auto lg:max-w-none">
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 rounded-[2rem] shadow-[0_24px_70px_-30px_rgba(15,23,42,.35)] dark:shadow-[0_24px_70px_-30px_rgba(0,0,0,.7)] space-y-5 relative text-left ring-1 ring-white dark:ring-slate-700/40">
              <div className="absolute right-8 top-0 h-1 w-20 rounded-b-full bg-gradient-to-r from-cyan-400 to-blue-600" />
              
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Find your purchases</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Use the mobile number from your purchase.</p>
                </div>
              </div>

              {otpStep === 'phone' ? (
                <form onSubmit={handleAccessPurchases} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/15 rounded-2xl px-3.5 py-2.5 transition-all">
                      <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mr-2.5" />
                      <input
                        type="tel"
                        value={phoneLogin}
                        onChange={(e) => setPhoneLogin(e.target.value)}
                        placeholder="e.g. +94 77 123 4567"
                        className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400 font-mono font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Invoice ID or last 4 digits
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional for instant verification</span>
                    </div>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/15 rounded-2xl px-3.5 py-2.5 transition-all">
                      <span className="text-xs text-slate-400 font-mono font-bold shrink-0 mr-2.5">#</span>
                      <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="e.g. INV-2026-000003 or 0003"
                        className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400 font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-slate-900/15 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Send WhatsApp OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Enter 6-Digit WhatsApp Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full text-center tracking-[0.5em] text-lg font-mono font-black bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Access</span>}
                    </button>
                  </div>
                </form>
              )}

              {authError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-xl">
                  {authError}
                </p>
              )}
              {authSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl">
                  {authSuccess}
                </p>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 mr-1.5" />
                  Dual-Mode Security Verified
                </span>
                <span>v2026.1 Official</span>
              </div>

            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="border-y border-slate-200 dark:border-slate-800 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">More than a receipt</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Support for the full life of your device.</h2></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Keep the important details accessible, verified, and organised from day one.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl space-y-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Smart Warranty Protection</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Auto-tracked warranty expiry, serial verification, and instant claim dispatch with authorized store technicians.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl space-y-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Repair Tracking</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time 6-stage milestone tracker from intake diagnosis to quality checks and completion notifications.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl space-y-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-500">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">VIP Loyalty & Trade-In</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Earn rewards on every transaction, claim instant discount vouchers, and calculate trade-in values on existing devices.
            </p>
          </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <PortalFooter 
        storeProfile={storeProfile} 
        onScrollToAccess={() => window.scrollTo({ top: 420, behavior: 'smooth' })}
      />
    </div>
  );
}
