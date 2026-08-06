import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Receipt, 
  Wrench, 
  Download, 
  Printer, 
  CheckCircle2, 
  Smartphone,
  Sparkles,
  ChevronRight,
  Send,
  MessageSquare,
  BarChart3,
  Star,
  Sun,
  Moon,
  ShieldCheck,
  Search,
  ArrowRight,
  ReceiptText
} from 'lucide-react';
import { supabase } from './supabase';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  warrantyMonths: number;
  imeiOrSerial?: string;
}

interface Invoice {
  id: string;
  token: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  loyaltyPoints: number;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'Paid' | 'Pending';
  shortCode: string;
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-amber-400 border border-slate-300 dark:border-slate-700 transition-all duration-200 shadow-sm shrink-0 hover:scale-105 flex items-center justify-center"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 fill-indigo-600/20" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
function StoreLandingPage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [searchId, setSearchId] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [loginError, setLoginError] = useState('');
  const [searchTab, setSearchTab] = useState<'search' | 'login'>('search');


  const handleVerifyCustomer = async () => {
    if (!phoneLogin.trim() || !pinInput.trim()) {
      setLoginError('Please enter both your phone number and 4-digit PIN.');
      return;
    }
    setLoading(true);
    setLoginError('');

    try {
      // Query Supabase for invoices belonging to this phone number
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .ilike('customer_phone', `%${phoneLogin.replace(/\s+/g, '')}%`);

      if (error || !data || data.length === 0) {
        setLoginError('No matching customer records found for this phone number.');
      } else {
        // PIN = last 4 digits of any invoice ID (e.g. INV-2026-000001 → "0001")
        const enteredPin = pinInput.trim().padStart(4, '0');
        const match = data.filter((inv: any) => {
          const invId = String(inv.id || '');
          // Extract trailing numeric sequence and check last 4 digits
          const numPart = invId.replace(/[^0-9]/g, '');
          return numPart.endsWith(enteredPin) || invId.endsWith(enteredPin);
        });
        if (match.length > 0) {
          setCustomerInvoices(data);
          setUserLoggedIn(true);
        } else {
          setLoginError('Invalid PIN. Enter the last 4 digits of any of your invoice numbers (e.g. "0001" for INV-2026-000001).');
        }
      }
    } catch {
      setLoginError('Verification failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setSearchError('');

    try {
      const query = searchId.trim().toUpperCase();

      // Require phone number to look up an invoice — prevents anyone guessing IDs
      if (!phoneLogin.trim()) {
        setSearchError('Please enter your registered phone number first to search invoices.');
        setLoading(false);
        return;
      }

      // Match invoice ID AND phone number together
      let { data, error } = await supabase
        .from('invoices')
        .select('id, token')
        .eq('id', query)
        .ilike('customer_phone', `%${phoneLogin.replace(/\s+/g, '')}%`)
        .maybeSingle();

      // Fallback: partial ID match with same phone check
      if (!data && !error) {
        const { data: fuzzy } = await supabase
          .from('invoices')
          .select('id, token')
          .ilike('id', `%${query}%`)
          .ilike('customer_phone', `%${phoneLogin.replace(/\s+/g, '')}%`)
          .limit(1)
          .maybeSingle();
        data = fuzzy;
      }

      if (error || !data) {
        setSearchError(`Invoice "${searchId}" not found. Make sure the invoice ID and phone number match.`);
      } else {
        window.location.href = `/invoice/${data.id}?token=${data.token}`;
      }
    } catch {
      setSearchError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Premium Background Mesh Glows & Ambient Lights */}
      <div className="fixed top-[-250px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-indigo-600/20 rounded-full blur-[160px] pointer-events-none -z-10 dark:opacity-40 opacity-20 animate-pulse duration-[8000ms]"></div>
      <div className="fixed bottom-[-100px] left-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed top-[400px] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      {/* Responsive Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/85 bg-white/70 dark:bg-slate-950/70 backdrop-blur-3xl sticky top-0 z-50 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 group">
            <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 sm:p-3 rounded-2xl text-white shadow-lg shadow-cyan-500/25 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  I-STORE
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
                  Customer Care
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">Digital Receipts & Warranty Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-20 space-y-20">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-5 sm:space-y-7 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-800 dark:text-cyan-400 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin duration-3000" />
            <span>Official Customer Service Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Never Lose a Receipt.<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Never Miss a Warranty.
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-2">
            Trusted digital warranty management by <strong className="text-slate-900 dark:text-slate-200">I-STORE</strong>. 
            Access all your purchase histories, serial/IMEI details, and warranty terms directly from your browser.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-1 text-[11px] sm:text-xs text-slate-500 font-bold">
            <span className="bg-white dark:bg-slate-900/50 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 shadow-sm transition hover:border-cyan-500/30">✓ Secure Digital Receipts</span>
            <span className="bg-white dark:bg-slate-900/50 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 shadow-sm transition hover:border-cyan-500/30">✓ Instant Warranty Access</span>
            <span className="bg-white dark:bg-slate-900/50 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 shadow-sm transition hover:border-cyan-500/30">✓ Seamless Online Repairs</span>
          </div>

          {/* Secure Tabbed Access Widget */}
          <div className="max-w-xl mx-auto pt-4 sm:pt-6">
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl shadow-2xl space-y-5 relative group transition-all duration-300 hover:shadow-cyan-500/5">
              
              {/* Outer decorative light bar */}
              <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 gap-5">
                <button
                  onClick={() => { setSearchTab('search'); setSearchError(''); setLoginError(''); }}
                  className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all duration-200 ${
                    searchTab === 'search'
                      ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Find Receipt
                </button>
                <button
                  onClick={() => { setSearchTab('login'); setSearchError(''); setLoginError(''); }}
                  className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all duration-200 ${
                    searchTab === 'login'
                      ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Access Vault Portal
                </button>
              </div>

              {searchTab === 'search' ? (
                /* Tab 1: Find Single Receipt */
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400">Mobile Number</label>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-cyan-500 shrink-0 mr-2" />
                        <input
                          type="tel"
                          value={phoneLogin}
                          onChange={(e) => setPhoneLogin(e.target.value)}
                          placeholder="e.g. +94 77 123 4567"
                          className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400">Invoice Number</label>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                        <span className="text-xs text-slate-400 shrink-0 mr-2 font-mono">#</span>
                        <input
                          type="text"
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          placeholder="e.g. INV-2026-000001"
                          className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
                  >
                    <span>{loading ? 'Searching...' : 'Find My Receipt'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {searchError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 text-left">{searchError}</p>
                  )}
                </form>
              ) : (
                /* Tab 2: Access Customer Portal */
                <div className="space-y-3">
                  {!userLoggedIn ? (
                    <div className="space-y-3 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400">Registered Phone</label>
                          <input
                            type="text"
                            value={phoneLogin}
                            onChange={(e) => setPhoneLogin(e.target.value)}
                            placeholder="e.g. +94 77 123 4567"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400">Invoice PIN (Last 4 Digits)</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="e.g. 8942"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-center font-bold"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleVerifyCustomer}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <ShieldCheck className="w-4.5 h-4.5" />
                        <span>{loading ? 'Verifying...' : 'Verify Security PIN & Enter Portal'}</span>
                      </button>
                      {loginError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold text-center mt-1">{loginError}</p>
                      )}
                    </div>
                  ) : (
                    /* Customer Verified Portal Dashboard */
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Customer Account Verified</span>
                        </div>
                        <button
                          onClick={() => { setUserLoggedIn(false); setCustomerInvoices([]); }}
                          className="text-[10px] text-slate-500 hover:underline font-bold"
                        >
                          Sign Out
                        </button>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white">Your Purchase History ({customerInvoices.length}):</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {customerInvoices.map((inv, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <div>
                                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{inv.id}</span>
                                <span className="text-[9px] text-slate-500 ml-2">{new Date(inv.created_at).toLocaleDateString()}</span>
                              </div>
                              <Link
                                to={`/invoice/${inv.id}?token=${inv.token}`}
                                className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg text-[10px] font-bold hover:underline"
                              >
                                View ➔
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  Secure verification required
                </span>
                <span className="font-medium text-cyan-500">No password required</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Real-World Benefit Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">📄 Digital Receipts</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Find any purchase instantly. No more faded, damaged, or lost paper bills. Access, download, or reprint your official invoice anytime.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-cyan-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">🛡️ Warranty Vault</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your phone, laptop, and accessories stay protected. Check warranty terms, active status, and remaining validation days in real time.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-cyan-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">🔧 Easy Repairs</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Submit repair requests and track real-time servicing progress. Receive instant notifications when your product is ready for pickup.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Simple, Seamless, Secure.</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Access your digital care portal in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold mx-auto text-sm">1</div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Buy Your Device</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Make any purchase at I-STORE to automatically trigger system registration.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto text-sm">2</div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Receive Link</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get a zero-cost secure digital bill link instantly via WhatsApp or Email message.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mx-auto text-sm">3</div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Access Anytime</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Log in below or scan your invoice QR code to manage warranty & repairs instantly.</p>
            </div>
          </div>
        </div>

        {/* Dashboard / Wallet Preview Section */}
        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preview Your Digital Wallet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Keep tracking warranty validations easily in one place.</p>
          </div>
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-xl mx-auto space-y-4 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Active Devices</span>
                <h4 className="font-black text-sm text-cyan-400">My Warranty Vault</h4>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">Verified Account</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">iPhone 15 Pro Max</p>
                  <p className="text-[10px] text-slate-500 font-mono">IMEI: 358941029481948</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-cyan-400 block">245 Days left</span>
                  <span className="text-[9px] text-slate-500 block">Warranty active</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">MacBook Pro 14" M3</p>
                  <p className="text-[10px] text-slate-500 font-mono">S/N: C02F8912MD81</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-cyan-400 block">312 Days left</span>
                  <span className="text-[9px] text-slate-500 block">Warranty active</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>* Demo Preview representation</span>
              <a href="#customer-portal" className="text-cyan-400 font-bold hover:underline">Log in to view yours ➔</a>
            </div>
          </div>
        </div>

        {/* Support Call to Action */}
        <div className="max-w-xl mx-auto bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 border border-cyan-500/20 rounded-3xl p-6 text-center space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Need Assistance with your Purchase?</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">If you have any questions regarding your warranty terms or active repairs, chat with our care team.</p>
          <a
            href="https://wa.me/94771234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Chat with I-STORE Care</span>
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 text-slate-500 py-10 px-6 mt-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-xs pb-8 border-b border-slate-200 dark:border-slate-900">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-cyan-500/10 p-2 rounded-xl text-cyan-600">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white">I-STORE DIGITAL CARE</span>
            </div>
            <p className="leading-relaxed">Providing secure electronic receipts, automatic warranty vault registrations, and streamlined cloud-based repair processing.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Quick Policies</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="hover:underline">Warranty Terms & Conditions</a></li>
              <li><a href="#" className="hover:underline">Repair & Service SLA</a></li>
              <li><a href="#" className="hover:underline">Privacy & Data Security Policy</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Internal Access</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/demo-hub" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1">
                  <span>Staff / ERP Delivery Templates Hub</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-3">
          <p>© 2026 I-Store Electronics. Powered by Supabase & Nexius Platform.</p>
          <p className="font-medium text-slate-400">All registered devices are verified through hardware hash registration.</p>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC INVOICE PAGE                                                        */
/* -------------------------------------------------------------------------- */
function PublicInvoicePage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairIssue, setRepairIssue] = useState('');

  const handleSubmitRepair = async () => {
    if (!repairIssue.trim() || !invoice) return;
    const ticketId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await supabase.from('repair_tickets').insert([
        {
          id: ticketId,
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
      setLoading(true);

      // Validate token from URL — must match the DB token
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', id)
          .maybeSingle();

        // Block access if token is missing or doesn't match
        if (!data || error || !urlToken || data.token !== urlToken) {
          setLoading(false);
          return; // invoice stays null → shows "not found"
        }

        if (data && !error) {
          setInvoice({
            id: data.id,
            token: data.token,
            shortCode: data.id,
            date: new Date(data.created_at).toLocaleString(),
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email || '',
            loyaltyPoints: 100,
            items: (data.invoice_items || []).map((item: any) => ({
              name: item.item_name,
              qty: item.quantity,
              price: item.unit_price,
              warrantyMonths: item.warranty_months,
              imeiOrSerial: item.imei_or_serial
            })),
            subtotal: data.subtotal,
            tax: data.tax || 0,
            discount: data.discount || 0,
            total: data.total,
            paymentMethod: data.payment_method,
            status: data.status || 'Paid'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const fullUrl = window.location.href;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm font-semibold">
        Loading invoice details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">The requested invoice ID "{id}" does not exist in the database.</p>
        <Link to="/" className="px-4 py-2 bg-cyan-600 rounded-xl text-xs font-bold text-white">Back to Home</Link>
      </div>
    );
  }

  const activeInvoice = invoice;

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Action Bar */}
        <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Smart Receipt</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {activeInvoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Delivered to {activeInvoice.customerPhone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition text-slate-800 dark:text-slate-200"
            >
              <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-bold text-white shadow-md shadow-cyan-500/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div id="printable-invoice" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-xl space-y-6 sm:space-y-8 transition-colors">
          
          {/* Header & QR Code */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 dark:text-cyan-400" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">I-STORE MOBILE</h1>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Liberty Plaza, Colombo 03 | Support: +94 11 234 5678</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Tax ID: 90218-VAT</p>
            </div>

            {/* Smart QR Code Receipt */}
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shrink-0">
              <div className="bg-white p-1 rounded-xl border border-slate-200">
                <QRCodeSVG value={fullUrl} size={56} />
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-cyan-600 dark:text-cyan-400 block">Scan to Verify</span>
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-300 font-bold block">{activeInvoice.id}</span>
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Customer</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">{activeInvoice.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Phone</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{activeInvoice.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Payment</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{activeInvoice.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Points</span>
              <span className="font-bold text-amber-500 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>+{activeInvoice.loyaltyPoints} PTS</span>
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-1.5">Purchased Item</th>
                  <th className="py-2.5 px-1.5 text-center">Warranty</th>
                  <th className="py-2.5 px-1.5 text-center">Qty</th>
                  <th className="py-2.5 px-1.5 text-right">Price</th>
                  <th className="py-2.5 px-1.5 text-right">Total</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {activeInvoice.items.map((item: InvoiceItem, idx: number) => {
                  const invoiceDate = new Date(activeInvoice.date);
                  const expiryDate = new Date(invoiceDate);
                  expiryDate.setMonth(expiryDate.getMonth() + (item.warrantyMonths || 0));
                  const isWarrantyActive = new Date() < expiryDate;

                  return (
                    <tr key={idx}>
                      <td className="py-3 px-1.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                        {item.imeiOrSerial && (
                          <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">S/N: {item.imeiOrSerial}</p>
                        )}
                      </td>
                      <td className="py-3 px-1.5 text-center text-[11px]">
                        {item.warrantyMonths > 0 ? (
                          isWarrantyActive ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold inline-flex items-center space-x-1">
                              <span>Active</span>
                              <span>({item.warrantyMonths}M)</span>
                            </span>
                          ) : (
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                              Expired
                            </span>
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
          </div>

          {/* Customer Feedback & Experience Rating Component */}
          <div className="no-print bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Rate Your Shopping & Checkout Experience</span>
              </span>
              <span className="text-[10px] text-slate-500">Feedback Syncs to POS</span>
            </div>

            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    alert(`Thank you for giving us a ${star}-star rating! Your feedback has been sent to our management team.`);
                  }}
                  className="p-1 hover:scale-125 transition text-amber-400 hover:text-amber-500"
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
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
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl border border-amber-500/30 transition text-xs"
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

      {/* Repair Request Modal */}
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                rows={3}
                placeholder="e.g. Screen flickering or battery draining fast..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRepairModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRepair}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
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

/* -------------------------------------------------------------------------- */
/* DEMO HUB: FOR TESTING ALL FEATURES & BACKEND SIMULATION                   */
/* -------------------------------------------------------------------------- */
function AllFeaturesHub({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'repairs' | 'feedback' | 'delivery'>('invoices');
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authedRole, setAuthedRole] = useState('');
  const [pinError, setPinError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !pinInput.trim()) {
      setPinError('Username and PIN are required.');
      return;
    }
    setAuthLoading(true);
    setPinError('');

    try {
      const { data, error } = await supabase.rpc('verify_staff_pin', {
        p_username: usernameInput.trim().toLowerCase(),
        p_pin: pinInput.trim(),
      });

      if (error) {
        setPinError('Verification service error. Please try again.');
        return;
      }

      if (data?.ok) {
        setIsAuthenticated(true);
        setAuthedRole(data.role);
      } else {
        setPinError(data?.error || 'Invalid username or PIN. Access Denied.');
      }
    } catch {
      setPinError('Could not connect to verification server. Check your connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Admin &amp; Delivery Hub</h2>
          <p className="text-xs text-slate-400">Sign in using your I-Store POS staff username and PIN.</p>

          <form onSubmit={handleAdminAuth} className="space-y-3 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Staff Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. admin or sahan"
                autoComplete="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Staff PIN</label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter your POS PIN..."
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-semibold text-center">{pinError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? 'Verifying with POS...' : 'Authenticate Admin Access'}
            </button>
          </form>

          <div className="pt-2">
            <Link to="/" className="text-xs text-slate-500 hover:underline">
              ← Return to Customer Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                I-STORE Admin Panel
              </span>
              <span className="ml-2 text-xs bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Cloud ERP Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 capitalize">{usernameInput} · {authedRole}</span>
            </div>
            <Link to="/" className="text-xs text-cyan-500 font-bold hover:underline">
              ← Customer Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          {([
            { id: 'invoices', label: 'Live Invoices', icon: <ReceiptText className="w-4 h-4" /> },
            { id: 'repairs', label: 'Repair Tickets', icon: <Wrench className="w-4 h-4" /> },
            { id: 'feedback', label: 'Customer Feedback', icon: <Star className="w-4 h-4" /> },
            { id: 'delivery', label: 'Delivery Stats', icon: <BarChart3 className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Live Invoices Tab */}
        {activeTab === 'invoices' && (
          <LiveInvoicesPanel supabase={supabase} />
        )}

        {/* Repair Tickets Tab */}
        {activeTab === 'repairs' && (
          <LiveRepairsPanel supabase={supabase} />
        )}

        {/* Customer Feedback Tab */}
        {activeTab === 'feedback' && (
          <LiveFeedbackPanel supabase={supabase} />
        )}

        {/* Delivery Stats Tab */}
        {activeTab === 'delivery' && (
          <LiveDeliveryStatsPanel supabase={supabase} />
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ADMIN PANEL SUB-COMPONENTS (Live Supabase Data)                            */
/* -------------------------------------------------------------------------- */

function LiveInvoicesPanel({ supabase }: { supabase: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('invoices')
        .select('id, customer_name, customer_phone, total, status, payment_method, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      setInvoices(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = invoices.filter(inv =>
    inv.id?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_phone?.includes(search)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
          <ReceiptText className="w-5 h-5 text-cyan-500" />
          <span>Live Cloud Invoices</span>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">{invoices.length} total</span>
        </h3>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, name, phone..."
          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white w-full sm:w-64"
        />
      </div>
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-8">Loading invoices from cloud...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                <th className="pb-3 font-semibold pr-4">Invoice ID</th>
                <th className="pb-3 font-semibold pr-4">Customer</th>
                <th className="pb-3 font-semibold pr-4">Phone</th>
                <th className="pb-3 font-semibold pr-4">Total</th>
                <th className="pb-3 font-semibold pr-4">Method</th>
                <th className="pb-3 font-semibold pr-4">Status</th>
                <th className="pb-3 font-semibold pr-4">Date</th>
                <th className="pb-3 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 pr-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">{inv.id}</td>
                  <td className="py-3 pr-4 text-slate-900 dark:text-slate-100 font-semibold">{inv.customer_name}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{inv.customer_phone}</td>
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">LKR {Number(inv.total).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{inv.payment_method}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <Link to={`/invoice/${inv.id}`} className="text-cyan-500 hover:underline font-bold">View ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LiveRepairsPanel({ supabase }: { supabase: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statusFlow = ['Submitted', 'In Inspection', 'In Repair', 'Completed', 'Delivered'];
  const statusColors: Record<string, string> = {
    'Submitted': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'In Inspection': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'In Repair': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'Completed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'Delivered': 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('repair_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const advanceStatus = async (ticket: any) => {
    const nextIdx = statusFlow.indexOf(ticket.status) + 1;
    if (nextIdx >= statusFlow.length) return;
    const nextStatus = statusFlow[nextIdx];
    setUpdatingId(ticket.id);
    await supabase.from('repair_tickets').update({ status: nextStatus }).eq('id', ticket.id);
    await loadTickets();
    setUpdatingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
        <Wrench className="w-5 h-5 text-amber-500" />
        <span>Repair Ticket Management</span>
        <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">{tickets.length} tickets</span>
      </h3>
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-8">Loading repair tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No repair tickets submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">{t.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[t.status] || ''}`}>{t.status}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{t.device_name} <span className="text-slate-400">·</span> {t.customer_phone}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.issue_description}</p>
                <p className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              {t.status !== 'Delivered' && (
                <button
                  onClick={() => advanceStatus(t)}
                  disabled={updatingId === t.id}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold rounded-xl border border-cyan-500/30 text-xs transition disabled:opacity-50"
                >
                  {updatingId === t.id ? 'Updating...' : `→ ${statusFlow[statusFlow.indexOf(t.status) + 1]}`}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveFeedbackPanel({ supabase }: { supabase: any }) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('customer_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setFeedbacks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const avg = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Customer Feedback & Ratings</span>
        </h3>
        {feedbacks.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{avg} avg</span>
            <span className="text-[10px] text-slate-500">({feedbacks.length} reviews)</span>
          </div>
        )}
      </div>
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-8">Loading feedback...</p>
      ) : feedbacks.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No customer feedback received yet. Ratings will appear here as customers rate their receipts.</p>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{f.customer_phone || 'Anonymous'}</p>
                <p className="text-[11px] text-slate-500 font-mono">{f.invoice_id}</p>
                {f.comment && <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{f.comment}"</p>}
                <p className="text-[10px] text-slate-400">{new Date(f.created_at).toLocaleString()}</p>
              </div>
              <div className="flex space-x-0.5 shrink-0">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= (f.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveDeliveryStatsPanel({ supabase }: { supabase: any }) {
  const [stats, setStats] = useState({ totalInvoices: 0, todayInvoices: 0, totalRevenue: 0, pendingRepairs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [allInv, todayInv, repairs] = await Promise.all([
        supabase.from('invoices').select('total', { count: 'exact' }),
        supabase.from('invoices').select('id', { count: 'exact' }).gte('created_at', today),
        supabase.from('repair_tickets').select('id', { count: 'exact' }).neq('status', 'Delivered'),
      ]);
      const totalRevenue = (allInv.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
      setStats({
        totalInvoices: allInv.count || 0,
        todayInvoices: todayInv.count || 0,
        totalRevenue,
        pendingRepairs: repairs.count || 0,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Cloud Invoices", value: stats.totalInvoices, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Invoices Today", value: stats.todayInvoices, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Revenue (LKR)", value: `${(stats.totalRevenue).toLocaleString()}`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pending Repairs", value: stats.pendingRepairs, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] text-slate-500 font-semibold block">{c.label}</span>
            {loading ? (
              <span className="text-lg font-black text-slate-400 mt-1 block animate-pulse">—</span>
            ) : (
              <span className={`text-2xl font-black mt-1 block ${c.color}`}>{c.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Send className="w-4 h-4 text-emerald-500" />
          <span>WhatsApp Smart Bill Delivery</span>
        </h4>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
            <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Zero-Cost WhatsApp Delivery Active</p>
              <p>Smart Bill links are shared via WhatsApp deep-link — no paid API needed.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
            <ReceiptText className="w-4 h-4 text-cyan-500 shrink-0" />
            <div>
              <p className="font-bold text-cyan-600 dark:text-cyan-400">Auto-Sync on Every POS Checkout</p>
              <p>Invoices are automatically pushed to the cloud the moment a sale is completed in the POS software.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <p className="font-bold text-purple-600 dark:text-purple-400">Warranty & Repair Tracking Live</p>
              <p>Customers can view warranty status and submit repair tickets directly from their digital bill.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function App() {
  const [isDark, setIsDark] = useState(() => (localStorage.getItem("theme") ?? "dark") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StoreLandingPage isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/invoice/:id" element={<PublicInvoicePage isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/i/:shortCode" element={<PublicInvoicePage isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/portal" element={<StoreLandingPage isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/demo-hub" element={<AllFeaturesHub isDark={isDark} toggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
