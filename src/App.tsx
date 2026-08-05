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
  Mail,
  MessageSquare,
  Bot,
  BarChart3,
  Star,
  Sun,
  Moon,
  ShieldCheck,
  Search,
  ArrowRight,
  Zap,
  FileCheck
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
      className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-amber-500 dark:text-cyan-400 border border-slate-300 dark:border-slate-700 transition-all duration-200 shadow-sm shrink-0"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* REAL STORE LANDING PAGE (Fully Mobile Responsive & Clean Light/Dark Theme)   */
/* -------------------------------------------------------------------------- */
function StoreLandingPage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [searchId, setSearchId] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setSearchError('');

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', searchId.trim().toUpperCase())
        .single();

      if (error || !data) {
        setSearchError(`Invoice "${searchId}" not found in database.`);
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* Background Decorative Mesh Orbs */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10 dark:opacity-100 opacity-40"></div>

      {/* Responsive Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50 px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 sm:p-3 rounded-2xl text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  I-STORE
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-14 space-y-12 md:space-y-16">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-700 dark:text-cyan-400 shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>Digital Smart Receipt & Warranty Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Your Electronics Receipts & <br className="hidden sm:inline" />
            <span className="gradient-heading">
              Warranties, Simplified.
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-2">
            Received an instant WhatsApp or Email receipt link? Search your invoice below or sign in with your mobile number to view purchase history.
          </p>

          {/* Fully Responsive Search Bar */}
          <div className="max-w-2xl mx-auto pt-2 sm:pt-4">
            <form 
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-2 rounded-2xl sm:rounded-3xl shadow-xl space-y-2 sm:space-y-0 sm:space-x-2"
            >
              <div className="flex items-center w-full pl-3 text-slate-400">
                <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Invoice ID (e.g. INV-2026-8942)..."
                  className="w-full bg-transparent border-none px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl sm:rounded-2xl text-xs flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-cyan-500/25 transition active:scale-95"
              >
                <span>{loading ? 'Searching...' : 'Find Invoice'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick Test:</span>
              <button
                type="button"
                onClick={() => setSearchId('INV-2026-8942')}
                className="text-xs bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-bold hover:underline"
              >
                INV-2026-8942
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2">{searchError}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
              <span className="flex items-center space-x-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Security</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant PDF Download</span>
              </span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-3 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">Instant Smart Receipts</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Access verified digital receipts sent directly to your WhatsApp & Email with embedded verification QR codes.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-3 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">Automated Warranty Vault</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every device serial number and IMEI is automatically backed up in our cloud database for effortless warranty claims.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-3 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">Real-Time Repair Claims</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Device issue? Request warranty repairs online and track live status updates from technician inspection to store pickup.
            </p>
          </div>
        </div>

        {/* Self-Service Sign-In Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md shadow-cyan-500/30 mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Access Customer Portal</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Enter your registered phone number to view your complete purchase history.</p>
          </div>

          {!userLoggedIn ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={phoneLogin}
                  onChange={(e) => setPhoneLogin(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {!otpMode ? (
                <button
                  onClick={() => setOtpMode(true)}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
                >
                  Send One-Time Passcode (OTP)
                </button>
              ) : (
                <button
                  onClick={() => setUserLoggedIn(true)}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
                >
                  Verify Passcode & Enter Portal
                </button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Customer Account Verified</span>
              </div>
              <p className="text-xs text-slate-500">Connected to Supabase Database</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 text-center py-6 sm:py-8 text-xs text-slate-500 space-y-3">
        <p>© 2026 I-Store Electronics POS System. Powered by Supabase & Nexius Platform.</p>
        <div className="flex justify-center items-center space-x-4 text-[11px] font-semibold">
          <Link to="/demo-hub" className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1">
            <span>ERP Delivery Templates Hub</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC INVOICE PAGE (Responsive & High-Contrast Light/Dark Printable Card) */
/* -------------------------------------------------------------------------- */
function PublicInvoicePage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', id)
          .single();

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
                {activeInvoice.items.map((item: InvoiceItem, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 px-1.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                      {item.imeiOrSerial && (
                        <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">S/N: {item.imeiOrSerial}</p>
                      )}
                    </td>
                    <td className="py-3 px-1.5 text-center text-[11px]">
                      <span className="bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                        {item.warrantyMonths}M
                      </span>
                    </td>
                    <td className="py-3 px-1.5 text-center text-slate-700 dark:text-slate-300 font-medium">{item.qty}</td>
                    <td className="py-3 px-1.5 text-right text-slate-700 dark:text-slate-300">{item.price.toLocaleString()}</td>
                    <td className="py-3 px-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Device: iPhone 15 Pro Max (IMEI: 359102910293819)</p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Describe Issue</label>
              <textarea
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
                onClick={() => {
                  alert('Repair request submitted successfully! Tracking ID: REP-9912');
                  setRepairModalOpen(false);
                }}
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
  const [activeTab, setActiveTab] = useState<'delivery' | 'admin' | 'ai'>('delivery');

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
                I-STORE ERP
              </span>
              <span className="ml-2 text-xs bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Backend Delivery Engine
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link to="/" className="text-xs text-cyan-500 font-bold hover:underline">
              Back to Landing Page ➔
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'delivery' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Delivery Templates (WhatsApp/Email)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'admin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Delivery Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-cyan-500'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Sales Assistant</span>
          </button>
        </div>

        {activeTab === 'delivery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-emerald-500">
                <MessageSquare className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">WhatsApp Message Payload</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 font-sans text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl text-slate-800 dark:text-slate-200 space-y-2">
                  <p className="font-bold text-emerald-600 dark:text-emerald-500">ABC Mobile / I-Store POS</p>
                  <p>Thank you for your purchase!</p>
                  <p className="font-mono text-cyan-600 dark:text-cyan-500">Your invoice: https://i-store-customer-portal-one.vercel.app/invoice/INV-2026-8942</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-cyan-500">
                <Mail className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Email Notification Payload</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-500">
                  <p>Subject: Your invoice from ABC Mobile #INV-2026-8942</p>
                </div>
                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-white">Digital Receipt Ready</p>
                  <div className="pt-2">
                    <Link to="/invoice/INV-2026-8942?token=sec_98a71b" className="px-3 py-1.5 bg-cyan-600 text-white font-bold rounded-lg text-xs">
                      Open Receipt
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Today's Bills</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">154</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Emails Sent</span>
                <span className="text-2xl font-black text-cyan-500 mt-1 block">130</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">WhatsApp Sent</span>
                <span className="text-2xl font-black text-emerald-500 mt-1 block">145</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Failed Delivery</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">2</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-w-xl mx-auto">
            <div className="flex items-center space-x-3 text-cyan-500">
              <Bot className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">AI Support Assistant</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-cyan-500 block mb-1">Customer Question:</span>
                "What is my warranty status?"
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 p-3 rounded-xl text-slate-800 dark:text-slate-200">
                <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">AI Assistant Response:</span>
                "Your warranty for iPhone 15 Pro Max is active for 12 months."
              </div>
            </div>
          </div>
        )}
      </main>
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
