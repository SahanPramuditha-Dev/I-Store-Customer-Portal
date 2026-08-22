import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Receipt, 
  Wrench, 
  Lock, 
  MessageSquare, 
  Phone, 
  MapPin, 
  ArrowUp, 
  Clock, 
  X, 
  RefreshCw, 
  Gift, 
  Calendar, 
  ExternalLink 
} from 'lucide-react';
import type { StoreProfile } from '../../types';

interface PortalFooterProps {
  storeProfile: StoreProfile;
  variant?: 'full' | 'compact';
  onScrollToAccess?: () => void;
}

type PolicyType = 'warranty' | 'sla' | 'privacy' | 'exchange' | null;

export function PortalFooter({ 
  storeProfile, 
  variant = 'full', 
  onScrollToAccess 
}: PortalFooterProps) {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const currentYear = new Date().getFullYear();
  const cleanWhatsApp = (storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '');
  const cleanPhone = (storeProfile.phone || '+94 11 234 5678').trim();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onScrollToAccess) {
      onScrollToAccess();
    } else {
      scrollToTop();
    }
  };

  // Compact Minimalist 1-Line Footer for Authenticated Dashboard / Customer Profile
  if (variant === 'compact') {
    return (
      <>
        <footer className="w-full mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md text-slate-500 py-4 px-4 sm:px-8 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Left: Identity & Encrypted Tag */}
            <div className="flex items-center space-x-2 text-center sm:text-left">
              <span className="font-black text-slate-900 dark:text-white">{storeProfile.name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-500">© {currentYear} Encrypted Customer Vault</span>
            </div>

            {/* Right: Quick Action Links & Policies */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setActivePolicy('warranty')}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Warranty Terms
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              
              <button
                onClick={() => setActivePolicy('sla')}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Service SLA
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                onClick={() => setActivePolicy('privacy')}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(`Hi ${storeProfile.name} Support, I need assistance with my account.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center space-x-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp Help</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>

              <button
                onClick={scrollToTop}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center space-x-0.5 font-semibold text-slate-500"
              >
                <span>Top</span>
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>

          </div>
        </footer>

        {/* Reusable Policy Modal */}
        {renderPolicyModal()}
      </>
    );
  }

  // Full Rich 4-Column Marketing Footer for Public Landing Page
  return (
    <>
      <footer className="w-full mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-[#020617] text-slate-600 dark:text-slate-400 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-200 dark:border-slate-800/70">
            
            {/* Column 1 (2 Cols wide on desktop): Brand Info & Trust */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                    {storeProfile.name}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">
                    Customer Care & Digital Bill Portal
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
                {storeProfile.tagline || 'Official digital bill vault, instant warranty verification certificates, and live hardware repair tracking for retail customers.'}
              </p>

              <div className="space-y-2 pt-1 text-xs">
                {storeProfile.address && (
                  <div className="flex items-start space-x-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{storeProfile.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Mon – Sat: 9:30 AM – 7:30 PM (Sun Closed)</span>
                </div>
              </div>

              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cloud Protection & SHA-256 Vault Online</span>
              </div>
            </div>

            {/* Column 2: Self-Service Portals */}
            <div className="space-y-3.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">
                Customer Services
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button 
                    onClick={handleActionClick} 
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span>Digital Receipt Vault</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleActionClick} 
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Verify IMEI / Serial</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleActionClick} 
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    <span>Track Device Repair</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleActionClick} 
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 text-slate-400" />
                    <span>Loyalty Rewards & Points</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleActionClick} 
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Book Service Slot</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Policies */}
            <div className="space-y-3.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">
                Guarantees & Policies
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button 
                    onClick={() => setActivePolicy('warranty')} 
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Warranty Terms & Scope</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('sla')} 
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Service & Repair SLA</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('privacy')} 
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Privacy & Data Security</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('exchange')} 
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Trade-In & Exchange Policy</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Direct Help */}
            <div className="space-y-3.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">
                Support & Contact
              </h4>
              
              <div className="space-y-2.5">
                {storeProfile.phone && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Helpline</span>
                    <a 
                      href={`tel:${cleanPhone.replace(/\s+/g, '')}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors inline-flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3 text-cyan-600 mr-1" />
                      <span>{storeProfile.phone}</span>
                    </a>
                  </div>
                )}

                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(`Hi ${storeProfile.name} Support, I need help with my digital invoice or warranty.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Care Desk</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>

                {storeProfile.tax_id && (
                  <p className="text-[10px] text-slate-400 font-mono pt-1">
                    Tax / VAT: {storeProfile.tax_id}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
              <p>© {currentYear} <strong className="text-slate-700 dark:text-slate-300 font-semibold">{storeProfile.name}</strong>. All rights reserved.</p>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <p className="text-slate-400">Powered by Nexius Platform.</p>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </footer>

      {/* Interactive Policy Modal */}
      {renderPolicyModal()}
    </>
  );

  function renderPolicyModal() {
    if (!activePolicy) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative text-left">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              {activePolicy === 'warranty' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
              {activePolicy === 'sla' && <Wrench className="w-5 h-5 text-indigo-500" />}
              {activePolicy === 'privacy' && <Lock className="w-5 h-5 text-cyan-500" />}
              {activePolicy === 'exchange' && <RefreshCw className="w-5 h-5 text-amber-500" />}
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activePolicy === 'warranty' && 'Warranty Terms & Conditions'}
                {activePolicy === 'sla' && 'Repair & Service SLA'}
                {activePolicy === 'privacy' && 'Privacy & Data Security Policy'}
                {activePolicy === 'exchange' && 'Trade-In & Exchange Policy'}
              </h3>
            </div>
            <button
              onClick={() => setActivePolicy(null)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            {activePolicy === 'warranty' && (
              <>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Official Hardware Warranty Coverage for {storeProfile.name}:
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Warranty begins from the invoice issuance date and covers manufacturing and component defects.</li>
                  <li>Hardware serial/IMEI must match the cryptographic hash stored in the digital invoice vault.</li>
                  <li>Physical damage, liquid ingress, unauthorized third-party repairs, or tampered seals automatically void coverage.</li>
                  <li>To claim warranty, present this digital certificate or provide your verified contact number in-store.</li>
                </ul>
              </>
            )}

            {activePolicy === 'sla' && (
              <>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Repair & Service Standards for {storeProfile.name}:
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Diagnostic assessment is completed within 24 to 48 business hours of device check-in.</li>
                  <li>Status updates and technician findings are posted in real-time to your tracking link.</li>
                  <li>Devices must be collected within 30 days of repair completion notification.</li>
                  <li>Replaced parts come with a standard 30 to 90-day service warranty depending on component tier.</li>
                </ul>
              </>
            )}

            {activePolicy === 'privacy' && (
              <>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Data Protection & Security Commitment:
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Customer purchase history and warranty records are strictly protected with encrypted session tokens.</li>
                  <li>We do not share your contact number or purchase data with third-party advertisers.</li>
                  <li>SMS and WhatsApp notifications are strictly reserved for bill delivery, warranty updates, and repair alerts.</li>
                </ul>
              </>
            )}

            {activePolicy === 'exchange' && (
              <>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Trade-In & Exchange Standards:
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Device trade-in estimates are based on live physical grading and diagnostic inspection in-store.</li>
                  <li>Customer must verify ownership and ensure all account locks (iCloud, Google FRP) are removed prior to exchange.</li>
                  <li>Vouchers and loyalty discounts are non-transferable and can be applied directly at POS checkout.</li>
                </ul>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{storeProfile.name} Customer Care</span>
            <button
              onClick={() => setActivePolicy(null)}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    );
  }
}
