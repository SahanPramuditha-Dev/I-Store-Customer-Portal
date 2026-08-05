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

const MOCK_INVOICES: Record<string, Invoice> = {
  'INV-2026-8942': {
    id: 'INV-2026-8942',
    token: 'sec_98a71b',
    shortCode: '7Hd82k',
    date: '2026-08-05 14:32',
    customerName: 'Kasun Perera',
    customerPhone: '+94 77 123 4567',
    customerEmail: 'kasun@gmail.com',
    loyaltyPoints: 325,
    status: 'Paid',
    items: [
      { name: 'iPhone 15 Pro Max - 256GB Natural Titanium', qty: 1, price: 325000, warrantyMonths: 12, imeiOrSerial: '359102910293819' },
      { name: 'Tempered Glass Screen Protector', qty: 1, price: 3500, warrantyMonths: 1 }
    ],
    subtotal: 328500,
    tax: 0,
    discount: 3500,
    total: 325000,
    paymentMethod: 'Visa Card (**** 4821)'
  }
};

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="p-2.5 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 text-amber-400 dark:text-cyan-400 border border-slate-700/80 dark:border-slate-700 light:border-slate-300 transition-all duration-200 shadow-md"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* NEXT-GEN APPLE/STRIPE-LEVEL LANDING PAGE                                   */
/* -------------------------------------------------------------------------- */
function StoreLandingPage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [searchId, setSearchId] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* Background Decorative Mesh Orbs */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Glassmorphic Navbar */}
      <header className="border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80 bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/70 backdrop-blur-2xl sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-cyan-500/25 ring-1 ring-white/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-white to-cyan-400 dark:from-white dark:to-cyan-400 light:from-slate-900 light:to-cyan-600 bg-clip-text text-transparent">
                  I-STORE
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  ERP Nexius
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium">Smart Bill & Customer Self-Service</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link
              to="/invoice/INV-2026-8942?token=sec_98a71b"
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-xs font-bold text-white shadow-xl shadow-cyan-500/25 transition transform active:scale-95 ring-1 ring-white/20"
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Try Demo Receipt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-10 md:py-16 space-y-16">
        
        {/* Main Hero Header & Interactive Search */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-400 shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Digital Smart Receipt & Warranty Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-100 dark:text-white light:text-slate-900 tracking-tight leading-[1.1]">
            Your Electronics Receipts & <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Warranties, Simplified.
            </span>
          </h1>

          <p className="text-sm md:text-lg text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Received an instant WhatsApp or Email receipt link? Search your invoice below or sign in to track device warranty expirations and repair status.
          </p>

          {/* Premium Glassmorphic Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/invoice/INV-2026-8942?token=sec_98a71b`;
              }}
              className="flex flex-col sm:flex-row items-center bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-2xl border border-slate-800 dark:border-slate-800 light:border-slate-300 p-2 sm:p-2.5 rounded-3xl shadow-2xl space-y-2 sm:space-y-0 sm:space-x-2 ring-1 ring-white/10"
            >
              <div className="flex items-center w-full pl-3 text-slate-400">
                <Search className="w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Invoice ID (e.g. INV-2026-8942)..."
                  className="w-full bg-transparent border-none px-3 py-2.5 text-sm text-slate-100 dark:text-white light:text-slate-900 focus:outline-none placeholder:text-slate-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-cyan-500/30 transition transform active:scale-95"
              >
                <span>Find Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 mt-3 font-medium">
              <span className="flex items-center space-x-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Link Security</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant PDF Download</span>
              </span>
            </div>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Card 1 */}
          <div className="group bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 p-8 rounded-3xl space-y-4 shadow-xl hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-100 dark:text-white light:text-slate-900">Instant Smart Receipts</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              No paper receipts to lose. Access verified digital receipts sent directly to your WhatsApp & Email with embedded QR codes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 p-8 rounded-3xl space-y-4 shadow-xl hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-100 dark:text-white light:text-slate-900">Automated Warranty Vault</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Every device serial number and IMEI is automatically backed up in our cloud database for effortless warranty claims.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 p-8 rounded-3xl space-y-4 shadow-xl hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl text-slate-100 dark:text-white light:text-slate-900">Real-Time Repair Claims</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Device issue? Request warranty repairs online and track live status updates from technician inspection to store pickup.
            </p>
          </div>
        </div>

        {/* Customer Self-Service Sign-In Box */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/90 to-indigo-950/50 dark:from-slate-900/90 dark:to-indigo-950/50 light:from-white light:to-slate-100/90 backdrop-blur-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto space-y-6 ring-1 ring-white/10">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/30 mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 dark:text-white light:text-slate-900">Access Customer Portal</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Enter your registered phone number to view your complete purchase history.</p>
          </div>

          {!userLoggedIn ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={phoneLogin}
                  onChange={(e) => setPhoneLogin(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-2xl px-4 py-3.5 text-xs text-slate-100 dark:text-white light:text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {!otpMode ? (
                <button
                  onClick={() => setOtpMode(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-xl shadow-cyan-500/25 transition transform active:scale-95"
                >
                  Send One-Time Passcode (OTP)
                </button>
              ) : (
                <button
                  onClick={() => setUserLoggedIn(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-xl shadow-emerald-500/25 transition transform active:scale-95"
                >
                  Verify Passcode & Enter Portal
                </button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Welcome back, Kasun Perera!</span>
              </div>
              <Link
                to="/invoice/INV-2026-8942?token=sec_98a71b"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20"
              >
                <span>Open Receipts & Warranties</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/80 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 text-center py-8 text-xs text-slate-500 space-y-3">
        <p>© 2026 I-Store Electronics POS System. Powered by Supabase & Nexius Platform.</p>
        <div className="flex justify-center items-center space-x-6 text-[11px] font-semibold">
          <Link to="/demo-hub" className="text-cyan-400 hover:underline flex items-center space-x-1">
            <span>ERP System Demo & Delivery Logs</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FEATURE 4, 5, 6: ONLINE INVOICE VIEWER + QR CODE + WARRANTY                */
/* -------------------------------------------------------------------------- */
function PublicInvoicePage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { id } = useParams<{ id: string }>();
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const invoice = id ? MOCK_INVOICES[id] : MOCK_INVOICES['INV-2026-8942'];
  const fullUrl = window.location.href;

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Actions & Channels Banner */}
        <div className="no-print bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-100 dark:text-white light:text-slate-900">I-STORE Smart Receipt</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Sent via WhatsApp & Email to {invoice.customerPhone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 rounded-xl text-xs font-semibold border border-slate-700 dark:border-slate-700 light:border-slate-300 transition text-slate-200 dark:text-slate-200 light:text-slate-800"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div id="printable-invoice" className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden transition-colors">
          
          {/* Header & QR Code */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-8 gap-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-black tracking-wider text-slate-100 dark:text-white light:text-slate-900">I-STORE MOBILE</h1>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">Liberty Plaza, Colombo 03 | Support: +94 11 234 5678</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400">Tax ID: 90218-VAT</p>
            </div>

            {/* Smart QR Code Receipt */}
            <div className="flex items-center space-x-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 p-3 rounded-2xl">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                <QRCodeSVG value={fullUrl} size={64} />
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-cyan-500 block">Scan to View</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 block mt-0.5">Verification QR</span>
                <span className="font-mono text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700 font-bold block">{invoice.id}</span>
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100/80 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase font-semibold block mb-0.5">Customer</span>
              <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">{invoice.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase font-semibold block mb-0.5">Phone Number</span>
              <span className="font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">{invoice.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase font-semibold block mb-0.5">Payment</span>
              <span className="font-medium text-emerald-500">{invoice.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-500 light:text-slate-600 uppercase font-semibold block mb-0.5">Earned Points</span>
              <span className="font-bold text-amber-500 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>+{invoice.loyaltyPoints} PTS</span>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-2">Purchased Item</th>
                  <th className="py-3 px-2 text-center">Warranty</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Price (LKR)</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 dark:divide-slate-800/50 light:divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-2">
                      <p className="font-semibold text-slate-200 dark:text-slate-100 light:text-slate-900">{item.name}</p>
                      {item.imeiOrSerial && (
                        <p className="text-xs font-mono text-cyan-500 mt-0.5">IMEI/Serial: {item.imeiOrSerial}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center text-xs">
                      <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-0.5 rounded-full font-bold">
                        {item.warrantyMonths} Months
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">{item.qty}</td>
                    <td className="py-3.5 px-2 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">{item.price.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-right font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t border-slate-800 dark:border-slate-800 light:border-slate-200 pt-4 flex flex-col items-end text-sm space-y-1">
            <div className="w-full md:w-64 flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
              <span>Subtotal</span>
              <span>LKR {invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="w-full md:w-64 flex justify-between text-emerald-500">
                <span>Discount</span>
                <span>- LKR {invoice.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="w-full md:w-64 flex justify-between text-xl font-black text-cyan-500 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 pt-2">
              <span>Grand Total</span>
              <span>LKR {invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="no-print bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <Wrench className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-900">Need Service or Repair?</p>
                <p className="text-slate-400 dark:text-slate-400 light:text-slate-600">Request warranty claims or repairs directly online.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRepairModalOpen(true)}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl border border-amber-500/30 transition"
              >
                Request Repair
              </button>
              <Link
                to="/"
                className="px-4 py-2 bg-slate-800 dark:bg-slate-800 light:bg-white text-slate-200 dark:text-slate-200 light:text-slate-800 font-semibold rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 transition flex items-center space-x-1"
              >
                <span>Back to Home</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Request Modal */}
      {repairModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <span>Submit Repair Ticket</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Device: iPhone 15 Pro Max (IMEI: 359102910293819)</p>

            <div>
              <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block mb-1">Describe Issue</label>
              <textarea
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 text-slate-100 dark:text-slate-100 light:text-slate-900"
                rows={3}
                placeholder="e.g. Screen flickering or battery draining fast..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRepairModalOpen(false)}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs font-semibold rounded-xl"
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
      <header className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
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
                Backend System Hub
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link to="/" className="text-xs text-cyan-500 font-bold hover:underline">
              Back to Store Landing ➔
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 dark:bg-slate-900 light:bg-white p-2 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-md">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'delivery' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-cyan-500'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>3. Delivery Channels (WhatsApp/Email)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'admin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-cyan-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>9. Admin Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-cyan-500'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>10. AI Assistant</span>
          </button>
        </div>

        {activeTab === 'delivery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-emerald-500">
                <MessageSquare className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-100 dark:text-white light:text-slate-900">WhatsApp Delivery Template</h3>
              </div>
              <div className="bg-slate-950 dark:bg-slate-950 light:bg-slate-50 p-4 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3 font-sans text-xs">
                <div className="bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/60 dark:border-emerald-800/60 light:border-emerald-200 p-3 rounded-xl text-slate-200 dark:text-slate-200 light:text-slate-800 space-y-2">
                  <p className="font-bold text-emerald-500">ABC Mobile / I-Store POS</p>
                  <p>Thank you for shopping with ABC Mobile, Kasun Perera!</p>
                  <p className="font-mono text-cyan-500">Your invoice: https://store.com/i/7Hd82k</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-cyan-500">
                <Mail className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-100 dark:text-white light:text-slate-900">Email Delivery Template</h3>
              </div>
              <div className="bg-slate-950 dark:bg-slate-950 light:bg-slate-50 p-4 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3 text-xs">
                <div className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2 text-slate-400">
                  <p><span className="text-slate-500">Subject:</span> Your invoice from ABC Mobile #INV-2026-8942</p>
                </div>
                <div className="space-y-2 text-slate-300 dark:text-slate-300 light:text-slate-700">
                  <p className="font-bold text-slate-100 dark:text-white light:text-slate-900">Hello Kasun,</p>
                  <p>Thank you for your purchase of iPhone 15 Pro Max.</p>
                  <div className="pt-2 flex space-x-2">
                    <Link to="/invoice/INV-2026-8942?token=sec_98a71b" className="px-3 py-1.5 bg-cyan-600 text-white font-bold rounded-lg text-xs">
                      View Online Invoice
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
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Today's Bills</span>
                <span className="text-2xl font-black text-slate-100 dark:text-white light:text-slate-900 mt-1 block">154</span>
              </div>
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Emails Sent</span>
                <span className="text-2xl font-black text-cyan-500 mt-1 block">130</span>
              </div>
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">WhatsApp Sent</span>
                <span className="text-2xl font-black text-emerald-500 mt-1 block">145</span>
              </div>
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block">Failed Delivery</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">2</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl max-w-xl mx-auto">
            <div className="flex items-center space-x-3 text-cyan-500">
              <Bot className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-100 dark:text-white light:text-slate-900">AI Sales & Warranty Assistant</h3>
            </div>
            <div className="bg-slate-950 dark:bg-slate-950 light:bg-slate-50 p-4 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3 text-xs">
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white p-3 rounded-xl border border-slate-800 text-slate-300">
                <span className="font-bold text-cyan-500 block mb-1">Customer Question:</span>
                "I bought a phone last year. What model was it and when does warranty expire?"
              </div>
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-xl text-slate-200">
                <span className="font-bold text-cyan-500 block mb-1">AI Assistant Response:</span>
                "You purchased the <span className="font-bold text-white">Samsung A54 5G</span> on March 12, 2025. Your warranty expires in <span className="text-emerald-500 font-bold">34 days</span>!"
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
