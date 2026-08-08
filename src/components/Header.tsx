import React from 'react';
import { BookOpenCheck, Database, Home } from 'lucide-react';
import { PageRoute } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigateHome: () => void;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigateHome,
  onOpenSupabaseModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E2D3] shadow-xs transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
          title="হোম পেজে যান"
        >
          <div className="w-10 h-10 rounded-xl bg-[#8AA682] text-white font-bold text-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-[#2D4B3E]">
                MiniQuiz <span className="text-[#8AA682] text-lg font-medium hidden xs:inline">| মিনি কুইজ</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-[#F5F2EA] text-[#2D4B3E] border border-[#E6E2D3] rounded-full">
                স্টুডেন্ট
              </span>
            </div>
            <p className="text-xs text-[#8AA682] font-semibold uppercase tracking-wider hidden sm:block">
              প্রতিদিন অনুশীলন ও প্রস্তুতি
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Supabase Status Button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
              isSupabaseConfigured
                ? 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3] hover:bg-[#E6E2D3]/60'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
            title="Supabase স্ট্যাটাস ও গাইড"
          >
            <Database className="w-3.5 h-3.5 text-[#8AA682]" />
            <span className="hidden xs:inline">
              {isSupabaseConfigured ? 'Supabase Read-Only' : 'ডেমো মোড'}
            </span>
          </button>

          {/* Home Link if not on Home Page */}
          {currentPage !== 'home' && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2D4B3E] text-white hover:opacity-90 rounded-full text-xs font-semibold transition-all shadow-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>হোমে যান</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
