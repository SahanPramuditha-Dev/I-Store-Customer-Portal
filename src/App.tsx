import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Receipt, 
  ShieldCheck, 
  Wrench, 
  Download, 
  Printer, 
  CheckCircle2, 
  Smartphone,
  Sparkles,
  MapPin,
  Sun,
  Lock,
  ChevronRight,
  UserCheck,
  Send,
  Mail,
  MessageSquare,
  Bot,
  BarChart3,
  Bell,
  CheckCheck,
  RefreshCw,
  Search,
  PlusCircle,
  FileText,
  Star,
  Cpu
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
/* FEATURE 4, 5, 6: ONLINE INVOICE VIEWER + QR CODE + WARRANTY                */
/* -------------------------------------------------------------------------- */
function PublicInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const invoice = id ? MOCK_INVOICES[id] : MOCK_INVOICES['INV-2026-8942'];
  const fullUrl = window.location.href;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Actions & Channels Banner */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">I-STORE Smart Receipt</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">Sent via WhatsApp & Email to {invoice.customerPhone}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print</span>
            </button>
            <button
              onClick={() => alert('Downloading official PDF receipt...')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Header & QR Code */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-8 gap-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                <h1 className="text-2xl font-black tracking-wider text-white">I-STORE MOBILE</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">Liberty Plaza, Colombo 03 | Support: +94 11 234 5678</p>
              <p className="text-xs text-slate-500">Tax ID: 90218-VAT</p>
            </div>

            {/* Feature 5: Smart QR Code Receipt */}
            <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
              <div className="bg-white p-1.5 rounded-xl">
                <QRCodeSVG value={fullUrl} size={64} />
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-cyan-400 block">Scan to View</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Verification QR</span>
                <span className="font-mono text-[11px] text-slate-300 font-bold block">{invoice.id}</span>
              </div>
            </div>
          </div>

          {/* Customer Metadata & Loyalty */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Customer</span>
              <span className="font-bold text-slate-200">{invoice.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Phone Number</span>
              <span className="font-medium text-slate-300">{invoice.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Payment</span>
              <span className="font-medium text-emerald-400">{invoice.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Earned Points</span>
              <span className="font-bold text-amber-400 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>+{invoice.loyaltyPoints} PTS</span>
              </span>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Purchased Item</th>
                  <th className="py-3 px-2 text-center">Warranty</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Price (LKR)</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-2">
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      {item.imeiOrSerial && (
                        <p className="text-xs font-mono text-cyan-400 mt-0.5">IMEI/Serial: {item.imeiOrSerial}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center text-xs">
                      <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-0.5 rounded-full font-bold">
                        {item.warrantyMonths} Months
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-300 font-medium">{item.qty}</td>
                    <td className="py-3.5 px-2 text-right text-slate-300">{item.price.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-right font-bold text-slate-100">
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="border-t border-slate-800 pt-4 flex flex-col items-end text-sm space-y-1">
            <div className="w-full md:w-64 flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>LKR {invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="w-full md:w-64 flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>- LKR {invoice.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="w-full md:w-64 flex justify-between text-xl font-black text-cyan-400 border-t border-slate-800 pt-2">
              <span>Grand Total</span>
              <span>LKR {invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Actions: Repair Request & Portal Link */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <Wrench className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-bold text-slate-200">Need Service or Repair?</p>
                <p className="text-slate-400">Request warranty claims or repairs directly online.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRepairModalOpen(true)}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl border border-amber-500/30 transition"
              >
                Request Repair
              </button>
              <Link
                to="/portal"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1"
              >
                <span>Customer Portal</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Request Modal */}
      {repairModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <span>Submit Repair Ticket</span>
            </h3>
            <p className="text-xs text-slate-400">Device: iPhone 15 Pro Max (IMEI: 359102910293819)</p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Describe Issue</label>
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 text-slate-100"
                rows={3}
                placeholder="e.g. Screen flickering or battery draining fast..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRepairModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
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
/* MAIN DASHBOARD: DEMO HUB FOR ALL 10 FEATURES                               */
/* -------------------------------------------------------------------------- */
function AllFeaturesHub() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'admin' | 'ai' | 'customer'>('delivery');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                I-STORE ERP
              </span>
              <span className="ml-2 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Smart Bill Suite
              </span>
            </div>
          </div>

          <Link
            to="/invoice/INV-2026-8942?token=sec_98a71b"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Open Online Receipt Link</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6">
        
        {/* Feature Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'delivery' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>3. Delivery Channels (WhatsApp/Email)</span>
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'admin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>9. Admin Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>10. AI Assistant</span>
          </button>
        </div>

        {/* FEATURE 3: SMART DELIVERY CHANNELS */}
        {activeTab === 'delivery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* WhatsApp Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
                <h3 className="font-bold text-base text-white">WhatsApp Delivery Template</h3>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-sans text-xs">
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl text-slate-200 space-y-2">
                  <p className="font-bold text-emerald-400">ABC Mobile / I-Store POS</p>
                  <p>Thank you for shopping with ABC Mobile, Kasun Perera!</p>
                  <p className="font-mono text-cyan-400">Your invoice: https://store.com/i/7Hd82k</p>
                  <p className="font-mono text-cyan-400">Warranty details: https://store.com/w/7Hd82k</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <CheckCheck className="w-4 h-4 text-cyan-400" />
                    <span>Delivered & Read</span>
                  </span>
                  <button onClick={() => alert('WhatsApp resent!')} className="text-cyan-400 hover:underline">
                    Resend Message
                  </button>
                </div>
              </div>
            </div>

            {/* Email Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 text-cyan-400">
                <Mail className="w-6 h-6" />
                <h3 className="font-bold text-base text-white">Email Delivery Template</h3>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="border-b border-slate-800 pb-2 text-slate-400">
                  <p><span className="text-slate-500">Subject:</span> Your invoice from ABC Mobile #INV-2026-8942</p>
                </div>
                <div className="space-y-2 text-slate-300">
                  <p className="font-bold text-white">Hello Kasun,</p>
                  <p>Thank you for your purchase of iPhone 15 Pro Max.</p>
                  <div className="pt-2 flex space-x-2">
                    <Link to="/invoice/INV-2026-8942?token=sec_98a71b" className="px-3 py-1.5 bg-cyan-600 text-white font-bold rounded-lg text-xs">
                      View Online Invoice
                    </Link>
                    <button onClick={() => alert('PDF downloading...')} className="px-3 py-1.5 bg-slate-800 text-slate-200 font-semibold rounded-lg text-xs">
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 9: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Analytics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-bold block">Today's Bills</span>
                <span className="text-2xl font-black text-white mt-1 block">154</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-bold block">Emails Sent</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 block">130</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-bold block">WhatsApp Sent</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">145</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-bold block">Failed Delivery</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">2</span>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 10: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-w-xl mx-auto">
            <div className="flex items-center space-x-3 text-cyan-400">
              <Bot className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">AI Sales & Warranty Support Assistant</h3>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300">
                <span className="font-bold text-cyan-400 block mb-1">Customer Question:</span>
                "I bought a phone last year. What model was it and when does warranty expire?"
              </div>
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-xl text-slate-200">
                <span className="font-bold text-cyan-400 block mb-1">AI Assistant Response:</span>
                "You purchased the <span className="font-bold text-white">Samsung A54 5G</span> on March 12, 2025. Your warranty expires in <span className="text-emerald-400 font-bold">34 days</span>!"
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ROUTER SETUP                                                               */
/* -------------------------------------------------------------------------- */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AllFeaturesHub />} />
        <Route path="/invoice/:id" element={<PublicInvoicePage />} />
        <Route path="/i/:shortCode" element={<PublicInvoicePage />} />
        <Route path="/portal" element={<AllFeaturesHub />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
