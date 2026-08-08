import React from 'react';
import { BookOpenCheck, Database, Home } from 'lucide-react';
import { PageRoute } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  currentPage: PageRoute;
  selectedSubject?: string;
  onNavigateHome: () => void;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  selectedSubject,
  onNavigateHome,
  onOpenSupabaseModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E2D3] shadow-xs transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-hidden cursor-pointer"
          title="হোম পেজে যান"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2D4B3E] to-[#1E332A] text-white font-bold text-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <BookOpenCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-[#2D4B3E]">
                MiniQuiz <span className="text-[#8AA682] text-sm font-semibold hidden md:inline">| বিষয় ভিত্তিক এমসিকিউ</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 bg-emerald-100/70 text-[#2D4B3E] border border-emerald-200 rounded-full">
                স্টুডেন্ট
              </span>
            </div>
            <p className="text-xs text-[#8AA682] font-semibold tracking-wider hidden sm:block">
              বিষয় ভিত্তিক প্রস্তুতি ও মডেল টেস্ট
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Subject Indicator Pill */}
          {selectedSubject && selectedSubject !== 'all' && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{selectedSubject}</span>
            </div>
          )}

          {/* Home Link if not on Home Page */}
          {currentPage !== 'home' && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-[#2D4B3E] hover:bg-[#233B31] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>হোম</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
