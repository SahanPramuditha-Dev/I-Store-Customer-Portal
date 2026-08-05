import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  Wrench, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Smartphone,
  ChevronRight,
  Sun,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Calendar,
  Sparkles,
  MapPin,
  ExternalLink,
  Shield,
  FileText,
  UserCheck,
  Send,
  HelpCircle,
  Bell
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
  status: 'Paid' | 'Pending' | 'Refunded';
}

export function App() {
  const [activeTab, setActiveTab] = useState<'invoice' | 'portal' | 'warranty' | 'repair' | 'weather'>('invoice');
  const [phoneInput, setPhoneInput] = useState('+94 77 123 4567');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Weather Widget State (Store location weather for delivery/visit planning)
  const [weatherData, setWeatherData] = useState({
    city: 'Colombo, Sri Lanka',
    temp: 29,
    condition: 'Partly Cloudy',
    humidity: 78,
    windSpeed: 14,
    uvIndex: 8,
    forecast: [
      { day: 'Today', temp: 29, icon: 'sun-cloud' },
      { day: 'Tomorrow', temp: 30, icon: 'sun' },
      { day: 'Fri', temp: 28, icon: 'rain' },
      { day: 'Sat', temp: 29, icon: 'sun' }
    ]
  });

  // Mock Invoice Data
  const sampleInvoice: Invoice = {
    id: 'INV-2026-8942',
    date: '2026-08-05 14:32',
    customerName: 'Sahan Dev',
    customerPhone: '+94 77 123 4567',
    customerEmail: 'sahan@dev.com',
    status: 'Paid',
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
  };

  const sampleWarranties = [
    { id: 'W-01', item: 'iPhone 15 Pro Max - 256GB', serial: 'F2LX9081K9', purchaseDate: '2026-08-05', expires: '2027-08-05', status: 'Active', daysLeft: 365 },
    { id: 'W-02', item: 'Apple 20W Power Adapter', serial: 'C98127390X', purchaseDate: '2026-08-05', expires: '2027-02-05', status: 'Active', daysLeft: 184 }
  ];

  const sampleRepairs = [
    { id: 'REP-7701', device: 'MacBook Air M2', issue: 'Display Backlight Inspection', status: 'In Repair', estimatedCompletion: '2026-08-07', technician: 'Tech Team Alpha' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Glassmorphic Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('invoice')}>
            <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-cyan-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  I-STORE
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  ERP Nexius
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Billing & Customer Care Portal</p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'invoice' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Smart Bill</span>
            </button>
            
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'portal' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('warranty')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'warranty' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Warranties</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'weather' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Store Weather</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6 relative z-10">
        
        {/* TAB 1: Smart Bill / Invoice View */}
        {activeTab === 'invoice' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Security & Action Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-base text-slate-100">Verified Official Digital Invoice</h2>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Paid
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sent directly to <span className="text-cyan-400 font-medium">{sampleInvoice.customerPhone}</span> & Email.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl text-xs font-semibold border border-slate-700/80 transition text-slate-200"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => alert('Downloading official PDF receipt...')}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Premium Smart Receipt Layout */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Company Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-8 gap-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h1 className="text-2xl font-black tracking-wider text-white">I-STORE ELECTRONICS</h1>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Flagship Store: No. 45, Tech Galleria, Liberty Plaza, Colombo 03</p>
                  <p className="text-xs text-slate-500">Support Hotline: +94 11 234 5678 | Tax ID: 90218-VAT</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-left md:text-right min-w-[220px]">
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block">Receipt Number</span>
                  <span className="text-base font-mono font-bold text-cyan-400">{sampleInvoice.id}</span>
                  <p className="text-xs text-slate-400 mt-1">Issued: {sampleInvoice.date}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase font-semibold block mb-0.5">Billed To</span>
                  <span className="font-bold text-slate-200 text-sm">{sampleInvoice.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold block mb-0.5">Phone Number</span>
                  <span className="font-medium text-slate-300">{sampleInvoice.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold block mb-0.5">Payment Method</span>
                  <span className="font-medium text-emerald-400">{sampleInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Product Description</th>
                      <th className="py-3 px-3 text-center">Warranty</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price (LKR)</th>
                      <th className="py-3 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {sampleInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-3">
                          <p className="font-semibold text-slate-100">{item.name}</p>
                          {item.serialNumber && (
                            <p className="text-xs font-mono text-slate-500 mt-0.5">S/N: {item.serialNumber}</p>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center text-xs">
                          <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded-full font-semibold">
                            {item.warrantyMonths} Months
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center text-slate-300 font-medium">{item.qty}</td>
                        <td className="py-4 px-3 text-right text-slate-300">{item.price.toLocaleString()}</td>
                        <td className="py-4 px-3 text-right font-bold text-slate-100">
                          {(item.price * item.qty).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation */}
              <div className="border-t border-slate-800 pt-6 flex flex-col items-end text-sm space-y-2">
                <div className="w-full md:w-72 flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>LKR {sampleInvoice.subtotal.toLocaleString()}</span>
                </div>
                {sampleInvoice.discount > 0 && (
                  <div className="w-full md:w-72 flex justify-between text-emerald-400">
                    <span>Special Loyalty Discount</span>
                    <span>- LKR {sampleInvoice.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="w-full md:w-72 flex justify-between text-xl font-black text-cyan-400 border-t border-slate-800 pt-3">
                  <span>Grand Total</span>
                  <span>LKR {sampleInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Warranty & Store Policy Notice */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-200">Official I-Store Warranty Activated</p>
                    <p className="text-slate-400">Your purchase is automatically backed up in our cloud database for easy warranty claims.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('warranty')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-medium border border-slate-700 transition flex items-center space-x-1 whitespace-nowrap"
                >
                  <span>Check Warranty Status</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Full Customer Portal / ERP Dashboard */}
        {activeTab === 'portal' && (
          <div className="space-y-6 animate-fade-in">
            {!isLoggedIn ? (
              /* Mobile OTP Login Card */
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/30">
                  <Smartphone className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">Customer Account Login</h2>
                  <p className="text-xs text-slate-400 mt-1">Access all your receipts, warranties, and repair status instantly.</p>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Registered Mobile Number</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition text-slate-100 font-mono"
                      placeholder="+94 77 000 0000"
                    />
                  </div>

                  {otpSent && (
                    <div className="animate-fade-in">
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Enter 4-Digit Passcode (OTP)</label>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-cyan-500 transition text-slate-100"
                        placeholder="1 2 3 4"
                      />
                    </div>
                  )}

                  {!otpSent ? (
                    <button
                      onClick={() => setOtpSent(true)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-sm text-white hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
                    >
                      Send One-Time Passcode (OTP)
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsLoggedIn(true)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl font-bold text-sm text-white hover:opacity-90 transition shadow-lg shadow-emerald-500/25"
                    >
                      Verify & Log In
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Customer Logged In Dashboard */
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                      SD
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-slate-100">{sampleInvoice.customerName}</h2>
                      <p className="text-xs text-slate-400">{sampleInvoice.customerPhone} | {sampleInvoice.customerEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition font-semibold text-slate-300"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Receipts */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-3 text-cyan-400">
                      <Receipt className="w-5 h-5" />
                      <h3 className="font-bold">Recent Receipts</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-slate-100">INV-2026-8942</p>
                          <p className="text-xs text-slate-500">2026-08-05</p>
                        </div>
                        <span className="text-cyan-400 font-bold text-sm">LKR 365,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Warranties */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-3 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                      <h3 className="font-bold">Active Warranties</h3>
                    </div>
                    <div className="space-y-3">
                      {sampleWarranties.map((w, i) => (
                        <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{w.item}</span>
                            <span className="text-emerald-400">{w.status}</span>
                          </div>
                          <p className="text-slate-500">S/N: {w.serial}</p>
                          <p className="text-slate-400">Valid until: {w.expires}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repairs */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-3 text-amber-400">
                      <Wrench className="w-5 h-5" />
                      <h3 className="font-bold">Repair Tracker</h3>
                    </div>
                    <div className="space-y-3">
                      {sampleRepairs.map((r, i) => (
                        <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{r.device}</span>
                            <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                              {r.status}
                            </span>
                          </div>
                          <p className="text-slate-400">{r.issue}</p>
                          <p className="text-slate-500">Est. Completion: {r.estimatedCompletion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Warranty Center */}
        {activeTab === 'warranty' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
                <div>
                  <h2 className="text-xl font-bold text-white">Warranty & Serial Lookup</h2>
                  <p className="text-xs text-slate-400">Verify your product warranty status instantly by Serial Number or Receipt ID.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sampleWarranties.map((w, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{w.item}</h4>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">Serial: {w.serial}</p>
                      </div>
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                        {w.daysLeft} Days Remaining
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between">
                        <span>Purchase Date:</span>
                        <span className="text-slate-200">{w.purchaseDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiration Date:</span>
                        <span className="text-slate-200">{w.expires}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Store Weather Widget */}
        {activeTab === 'weather' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Sun className="w-6 h-6 animate-spin-slow" />
                    <h2 className="text-xl font-bold text-white">Store & Delivery Weather</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Live weather conditions for store visits & courier deliveries in {weatherData.city}.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{weatherData.city}</span>
                </div>
              </div>

              {/* Main Weather Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold block">Temperature</span>
                    <span className="text-3xl font-black text-white mt-1 block">{weatherData.temp}°C</span>
                    <span className="text-xs text-amber-400 font-medium">{weatherData.condition}</span>
                  </div>
                  <Sun className="w-10 h-10 text-amber-400" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold block">Humidity</span>
                    <span className="text-2xl font-bold text-white mt-1 block">{weatherData.humidity}%</span>
                    <span className="text-xs text-slate-400">Optimal for electronics</span>
                  </div>
                  <Droplets className="w-8 h-8 text-blue-400" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold block">Wind Speed</span>
                    <span className="text-2xl font-bold text-white mt-1 block">{weatherData.windSpeed} km/h</span>
                    <span className="text-xs text-slate-400">Gentle breeze</span>
                  </div>
                  <Wind className="w-8 h-8 text-cyan-400" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold block">UV Index</span>
                    <span className="text-2xl font-bold text-white mt-1 block">{weatherData.uvIndex} (High)</span>
                    <span className="text-xs text-amber-400">Sun protection advised</span>
                  </div>
                  <Thermometer className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              {/* Weather Forecast */}
              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>4-Day Store Visit Forecast</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {weatherData.forecast.map((item, i) => (
                    <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-400">{item.day}</p>
                      <div className="flex justify-center text-amber-400">
                        {item.icon === 'sun' ? <Sun className="w-6 h-6" /> : item.icon === 'rain' ? <CloudRain className="w-6 h-6 text-blue-400" /> : <Cloud className="w-6 h-6 text-slate-400" />}
                      </div>
                      <p className="text-sm font-bold text-slate-100">{item.temp}°C</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 text-center py-6 text-xs text-slate-500 space-y-2">
        <p>© 2026 I-Store Electronics POS System. Powered by Supabase & Nexius Platform.</p>
        <p className="text-slate-600">Official Customer Bill Link Engine v2.4 | Verified Security</p>
      </footer>
    </div>
  );
}

export default App;
