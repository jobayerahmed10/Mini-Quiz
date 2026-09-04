import React from 'react';
import { 
  Home,
  FileCheck2, 
  BookOpen, 
  Newspaper, 
  Briefcase, 
  Layers 
} from 'lucide-react';
import { TabRoute } from '../types';

interface BottomNavProps {
  activeTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
  unreadCircularsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: Array<{
    id: TabRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'home' as TabRoute,
      label: 'হোম',
      icon: Home,
    },
    {
      id: 'exam' as TabRoute,
      label: 'পরীক্ষা',
      icon: FileCheck2,
    },
    {
      id: 'blogs' as TabRoute,
      label: 'ব্লগ',
      icon: Newspaper,
    },
    {
      id: 'circulars' as TabRoute,
      label: 'আর্কাইভ',
      icon: Briefcase,
    },
    {
      id: 'subjects' as TabRoute,
      label: 'প্র্যাকটিস',
      icon: Layers,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#EEF2F6]/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-t border-white/60 dark:border-slate-800/90 shadow-[0_-4px_20px_rgba(166,180,200,0.25)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] px-1 sm:px-3 py-1 transition-colors duration-300">
      <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-between gap-0.5 sm:gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-0.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer select-none min-w-0 ${
                isActive
                  ? 'bg-[#046A38] text-white shadow-[0_4px_14px_rgba(4,106,56,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-emerald-600/40'
                  : 'neu-pill !rounded-xl sm:!rounded-2xl dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#EAB308] stroke-[2.4px]'
                      : 'text-slate-600 dark:text-slate-300 stroke-[2px]'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-2 -right-2 text-[7px] sm:text-[8px] font-bold px-1 py-0.1 rounded-full shadow-xs whitespace-nowrap ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`font-hind text-[10px] sm:text-xs leading-normal pt-0.5 text-center whitespace-nowrap tracking-tighter sm:tracking-normal antialiased ${
                  isActive ? 'font-bold text-white' : 'font-semibold text-slate-700 dark:text-slate-200'
                }`}
                style={{ fontFeatureSettings: '"kern" 1, "liga" 1' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

