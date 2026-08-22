import React from 'react';
import { 
  Home, 
  Smartphone, 
  Wrench, 
  Gift
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  devicesCount: number;
  repairsCount: number;
  pointsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  devicesCount,
  repairsCount,
  pointsCount,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'devices', label: 'Hardware', icon: Smartphone, badge: devicesCount },
    { id: 'repairs', label: 'Services', icon: Wrench, badge: repairsCount },
    { id: 'rewards', label: 'Rewards', icon: Gift, badgeText: pointsCount > 0 ? `${pointsCount}p` : undefined },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t-2 border-slate-300 dark:border-slate-800 px-3 py-2 flex justify-around items-center shadow-2xl safe-area-pb">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
              isActive 
                ? 'text-cyan-600 dark:text-cyan-400 font-black scale-105' 
                : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-cyan-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
              {tab.badgeText && (
                <span className="absolute -top-1.5 -right-3.5 bg-purple-600 text-white text-[8px] font-black px-1 py-0.2 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badgeText}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 mt-0.5 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
