import React from 'react';
import { 
  FileCheck2, 
  BookOpen, 
  Sparkles, 
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
  unreadCircularsCount = 5,
}) => {
  const tabs = [
    {
      id: 'exam' as TabRoute,
      label: 'পরিক্ষা দিন',
      icon: FileCheck2,
    },
    {
      id: 'courses' as TabRoute,
      label: 'কোর্স',
      icon: BookOpen,
      badge: 'নতুন',
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'ustad_ai' as TabRoute,
      label: 'তামরীন এআই',
      icon: Sparkles,
      badge: 'এআই',
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      id: 'circulars' as TabRoute,
      label: 'সার্কুলার',
      icon: Briefcase,
      badge: 'ভর্তি',
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'subjects' as TabRoute,
      label: 'বিষয়ভিত্তিক প্রস্তুতি',
      icon: Layers,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F0F4F8]/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-1.5 sm:px-3 py-2 transition-colors duration-300">
      <div className="max-w-xl mx-auto flex items-center justify-around gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1.5 sm:px-2.5 rounded-2xl transition-all duration-200 cursor-pointer select-none min-w-[62px] sm:min-w-[76px] ${
                isActive
                  ? 'bg-[#046A38] dark:bg-[#064E3B] text-white border border-emerald-500/60 shadow-[0_4px_14px_rgba(4,106,56,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] scale-[1.02]'
                  : 'bg-[#F8FAFC] dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.04)] hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#EAB308] dark:text-amber-300 stroke-[2.4px] scale-110'
                      : 'text-slate-600 dark:text-slate-300 stroke-[1.8px]'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-2 -right-3.5 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9.5px] sm:text-[11px] leading-tight mt-1 text-center transition-colors truncate max-w-full ${
                  isActive ? 'font-black text-white' : 'font-bold text-slate-700 dark:text-slate-300'
                }`}
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

