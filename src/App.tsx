import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingView from './components/LandingView';
import InvoiceView from './components/InvoiceView';
import WarrantyVerifyView from './components/WarrantyVerifyView';
import RepairTrackerView from './components/RepairTrackerView';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
        <Routes>
          {/* Main Landing & Customer Vault Portal */}
          <Route path="/" element={<LandingView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/store/:storeSlug" element={<LandingView isDark={isDark} toggleTheme={toggleTheme} />} />

          {/* Interactive Digital Invoices & Smart Bills */}
          <Route path="/invoice/:id" element={<InvoiceView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/bill/:id" element={<InvoiceView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/store/:storeSlug/invoice/:id" element={<InvoiceView isDark={isDark} toggleTheme={toggleTheme} />} />

          {/* Official Warranty QR Verification Certificates */}
          <Route path="/verify-warranty/:serial" element={<WarrantyVerifyView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/warranty/verify/:serial" element={<WarrantyVerifyView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/store/:storeSlug/verify-warranty/:serial" element={<WarrantyVerifyView isDark={isDark} toggleTheme={toggleTheme} />} />

          {/* Live Repair Job Tracking & Diagnostic Cards */}
          <Route path="/repair/:id" element={<RepairTrackerView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/repairs/:id" element={<RepairTrackerView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/track/:id" element={<RepairTrackerView isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/store/:storeSlug/repair/:id" element={<RepairTrackerView isDark={isDark} toggleTheme={toggleTheme} />} />

          {/* Fallback to Home */}
          <Route path="*" element={<LandingView isDark={isDark} toggleTheme={toggleTheme} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
