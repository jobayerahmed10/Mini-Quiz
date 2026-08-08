import React from 'react';
import { BookOpenCheck, Home, Sparkles } from 'lucide-react';
import { PageRoute } from '../types';

interface HeaderProps {
  currentPage: PageRoute;
  selectedSubject?: string;
  onNavigateHome: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  selectedSubject,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B132B]/90 backdrop-blur-xl border-b border-[#1E2E4F] shadow-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-hidden cursor-pointer"
          title="হোম পেজে যান"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#14223E] border border-amber-400/40 text-amber-400 font-bold text-xl flex items-center justify-center shadow-[4px_4px_10px_#060a17,-4px_-4px_10px_#1e3056] group-hover:scale-105 transition-all">
            <BookOpenCheck className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-white drop-shadow-xs">
                শিক্ষক নিবন্ধন <span className="text-amber-400 font-extrabold text-sm sm:text-base hidden sm:inline">& প্রস্তুতি</span>
              </span>
              <span className="text-[10px] font-black tracking-wider px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full shadow-inner flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                ১৯তম NTRCA
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium tracking-wide hidden sm:block">
              মাদ্রাসা, স্কুল, কলেজ নিবন্ধন, বিষয়ভিত্তিক প্রস্তুতি ও মডেল টেস্ট
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Subject Indicator Pill */}
          {selectedSubject && selectedSubject !== 'all' && (
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-[#14223E] border border-sky-500/40 text-sky-300 rounded-full text-xs font-bold shadow-[inset_2px_2px_4px_#060a17]">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span className="truncate max-w-[150px]">{selectedSubject}</span>
            </div>
          )}

          {/* Home Link if not on Home Page */}
          {currentPage !== 'home' && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-[#14223E] hover:bg-[#1A2C4E] text-amber-300 border border-amber-400/50 rounded-full text-xs font-bold transition-all shadow-[3px_3px_8px_#060a17,-3px_-3px_8px_#1e3056] cursor-pointer active:scale-95"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>হোম</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


