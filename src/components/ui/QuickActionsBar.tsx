import React from 'react';
import { 
  Receipt, 
  ShieldCheck, 
  Wrench, 
  PlusCircle, 
  Smartphone, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface QuickActionsBarProps {
  onNavigate: (tab: 'overview' | 'purchases' | 'devices' | 'warranties' | 'repairs' | 'claims') => void;
  onOpenClaim: () => void;
  onOpenRepair: () => void;
  whatsappNumber?: string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onNavigate,
  onOpenClaim,
  onOpenRepair,
  whatsappNumber = '94771234567'
}) => {
  const actions = [
    {
      label: 'Find Receipt',
      icon: Receipt,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/25',
      onClick: () => onNavigate('purchases')
    },
    {
      label: 'Check Warranty',
      icon: ShieldCheck,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/25',
      onClick: () => onNavigate('warranties')
    },
    {
      label: 'Track Repair',
      icon: Wrench,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25',
      onClick: () => {
        onNavigate('repairs');
        onOpenRepair();
      }
    },
    {
      label: 'Submit Claim',
      icon: PlusCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25',
      highlight: true,
      onClick: onOpenClaim
    },
    {
      label: 'My Devices',
      icon: Smartphone,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/25',
      onClick: () => onNavigate('devices')
    },
    {
      label: 'WhatsApp Care',
      icon: MessageSquare,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25',
      onClick: () => window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')
    }
  ];

  return (
    <div className="portal-card-container bg-white/95 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Quick Command Hub</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
          1-Click Customer Shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {actions.map((act, i) => {
          const IconComp = act.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={act.onClick}
              className={`portal-subcard flex items-center space-x-2 px-3 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer ${
                act.highlight ? 'ring-2 ring-emerald-500/30' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${act.bg} border flex items-center justify-center ${act.color} shrink-0 group-hover:scale-110 transition-transform`}>
                <IconComp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
