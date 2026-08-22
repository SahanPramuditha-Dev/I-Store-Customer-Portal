import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Smartphone, Wrench, Package } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeTone?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'slate';
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || (options.length > 0 ? options[0] : null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (opt: CustomSelectOption | null) => {
    if (opt?.icon) return opt.icon;
    const l = (opt?.label || '').toLowerCase();
    if (l.includes('iphone') || l.includes('samsung') || l.includes('phone') || l.includes('pixel') || l.includes('redmi') || l.includes('xiaomi')) {
      return <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
    if (l.includes('repair') || l.includes('service') || l.includes('inspection') || l.includes('battery') || l.includes('screen')) {
      return <Wrench className="w-4 h-4 text-amber-500" />;
    }
    if (l.includes('cable') || l.includes('charger') || l.includes('case') || l.includes('accessory')) {
      return <Package className="w-4 h-4 text-purple-500" />;
    }
    return <Package className="w-4 h-4 text-slate-400" />;
  };

  const getBadgeClass = (tone?: string) => {
    switch (tone) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
      case 'amber':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25';
      case 'purple':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className={`space-y-1.5 text-left relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 dark:bg-slate-950 border-2 rounded-2xl p-3 text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
            {getIcon(selectedOption)}
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.badge && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${getBadgeClass(selectedOption.badgeTone)}`}>
                  {selectedOption.badge}
                </span>
              )}
            </div>
            {selectedOption?.sublabel && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {selectedOption.sublabel}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-cyan-500' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {options.map((option) => {
            const isSelected = option.value === value || (!value && option.value === selectedOption?.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border border-cyan-500/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getIcon(option)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {option.label}
                      </span>
                      {option.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md border font-semibold ${getBadgeClass(option.badgeTone)}`}>
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.sublabel && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {option.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
