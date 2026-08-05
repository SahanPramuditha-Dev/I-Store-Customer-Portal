import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Link } from 'react-router-dom';
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
  CloudRain,
  Cloud,
  Lock,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  warrantyMonths: number;
  serialNumber?: string;
}

interface Invoice {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  token: string;
}

// Mock Database of Invoices
const MOCK_INVOICES: Record<string, Invoice> = {
  'INV-2026-8942': {
    id: 'INV-2026-8942',
    token: 'sec_98a71b',
    date: '2026-08-05 14:32',
    customerName: 'Sahan Dev',
    customerPhone: '+94 77 123 4567',
    customerEmail: 'sahan@dev.com',
    items: [
      { name: 'iPhone 15 Pro Max - 256GB Natural Titanium', qty: 1, price: 349900, warrantyMonths: 12, serialNumber: 'F2LX9081K9' },
      { name: 'Apple 20W USB-C Power Adapter', qty: 1, price: 8500, warrantyMonths: 6, serialNumber: 'C98127390X' },
      { name: 'MagSafe Silicone Case - Dark Blue', qty: 1, price: 12500, warrantyMonths: 3 }
    ],
    subtotal: 370900,
    tax: 0,
    discount: 5900,
    total: 365000,
    paymentMethod: 'Card (Visa ****4821)'
  },
  'INV-2026-1002': {
    id: 'INV-2026-1002',
    token: 'sec_11b22c',
    date: '2026-08-04 10:15',
    customerName: 'Alex Smith',
    customerPhone: '+94 71 987 6543',
    customerEmail: 'alex@example.com',
    items: [
      { name: 'MacBook Air M2 - 8GB / 256GB Space Gray', qty: 1, price: 385000, warrantyMonths: 12, serialNumber: 'C02G81920X' }
    ],
    subtotal: 385000,
    tax: 0,
    discount: 0,
    total: 385000,
    paymentMethod: 'Bank Transfer'
  }
};

/* -------------------------------------------------------------------------- */
/* 1. DYNAMIC INVOICE PAGE (Public URL when clicking link from Email/WhatsApp)*/
/* URL Pattern: /invoice/:id?token=sec_98a71b                                 */
/* -------------------------------------------------------------------------- */
function PublicInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const invoice = id ? MOCK_INVOICES[id] : null;

  // Security check: verify link token
  if (!invoice || (token && invoice.token !== token)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Invalid or Expired Link</h1>
          <p className="text-xs text-slate-400">
            This invoice link is either invalid or missing security verification. Please check the WhatsApp or Email link sent to you.
          </p>
          <Link
            to="/portal"
            className="inline-block mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-cyan-400 border border-slate-700 transition"
          >
            Go to Customer Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Official Digital Invoice</span>
              <span className="text-xs text-slate-400">Paid • Delivered via SMS/WhatsApp</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium border border-slate-700 transition text-slate-200"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print</span>
            </button>
            <button
              onClick={() => alert('Downloading official PDF receipt...')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Clean Printable Invoice Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h1 className="text-2xl font-black text-white">I-STORE ELECTRONICS</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">Liberty Plaza, Colombo 03 | Hotline: +94 11 234 5678</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-left md:text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Receipt ID</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{invoice.id}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{invoice.date}</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Billed To</span>
              <span className="font-bold text-slate-200">{invoice.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Phone Number</span>
              <span className="font-medium text-slate-300">{invoice.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-semibold block mb-0.5">Payment Method</span>
              <span className="font-medium text-emerald-400">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Item</th>
                  <th className="py-3 px-2 text-center">Warranty</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Price (LKR)</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      {item.serialNumber && (
                        <p className="text-xs font-mono text-slate-500">S/N: {item.serialNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-xs">
                      <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                        {item.warrantyMonths} Months
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">{item.qty}</td>
                    <td className="py-3 px-2 text-right text-slate-300">{item.price.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-bold text-slate-100">
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
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
            <div className="w-full md:w-64 flex justify-between text-lg font-black text-cyan-400 border-t border-slate-800 pt-2">
              <span>Grand Total</span>
              <span>LKR {invoice.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-500 flex justify-between items-center">
            <span>Thank you for shopping at I-Store!</span>
            <Link to="/portal" className="text-cyan-400 hover:underline flex items-center space-x-1">
              <span>View All Past Receipts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. DEMO LANDING PAGE (For testing links & understanding flow)              */
/* -------------------------------------------------------------------------- */
function DemoHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
        <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-cyan-500/30">
          <Smartphone className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white">I-Store Smart Bill Link System</h1>
          <p className="text-sm text-slate-400 mt-2">
            Simulate what happens when a customer receives a link via WhatsApp or Email on their phone.
          </p>
        </div>

        {/* Demo Link Buttons */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Test Unique Invoice Links</span>
          
          <Link
            to="/invoice/INV-2026-8942?token=sec_98a71b"
            className="flex justify-between items-center bg-slate-900 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 transition group"
          >
            <div>
              <p className="text-sm font-bold text-cyan-400">Receipt #INV-2026-8942</p>
              <p className="text-xs text-slate-500">Customer: Sahan Dev (LKR 365,000)</p>
            </div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white px-3 py-1 rounded-lg font-medium transition">
              Open Receipt Link ➔
            </span>
          </Link>

          <Link
            to="/invoice/INV-2026-1002?token=sec_11b22c"
            className="flex justify-between items-center bg-slate-900 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 transition group"
          >
            <div>
              <p className="text-sm font-bold text-cyan-400">Receipt #INV-2026-1002</p>
              <p className="text-xs text-slate-500">Customer: Alex Smith (LKR 385,000)</p>
            </div>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white px-3 py-1 rounded-lg font-medium transition">
              Open Receipt Link ➔
            </span>
          </Link>
        </div>

        <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-xs text-slate-500">
          <Link to="/portal" className="text-slate-400 hover:text-cyan-400 transition">
            Customer Account Portal ➔
          </Link>
          <span>I-Store Customer Portal v2.5</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. MAIN ROUTER APPLICATION                                                 */
/* -------------------------------------------------------------------------- */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoHome />} />
        <Route path="/invoice/:id" element={<PublicInvoicePage />} />
        <Route path="/portal" element={<DemoHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
