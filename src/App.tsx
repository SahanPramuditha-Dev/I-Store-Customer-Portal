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
  ArrowRight
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

/* -------------------------------------------------------------------------- */
/* THEME TOGGLE BUTTON COMPONENT                                             */
/* -------------------------------------------------------------------------- */
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="p-2.5 rounded-xl bg-slate-800/60 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700/80 dark:hover:bg-slate-700 text-amber-400 dark:text-cyan-400 border border-slate-700/60 dark:border-slate-700 light:border-slate-300 transition shadow-sm"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* REAL LANDING PAGE (Root URL: /)                                            */
/* -------------------------------------------------------------------------- */
function StoreLandingPage({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const [searchId, setSearchId] = useState('');
  const [phoneLogin, setPhoneLogin] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-xl sticky top-0 z-50 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                I-STORE
              </span>
              <span className="ml-2 text-xs bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Customer Care & Services
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link
              to="/invoice/INV-2026-8942?token=sec_98a71b"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition"
            >
              <Receipt className="w-4 h-4" />
              <span>Sample Smart Bill</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-500">
            <Sparkles className="w-4 h-4" />
            <span>Digital Receipts & Warranty Self-Service Portal</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-100 dark:text-white light:text-slate-900 tracking-tight leading-tight">
            Track Purchases, Claims & Warranties in One Place
          </h1>
          <p className="text-sm md:text-base text-slate-400 dark:text-slate-400 light:text-slate-600">
            Received an SMS or WhatsApp invoice link? Lookup your receipt details instantly or sign in with your phone number.
          </p>

          {/* Quick Invoice Lookup Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchId.trim()) {
                  window.location.href = `/invoice/INV-2026-8942?token=sec_98a71b`;
                }
              }}
              className="flex items-center bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 p-2 rounded-2xl shadow-xl"
            >
              <div className="pl-3 text-slate-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Invoice Number (e.g. INV-2026-8942)"
                className="w-full bg-transparent border-none px-3 py-2 text-sm text-slate-100 dark:text-white light:text-slate-900 focus:outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 shadow-md shadow-cyan-500/20"
              >
                <span>Find Bill</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Feature Grid for Customers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 p-6 rounded-3xl space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 dark:text-white light:text-slate-900">Digital Invoices</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              No paper receipts needed! Access verified digital receipts anytime via WhatsApp, SMS, or direct links.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 p-6 rounded-3xl space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 dark:text-white light:text-slate-900">Warranty Tracking</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Every purchased mobile & accessory serial number / IMEI is automatically backed up for instant warranty checks.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 p-6 rounded-3xl space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 dark:text-white light:text-slate-900">Online Repair Tickets</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Device issue? Request repairs online and track real-time progress from technician inspection to completion.
            </p>
          </div>
        </div>

        {/* Customer Self-Service Account Box */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 dark:from-slate-900 dark:to-indigo-950/40 light:from-white light:to-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl max-w-xl mx-auto space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-100 dark:text-white light:text-slate-900">Sign In to Customer Account</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Enter your phone number to view all past invoices & warranties.</p>
          </div>

          {!userLoggedIn ? (
            <div className="space-y-3">
              <input
                type="text"
                value={phoneLogin}
                onChange={(e) => setPhoneLogin(e.target.value)}
                placeholder="Mobile Number (e.g. +94 77 123 4567)"
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-100 dark:text-white light:text-slate-900 focus:outline-none"
              />

              {!otpMode ? (
                <button
                  onClick={() => setOtpMode(true)}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25"
                >
                  Send OTP Code
                </button>
              ) : (
                <button
                  onClick={() => setUserLoggedIn(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25"
                >
                  Verify Passcode & Enter Portal
                </button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-emerald-400">Welcome Back, Kasun Perera!</p>
              <div className="flex justify-center space-x-2">
                <Link
                  to="/invoice/INV-2026-8942?token=sec_98a71b"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold"
                >
                  View Purchases & Receipts
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 dark:border-slate-800 light:border-slate-200 bg-slate-900/40 text-center py-6 text-xs text-slate-500">
        <p>© 2026 I-Store Electronics. Customer Smart Bill & Portal Engine.</p>
        <div className="mt-2 flex justify-center space-x-4 text-[11px]">
          <Link to="/demo-hub" className="text-cyan-500 hover:underline font-semibold">ERP System Demo & Admin Hub ➔</Link>
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

/* -------------------------------------------------------------------------- */
/* ROUTER SETUP WITH THEME STATE                                              */
/* -------------------------------------------------------------------------- */
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
