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
}) => {
  const tabs = [
    {
      id: 'exam' as TabRoute,
      label: 'পরীক্ষা দিন',
      icon: FileCheck2,
    },
    {
      id: 'courses' as TabRoute,
      label: 'কোর্স',
      icon: BookOpen,
      badge: 'নতুন',
      badgeColor: 'bg-[#EF4444] text-white',
    },
    {
      id: 'ustad_ai' as TabRoute,
      label: 'তামরীন এআই',
      icon: Sparkles,
      badge: 'এআই',
      badgeColor: 'bg-[#F59E0B] text-slate-950 font-black',
    },
    {
      id: 'circulars' as TabRoute,
      label: 'সার্কুলার',
      icon: Briefcase,
      badge: 'ভর্তি',
      badgeColor: 'bg-[#EF4444] text-white',
    },
    {
      id: 'subjects' as TabRoute,
      label: 'বিষয়ভিত্তিক প্রস্তুতি',
      icon: Layers,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#EEF2F6]/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-t border-white/60 dark:border-slate-800/90 shadow-[0_-4px_20px_rgba(166,180,200,0.25)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] px-1.5 sm:px-3 py-2 transition-colors duration-300">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 sm:px-2 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-[#046A38] text-white shadow-[0_4px_14px_rgba(4,106,56,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-emerald-600/40'
                  : 'neu-pill !rounded-2xl dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#EAB308] stroke-[2.4px]'
                      : 'text-slate-600 dark:text-slate-300 stroke-[2px]'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-2.5 -right-3 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] leading-tight mt-1 text-center truncate max-w-full tracking-tight ${
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

