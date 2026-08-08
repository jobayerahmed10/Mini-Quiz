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
    },
    {
      id: 'ustad_ai' as TabRoute,
      label: 'উস্তাদ এআই',
      icon: Sparkles,
      badge: 'এআই',
    },
    {
      id: 'circulars' as TabRoute,
      label: 'সার্কুলার',
      icon: Briefcase,
      badge: unreadCircularsCount > 0 ? `${unreadCircularsCount}টি` : undefined,
    },
    {
      id: 'subjects' as TabRoute,
      label: 'বিষয়ভিত্তিক প্রস্তুতি',
      icon: Layers,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0B132B]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl px-1.5 py-2 transition-colors duration-300">
      <div className="max-w-xl mx-auto flex items-center justify-around gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer select-none min-w-[62px] sm:min-w-[76px] ${
                isActive
                  ? 'neu-active bg-[#0B132B] border-amber-400/60 text-white shadow-md scale-102'
                  : 'neu-btn text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                  isActive ? 'text-amber-400 stroke-[2.5px] scale-110' : 'text-slate-600 dark:text-slate-300 stroke-[1.8px]'
                }`} />
                {tab.badge && (
                  <span className={`absolute -top-2 -right-3.5 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs ${
                    tab.id === 'ustad_ai' 
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] sm:text-[10.5px] leading-tight mt-1 text-center transition-colors ${
                isActive ? 'font-black text-amber-400' : 'font-semibold text-slate-600 dark:text-slate-300'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

