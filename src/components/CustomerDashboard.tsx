import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, Wrench, Smartphone, Sparkles, ChevronRight, MessageSquare, 
  BarChart3, ShieldCheck, Search, PlusCircle, Copy, LogOut, 
  ArrowUpRight, Gift, Calendar, Tag, ArrowLeftRight, BadgeCheck, 
  Package, Laptop, Clock
} from 'lucide-react';
import { supabase } from '../supabase';
import { CustomSelect } from './ui/CustomSelect';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { PortalFooter } from './layout/PortalFooter';
import { WarrantyClaimModal } from '../features/warranties/WarrantyClaimModal';
import type { 
  StoreProfile, CustomerDevice, RepairTicketRecord, WarrantyClaimRecord, 
  AppointmentRecord 
} from '../types';
import { createGoogleCalendarUrl, ThemeToggle } from '../utils/security';

export default function CustomerDashboard({
  customerName,
  customerPhone,
  invoices,
  storeProfile,
  isDark,
  toggleTheme,
  onSignOut
}: {
  customerName: string;
  customerPhone: string;
  invoices: any[];
  storeProfile: StoreProfile;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'repairs' | 'rewards'>('overview');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'active' | 'serviced'>('all');
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedDeviceForRepair, setSelectedDeviceForRepair] = useState<string>('');
  const [repairIssueInput, setRepairIssueInput] = useState('');
  const [submittingRepair, setSubmittingRepair] = useState(false);
  const [repairsList, setRepairsList] = useState<RepairTicketRecord[]>([]);
  const [claimsList, setClaimsList] = useState<WarrantyClaimRecord[]>([
    {
      id: 'WC-2026-0021',
      deviceId: 'demo-1',
      deviceName: 'iPhone 15',
      serialOrImei: '356948210492810',
      invoiceId: 'INV-2026-000003',
      issueCategory: 'Display & Screen',
      issueDescription: 'Screen flickering intermittently during outdoor use.',
      contactPhone: customerPhone,
      status: 'Under Review',
      statusNote: 'Authorized technician assigned to verify hardware coverage.',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);
  const [timelineDevice, setTimelineDevice] = useState<CustomerDevice | null>(null);
  const [copiedText, setCopiedText] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  // Loyalty & Trade-In State
  const [claimedVouchers, setClaimedVouchers] = useState<string[]>([]);
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInCondition, setTradeInCondition] = useState('Flawless');

  // Appointments State
  const [appointmentsList, setAppointmentsList] = useState<AppointmentRecord[]>([
    {
      id: 'APT-9042',
      deviceName: 'iPhone 15',
      serviceType: 'Express Diagnostic Check',
      date: 'Aug 22, 2026',
      timeSlot: 'Afternoon Slot (2 PM - 5 PM)',
      status: 'Confirmed'
    }
  ]);
  const [apptDevice, setApptDevice] = useState('');
  const [apptService, setApptService] = useState('Diagnostic & Health Check');
  const [apptDate, setApptDate] = useState('');
  const [apptSlot, setApptSlot] = useState('Morning (10:00 AM - 1:00 PM)');

  // Extract all Customer Devices from invoices with intelligent parsing
  const devices: CustomerDevice[] = useMemo(() => {
    const list: CustomerDevice[] = [];
    invoices.forEach((inv) => {
      const invDate = new Date(inv.created_at || Date.now());
      (inv.invoice_items || []).forEach((item: any, idx: number) => {
        const wMonths = Number(item.warranty_months || 0);
        const wDays = Number(item.warranty_days || (wMonths ? wMonths * 30 : 0));
        const expiry = new Date(invDate);
        if (wDays > 0) {
          expiry.setDate(expiry.getDate() + wDays);
        }
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let rawName = (item.item_name || 'Electronic Product').trim();
        let cleanName = rawName;
        let subTitle = '';
        let category: 'phone' | 'laptop' | 'accessory' | 'repair_service' = 'phone';
        let rawSerial = (item.imei_or_serial || '').trim();
        let serialOrImei = rawSerial;

        // Parse Repair settlement items
        if (rawName.toLowerCase().includes('repair settlement') || rawName.toLowerCase().includes('#job-')) {
          category = 'repair_service';
          const match = rawName.match(/\((.*?)\)/);
          const jobMatch = rawName.match(/(#JOB-[A-Za-z0-9-]+)/);
          if (match && match[1]) {
            cleanName = match[1].trim();
          }
          const jobNo = jobMatch ? jobMatch[1] : '';
          subTitle = jobNo ? `Serviced Hardware · ${jobNo}` : 'Serviced Hardware';
        } else if (rawName.toLowerCase().includes('cable') || rawName.toLowerCase().includes('charger') || rawName.toLowerCase().includes('case') || rawName.toLowerCase().includes('cover') || rawName.toLowerCase().includes('protector') || rawName.toLowerCase().includes('adapter')) {
          category = 'accessory';
          subTitle = 'Genuine Accessory';
        } else if (rawName.toLowerCase().includes('macbook') || rawName.toLowerCase().includes('laptop') || rawName.toLowerCase().includes('dell') || rawName.toLowerCase().includes('hp')) {
          category = 'laptop';
          subTitle = 'Computer Hardware';
        } else {
          subTitle = 'Registered Device';
        }

        // Clean up redundant N/A serials
        if (!serialOrImei || serialOrImei.toLowerCase().includes('n/a')) {
          if (category === 'repair_service') {
            const jobMatch = rawName.match(/(#JOB-[A-Za-z0-9-]+)/);
            serialOrImei = jobMatch ? jobMatch[1] : '';
          } else {
            serialOrImei = '';
          }
        }

        const isNoWarranty = wDays === 0;
        const status: 'active' | 'expiring' | 'expired' =
          isNoWarranty ? 'expired' : daysLeft <= 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'active';

        list.push({
          id: `${inv.id}-${idx}`,
          name: rawName,
          cleanName,
          subTitle,
          category,
          serialOrImei,
          purchaseDate: invDate.toLocaleDateString(),
          invoiceId: inv.id,
          invoiceToken: inv.token,
          warrantyMonths: wMonths,
          warrantyDays: wDays,
          warrantyExpiryDate: expiry,
          daysRemaining: Math.max(0, daysLeft),
          status,
          isNoWarranty,
        });
      });
    });
    return list;
  }, [invoices]);

  const totalPoints = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      const pts = inv.loyalty_points !== undefined && inv.loyalty_points !== null
        ? Number(inv.loyalty_points)
        : Math.floor(Number(inv.total || 0) / 1000);
      return acc + Math.max(0, pts);
    }, 0);
  }, [invoices]);

  const activeWarrantiesCount = useMemo(() => {
    return devices.filter(d => d.status === 'active' || d.status === 'expiring').length;
  }, [devices]);

  const filteredDevices = useMemo(() => {
    if (deviceFilter === 'active') return devices.filter(d => d.status === 'active' || d.status === 'expiring');
    if (deviceFilter === 'serviced') return devices.filter(d => d.category === 'repair_service' || d.isNoWarranty);
    return devices;
  }, [devices, deviceFilter]);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const variations = customerPhone.replace(/[^\d]/g, '');
        const { data } = await supabase
          .from('repair_tickets')
          .select('*')
          .ilike('customer_phone', `%${variations.slice(-9)}%`)
          .order('created_at', { ascending: false });
        if (data) {
          setRepairsList(data);
        }
      } catch (err) {
        console.warn('Could not load repairs:', err);
      }
    };
    fetchRepairs();
  }, [customerPhone]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleCreateRepairTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairIssueInput.trim()) return;
    setSubmittingRepair(true);
    const ticketId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedDevObj = devices.find(d => d.name === selectedDeviceForRepair);
    try {
      await supabase.from('repair_tickets').insert([
        {
          id: ticketId,
          store_id: storeProfile.id,
          customer_phone: customerPhone,
          customer_name: customerName,
          device_name: selectedDevObj?.cleanName || selectedDeviceForRepair || 'Hardware Device',
          imei_or_serial: selectedDevObj?.serialOrImei || 'N/A',
          issue_description: repairIssueInput.trim(),
          status: 'Submitted'
        }
      ]);
      const newTicket: RepairTicketRecord = {
        id: ticketId,
        store_id: storeProfile.id,
        customer_phone: customerPhone,
        customer_name: customerName,
        device_name: selectedDevObj?.cleanName || selectedDeviceForRepair || 'Hardware Device',
        imei_or_serial: selectedDevObj?.serialOrImei || 'N/A',
        issue_description: repairIssueInput.trim(),
        status: 'Submitted',
        created_at: new Date().toISOString()
      };
      setRepairsList(prev => [newTicket, ...prev]);
      alert(`Repair Ticket #${ticketId} submitted successfully! Our service team will triage it shortly.`);
      setRepairIssueInput('');
      setRepairModalOpen(false);
      setActiveTab('repairs');
    } catch (err) {
      console.warn('Could not save repair ticket:', err);
      alert('Could not submit repair ticket. Please try again.');
    } finally {
      setSubmittingRepair(false);
    }
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const aptId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApt: AppointmentRecord = {
      id: aptId,
      deviceName: apptDevice || devices[0]?.cleanName || devices[0]?.name || 'Device',
      serviceType: apptService,
      date: apptDate || 'Scheduled This Week',
      timeSlot: apptSlot,
      status: 'Confirmed'
    };
    setAppointmentsList(prev => [newApt, ...prev]);
    alert(`Appointment ${aptId} booked successfully! We look forward to seeing you at ${storeProfile.name}.`);
    setAppointmentModalOpen(false);
    setActiveTab('repairs');
  };

  const estimatedTradeValue = useMemo(() => {
    const base = tradeInModel.toLowerCase().includes('iphone 15') ? 220000 
      : tradeInModel.toLowerCase().includes('iphone 14') ? 180000
      : tradeInModel.toLowerCase().includes('iphone 13') ? 145000
      : tradeInModel.toLowerCase().includes('samsung') ? 95000
      : 60000;
    const factor = tradeInCondition === 'Flawless' ? 1 : tradeInCondition === 'Good' ? 0.85 : tradeInCondition === 'Minor Scratches' ? 0.7 : 0.45;
    return Math.round(base * factor);
  }, [tradeInModel, tradeInCondition]);

  const showRepairs = storeProfile.enable_repairs !== false && storeProfile.industry_type !== 'GROCERY' && storeProfile.industry_type !== 'FASHION';
  const showHardware = storeProfile.enable_warranty !== false && storeProfile.industry_type !== 'GROCERY';
  const showTradeIn = storeProfile.enable_trade_ins !== false && (storeProfile.industry_type === 'MOBILE_RETAIL' || storeProfile.industry_type === 'ELECTRONICS' || !storeProfile.industry_type);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    ...(showHardware ? [{ id: 'devices', label: 'Hardware & Warranties', icon: <Smartphone className="w-4 h-4" />, badge: devices.length }] : []),
    ...(showRepairs ? [{ id: 'repairs', label: 'Service Desk & Repairs', icon: <Wrench className="w-4 h-4" />, badge: (repairsList.length + claimsList.length) }] : []),
    { id: 'rewards', label: showTradeIn ? 'Rewards & Trade-In' : 'Rewards & Loyalty', icon: <Gift className="w-4 h-4" />, badgeText: totalPoints > 0 ? `${totalPoints} PTS` : undefined },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-300 bg-slate-50/70 dark:bg-slate-950">
      
      {/* Top Header & Customer Identity Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md shadow-cyan-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black text-slate-900 dark:text-white">{storeProfile.name}</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  Customer Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Hello, <span className="font-bold text-slate-800 dark:text-slate-200">{customerName}</span> ({customerPhone})</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              onClick={onSignOut}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabbed Platform Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 space-y-6">
        
        {/* Modern Segmented Navigation Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.badgeText && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {tab.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in pb-16 sm:pb-6">
            {/* Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveTab('devices')}
                className="portal-subcard bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 p-5 rounded-3xl space-y-1.5 shadow-sm hover:border-cyan-500 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Registered Assets</span>
                  <Smartphone className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{devices.length}</p>
                <p className="text-[10px] text-cyan-600 font-bold">Manage Hardware ➔</p>
              </div>

              <div 
                onClick={() => setActiveTab('devices')}
                className="portal-subcard bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 p-5 rounded-3xl space-y-1.5 shadow-sm hover:border-emerald-500 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Warranties</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                </div>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activeWarrantiesCount}</p>
                <p className="text-[10px] text-emerald-600 font-bold">View Certificates ➔</p>
              </div>

              <div 
                onClick={() => setActiveTab('repairs')}
                className="portal-subcard bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 p-5 rounded-3xl space-y-1.5 shadow-sm hover:border-amber-500 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Service Tickets</span>
                  <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
                </div>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{repairsList.length + claimsList.length}</p>
                <p className="text-[10px] text-amber-600 font-bold">Track Milestones ➔</p>
              </div>

              <div 
                onClick={() => setActiveTab('rewards')}
                className="portal-subcard bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 p-5 rounded-3xl space-y-1.5 shadow-sm hover:border-purple-500 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Loyalty Rewards</span>
                  <Gift className="w-4 h-4 text-purple-500 group-hover:scale-110 transition" />
                </div>
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{totalPoints} PTS</p>
                <p className="text-[10px] text-purple-600 font-bold">Claim Vouchers ➔</p>
              </div>
            </div>

            {/* Invoices & Support Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                      <Receipt className="w-5 h-5 text-cyan-600" />
                      <span>Verified Digital Receipts & Invoices</span>
                    </h3>
                    <p className="text-xs text-slate-500">Official POS purchases registered to your mobile number.</p>
                  </div>

                  <div className="w-full sm:w-56 flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={purchaseSearch}
                      onChange={e => setPurchaseSearch(e.target.value)}
                      placeholder="Search bill or item..."
                      className="w-full bg-transparent border-none text-slate-900 dark:text-white focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {invoices
                    .filter(inv => 
                      inv.id.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
                      (inv.invoice_items || []).some((i: any) => i.item_name?.toLowerCase().includes(purchaseSearch.toLowerCase()))
                    )
                    .map((inv, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 gap-3 hover:border-cyan-500/50 transition">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm">{inv.id}</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {inv.status || 'Paid'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {(inv.invoice_items || []).map((i: any) => i.item_name).join(', ') || 'Purchase Items'}
                          </p>
                          <p className="text-[11px] text-slate-500">{new Date(inv.created_at).toLocaleDateString()} · {inv.payment_method || 'Cash'}</p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            LKR {Number(inv.total || 0).toLocaleString()}
                          </span>
                          <Link
                            to={`/invoice/${inv.id}?token=${inv.token}${storeProfile.id !== 'default' ? `&store=${storeProfile.id}` : ''}`}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <span>Open Receipt</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                    <span>Quick Service Desk</span>
                  </h4>
                  
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        setSelectedDeviceForRepair(devices[0]?.name || '');
                        setRepairModalOpen(true);
                      }}
                      className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Wrench className="w-4 h-4 text-amber-500" />
                        <span>Request Repair / Diagnostics</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setClaimModalOpen(true)}
                      className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Submit Warranty Claim</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setApptDevice(devices[0]?.name || '');
                        setAppointmentModalOpen(true);
                      }}
                      className="w-full p-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <span>Book In-Store Service Slot</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <a
                      href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Store Helpdesk</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY HARDWARE & WARRANTIES */}
        {activeTab === 'devices' && (
          <div className="space-y-6 animate-fade-in pb-16 sm:pb-6">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-cyan-600" />
                    <span>My Hardware & Warranty Vault</span>
                  </h3>
                  <p className="text-xs text-slate-500">Live hardware warranty protection, authenticity certificates, and repair coverage.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setClaimModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Claim</span>
                  </button>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: `All Hardware (${devices.length})` },
                  { id: 'active', label: `Active Warranty (${activeWarrantiesCount})` },
                  { id: 'serviced', label: `Serviced / Non-Warranty (${devices.filter(d => d.isNoWarranty || d.category === 'repair_service').length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setDeviceFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      deviceFilter === f.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Device Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((dev, idx) => (
                  <div key={idx} className="portal-subcard bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 space-y-4 hover:border-cyan-500 transition shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            {dev.category === 'repair_service' ? (
                              <Wrench className="w-5 h-5 text-amber-500" />
                            ) : dev.category === 'accessory' ? (
                              <Package className="w-5 h-5 text-purple-500" />
                            ) : dev.category === 'laptop' ? (
                              <Laptop className="w-5 h-5 text-indigo-500" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{dev.cleanName || dev.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{dev.subTitle || 'Registered Hardware'}</p>
                            {dev.serialOrImei && (
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">{dev.serialOrImei.startsWith('#JOB-') ? dev.serialOrImei : `S/N: ${dev.serialOrImei}`}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(dev.serialOrImei)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  title="Copy Serial"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                                {copiedText === dev.serialOrImei && <span className="text-[9px] text-emerald-500 font-bold">Copied!</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                          dev.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : dev.status === 'expiring'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : dev.isNoWarranty
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25'
                        }`}>
                          {dev.status === 'active' ? `🟢 Active (${dev.daysRemaining}d)` : dev.status === 'expiring' ? `🟡 Expiring (${dev.daysRemaining}d)` : dev.isNoWarranty ? '⚪ Serviced' : '🔴 Expired'}
                        </span>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-center font-semibold">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Purchased</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{dev.purchaseDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice</span>
                          <span className="text-cyan-600 font-mono font-bold">{dev.invoiceId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Coverage</span>
                          <span className={`font-bold ${dev.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {dev.warrantyMonths ? `${dev.warrantyMonths} Months` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedDeviceForRepair(dev.name);
                          setRepairModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Repair</span>
                      </button>

                      {dev.status === 'active' || dev.status === 'expiring' ? (
                        <>
                          <a
                            href={createGoogleCalendarUrl(dev.name, dev.serialOrImei, dev.warrantyExpiryDate, storeProfile.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 rounded-xl transition cursor-pointer"
                            title="Add 14-day expiry reminder to Google Calendar"
                          >
                            <Calendar className="w-4 h-4" />
                          </a>
                          <Link
                            to={`/verify-warranty/${dev.serialOrImei}${storeProfile.id !== 'default' ? `?store=${storeProfile.id}` : ''}`}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setApptDevice(dev.name);
                            setAppointmentModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book Checkup</span>
                        </button>
                      )}

                      <button
                        onClick={() => setTimelineDevice(dev)}
                        className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="View Lifecycle Timeline"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPAIRS & SERVICE DESK */}
        {activeTab === 'repairs' && (
          <div className="space-y-6 animate-fade-in pb-16 sm:pb-6">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-amber-500" />
                    <span>Service Desk & Priority Appointments</span>
                  </h3>
                  <p className="text-xs text-slate-500">Live repair tracker milestones, claims, and in-store drop-off reservations.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDeviceForRepair(devices[0]?.name || '');
                      setRepairModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Request Repair</span>
                  </button>

                  <button
                    onClick={() => {
                      setApptDevice(devices[0]?.name || '');
                      setAppointmentModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-2xl flex items-center space-x-1.5 shadow-md shadow-cyan-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Slot</span>
                  </button>
                </div>
              </div>

              {/* Active Repair Tickets */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Active Repair Tickets ({repairsList.length})</span>
                </h4>

                {repairsList.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active repair tickets</p>
                    <p className="text-[11px] text-slate-500">All your devices are operating normally.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repairsList.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">#{t.id}</span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">· {t.device_name}</span>
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                {t.status || 'Submitted'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Fault: {t.issue_description}</p>
                          </div>

                          <Link
                            to={`/repair/${t.id}${storeProfile.id !== 'default' ? `?store=${storeProfile.id}` : ''}`}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          >
                            <span>Live Progress Tracker</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* 6-Stage Milestone */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                          {['Received', 'Diagnosing', 'Repairing', 'QA Check', 'Ready Pickup', 'Delivered'].map((step, sIdx) => {
                            const isCurrent = t.status?.toLowerCase().includes(step.toLowerCase());
                            return (
                              <div
                                key={sIdx}
                                className={`p-2 rounded-xl border ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white font-bold border-indigo-500'
                                    : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                }`}
                              >
                                <span className="text-[10px] block">{sIdx + 1}. {step}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled Priority Appointments */}
              <div className="space-y-4 pt-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  <span>Scheduled In-Store Appointments ({appointmentsList.length})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {appointmentsList.map((apt, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-cyan-600">{apt.id}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{apt.deviceName}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">{apt.serviceType}</p>
                        <p className="text-[11px] text-slate-500">{apt.date} ({apt.timeSlot})</p>
                      </div>

                      <a
                        href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi ${storeProfile.name}, confirming my service appointment #${apt.id} for ${apt.deviceName} on ${apt.date}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition inline-flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REWARDS & TRADE-IN */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-fade-in pb-16 sm:pb-6">
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-purple-600/25">
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-purple-200">VIP Rewards Club</span>
                <h3 className="text-3xl sm:text-4xl font-black">{totalPoints} Points Available</h3>
                <p className="text-xs text-purple-100">Rate: <strong className="text-white">1 Point per LKR 1,000 spent</strong> · {storeProfile.name}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                <span className="text-[11px] block text-purple-200 font-medium">Cash Reward Value</span>
                <span className="font-black text-xl">LKR {(totalPoints * 10).toLocaleString()}</span>
              </div>
            </div>

            {/* Redeemable Vouchers */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Redeemable In-Store Cash Vouchers</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { code: 'VOUCH-500', title: 'LKR 500 Off Accessories', points: 50, desc: 'Cost: 50 PTS (Earned on LKR 50,000 spend)' },
                  { code: 'VOUCH-SCREEN', title: 'Free Screen Protector + Cleaning', points: 100, desc: 'Cost: 100 PTS (Earned on LKR 100,000 spend)' },
                  { code: 'VOUCH-2500', title: 'LKR 2,500 Off Device Upgrade', points: 250, desc: 'Cost: 250 PTS (Earned on LKR 250,000 spend)' },
                ].map((vouch, vIdx) => {
                  const isClaimed = claimedVouchers.includes(vouch.code);
                  return (
                    <div key={vIdx} className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-xs text-purple-600">{vouch.points} PTS</span>
                          <span className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">Reward</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{vouch.title}</h5>
                        <p className="text-[11px] text-slate-500">{vouch.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (totalPoints < vouch.points) {
                            alert(`You need ${vouch.points} points for this voucher. You currently have ${totalPoints} points.`);
                            return;
                          }
                          if (!isClaimed) {
                            setClaimedVouchers(prev => [...prev, vouch.code]);
                            alert(`Voucher claimed! Present code "${vouch.code}" at ${storeProfile.name} cashier checkout.`);
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                          isClaimed
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : totalPoints >= vouch.points
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isClaimed ? `Claimed: ${vouch.code}` : totalPoints >= vouch.points ? 'Redeem Voucher' : `Needs ${vouch.points} PTS`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instant Trade-In Value Estimator */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">Instant Device Trade-In & Upgrade Estimator</h4>
                  <p className="text-xs text-slate-500">Calculate trade-in value for your existing device towards a brand new purchase.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <CustomSelect
                    label="Select Device"
                    value={tradeInModel}
                    onChange={(val) => setTradeInModel(val)}
                    placeholder="Choose Device to Trade-In"
                    options={[
                      ...devices.map((d) => {
                        let cleanName = d.name;
                        if (cleanName.toLowerCase().includes('repair settlement')) {
                          const match = cleanName.match(/\((.*?)\)/);
                          if (match && match[1]) cleanName = match[1];
                        }
                        return {
                          value: d.name,
                          label: cleanName,
                          sublabel: `Registered Customer Device`,
                        };
                      }),
                      { value: 'iPhone 15', label: 'Apple iPhone 15 (128GB)' },
                      { value: 'iPhone 14', label: 'Apple iPhone 14 (128GB)' },
                      { value: 'iPhone 13', label: 'Apple iPhone 13 (128GB)' },
                      { value: 'Samsung S23', label: 'Samsung Galaxy S23' },
                    ]}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Device Condition"
                    value={tradeInCondition}
                    onChange={(val) => setTradeInCondition(val)}
                    options={[
                      { value: 'Flawless', label: 'Flawless / Like New', sublabel: 'No scratches, battery health 85%+', badge: 'Grade A', badgeTone: 'emerald' },
                      { value: 'Good', label: 'Good Working Condition', sublabel: 'Minor hairline wear, full functionality', badge: 'Grade B', badgeTone: 'cyan' },
                      { value: 'Minor Scratches', label: 'Visible Scratches', sublabel: 'Normal scuffs on body/bezel', badge: 'Grade C', badgeTone: 'amber' },
                      { value: 'Faulty', label: 'Cracked Glass / Faulty Battery', sublabel: 'Hardware defect, needs repair', badge: 'Defective', badgeTone: 'purple' },
                    ]}
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Value</span>
                    <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                      LKR {estimatedTradeValue.toLocaleString()}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${(storeProfile.whatsapp_number || '94771234567').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi ${storeProfile.name}, I would like to trade in my ${tradeInModel || 'device'} (${tradeInCondition} condition) for an estimated value of LKR ${estimatedTradeValue.toLocaleString()}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition block shadow-sm"
                  >
                    Lock Trade-In via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <PortalFooter 
        storeProfile={storeProfile} 
        variant="compact"
        onScrollToAccess={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* MODAL 1: SERVICE TIMELINE */}
      {timelineDevice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span>Device Service Timeline</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{timelineDevice.name} · {timelineDevice.serialOrImei}</p>
              </div>
              <button
                onClick={() => setTimelineDevice(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 pl-2 text-xs">
              <div className="relative pl-6 pb-4 border-l-2 border-cyan-500">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] font-bold">1</div>
                <p className="font-bold text-slate-900 dark:text-white">Purchased & Invoiced</p>
                <p className="text-slate-500 text-[11px]">{timelineDevice.purchaseDate} via {timelineDevice.invoiceId}</p>
              </div>

              <div className="relative pl-6 pb-4 border-l-2 border-emerald-500">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">2</div>
                <p className="font-bold text-slate-900 dark:text-white">Warranty Vault Activated</p>
                <p className="text-slate-500 text-[11px]">{timelineDevice.warrantyMonths} Months coverage registered in cloud system</p>
              </div>

              <div className="relative pl-6 pb-4 border-l-2 border-slate-300 dark:border-slate-700">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[9px] font-bold">3</div>
                <p className="font-bold text-slate-900 dark:text-white">Diagnostic & Hardware QA</p>
                <p className="text-slate-500 text-[11px]">Authorized service checkup and inspection readiness</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTimelineDevice(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT REPAIR REQUEST */}
      {repairModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <span>Submit Repair Ticket</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Customer: {customerName} ({customerPhone})</p>
            </div>

            <form onSubmit={handleCreateRepairTicket} className="space-y-4 text-left">
              <div>
                <CustomSelect
                  label="Select Device for Service"
                  required
                  value={selectedDeviceForRepair}
                  onChange={(val) => setSelectedDeviceForRepair(val)}
                  options={[
                    ...devices.map((d) => {
                      let cleanName = d.name;
                      let sub = `Inv: ${d.invoiceId} · Purchased ${d.purchaseDate}`;
                      let badge = d.serialOrImei && !d.serialOrImei.includes('N/A') ? `S/N: ${d.serialOrImei}` : 'Accessory';
                      let badgeTone: 'cyan' | 'amber' | 'purple' | 'slate' = 'cyan';

                      if (cleanName.toLowerCase().includes('repair settlement')) {
                        const match = cleanName.match(/\((.*?)\)/);
                        if (match && match[1]) {
                          const jobMatch = cleanName.match(/(#JOB-[A-Za-z0-9-]+)/);
                          cleanName = match[1];
                          sub = `${jobMatch ? jobMatch[1] : 'Repair Job'} · Serviced Hardware`;
                          badge = 'Serviced Hardware';
                          badgeTone = 'amber';
                        }
                      }

                      return {
                        value: d.name,
                        label: cleanName,
                        sublabel: sub,
                        badge,
                        badgeTone,
                      };
                    }),
                    {
                      value: 'Other Device',
                      label: 'Other Device / Hardware',
                      sublabel: 'Hardware purchased elsewhere or unlisted',
                      badge: 'Unlisted',
                      badgeTone: 'slate'
                    }
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Describe Fault / Problem <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={repairIssueInput}
                  onChange={(e) => setRepairIssueInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs sm:text-sm focus:outline-hidden focus:border-cyan-500 text-slate-900 dark:text-white transition resize-none placeholder:text-slate-400 font-medium"
                  rows={3}
                  placeholder="e.g. Screen flickering, rapid battery drain, charging port loose..."
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepairModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRepair}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingRepair ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BOOK SERVICE APPOINTMENT */}
      {appointmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <span>Book In-Store Service Slot</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Reserved priority intake at {storeProfile.name}</p>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3.5 text-left">
              <div>
                <CustomSelect
                  label="Device"
                  required
                  value={apptDevice}
                  onChange={(val) => setApptDevice(val)}
                  options={[
                    ...devices.map((d) => {
                      let cleanName = d.name;
                      if (cleanName.toLowerCase().includes('repair settlement')) {
                        const match = cleanName.match(/\((.*?)\)/);
                        if (match && match[1]) cleanName = match[1];
                      }
                      return {
                        value: d.name,
                        label: cleanName,
                        sublabel: `Inv: ${d.invoiceId}`,
                      };
                    }),
                    { value: 'Other Device', label: 'Other Hardware / Device', sublabel: 'Unlisted hardware' }
                  ]}
                />
              </div>

              <div>
                <CustomSelect
                  label="Service Type"
                  required
                  value={apptService}
                  onChange={(val) => setApptService(val)}
                  options={[
                    { value: 'Diagnostic & Health Check', label: 'Hardware Diagnostics & Health Check', sublabel: 'Full 30-point inspection' },
                    { value: 'Express Screen Replacement', label: 'Express Screen Replacement', sublabel: 'OEM Display & digitizer' },
                    { value: 'Battery Health Service', label: 'Battery Health Replacement', sublabel: 'Certified cell replacement' },
                    { value: 'Speaker / Mic Cleaning & Fix', label: 'Speaker / Mic Audio Fix', sublabel: 'Acoustic cleaning & repair' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Preferred Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 transition"
                  required
                />
              </div>

              <div>
                <CustomSelect
                  label="Time Slot"
                  required
                  value={apptSlot}
                  onChange={(val) => setApptSlot(val)}
                  options={[
                    { value: 'Morning (10:00 AM - 1:00 PM)', label: 'Morning (10:00 AM - 1:00 PM)', badge: 'Morning', badgeTone: 'cyan' },
                    { value: 'Afternoon (2:00 PM - 5:00 PM)', label: 'Afternoon (2:00 PM - 5:00 PM)', badge: 'Afternoon', badgeTone: 'amber' },
                    { value: 'Evening (5:00 PM - 8:00 PM)', label: 'Evening (5:00 PM - 8:00 PM)', badge: 'Evening', badgeTone: 'purple' },
                  ]}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAppointmentModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WARRANTY CLAIM */}
      <WarrantyClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        devices={devices}
        customerPhone={customerPhone}
        onClaimSubmitted={(newClaim) => {
          setClaimsList(prev => [newClaim, ...prev]);
          setActiveTab('repairs');
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        devicesCount={devices.length}
        repairsCount={repairsList.length + claimsList.length}
        pointsCount={totalPoints}
      />
    </div>
  );
}
