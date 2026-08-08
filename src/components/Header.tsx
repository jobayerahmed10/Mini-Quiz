import React, { useState } from 'react';
import { BookOpenCheck, Home, Sparkles, Sun, Moon, Type, Check, X } from 'lucide-react';
import { PageRoute } from '../types';

interface HeaderProps {
  currentPage: PageRoute;
  selectedSubject?: string;
  onNavigateHome: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: 'normal' | 'medium' | 'large';
  onChangeFontSize: (size: 'normal' | 'medium' | 'large') => void;
  fontFamily: 'hind' | 'noto' | 'tiro' | 'anek';
  onChangeFontFamily: (font: 'hind' | 'noto' | 'tiro' | 'anek') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  selectedSubject,
  onNavigateHome,
  isDarkMode,
  onToggleDarkMode,
  fontSize,
  onChangeFontSize,
  fontFamily,
  onChangeFontFamily,
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);

  const fontOptions: { id: 'hind' | 'noto' | 'tiro' | 'anek'; name: string; sample: string }[] = [
    { id: 'hind', name: 'হিন্দ শিলিগুড়ি', sample: 'Hind Siliguri' },
    { id: 'noto', name: 'নোটো সান্স', sample: 'Noto Sans' },
    { id: 'tiro', name: 'তিরো বাংলা', sample: 'Tiro Bangla' },
    { id: 'anek', name: 'অনেক বাংলা', sample: 'Anek Bangla' },
  ];

  const fontSizeOptions: { id: 'normal' | 'medium' | 'large'; label: string; desc: string }[] = [
    { id: 'normal', label: 'স্বাভাবিক', desc: '১০০%' },
    { id: 'medium', label: 'মাঝারি', desc: '১০৮%' },
    { id: 'large', label: 'বড়', desc: '১১৬%' },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300 border-b ${
      isDarkMode ? 'bg-[#0B132B]/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-hidden cursor-pointer"
          title="হোম পেজে যান"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0B132B] text-amber-400 font-bold text-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-all shrink-0 border border-amber-500/30">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`font-black text-lg sm:text-2xl tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0B132B]'}`}>
                শিক্ষক নিবন্ধন <span className="text-amber-500 font-extrabold text-xs sm:text-base hidden sm:inline">& প্রস্তুতি</span>
              </span>
              <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                ১৯তম NTRCA
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs font-medium tracking-wide hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              মাদ্রাসা, স্কুল, কলেজ নিবন্ধন, বিষয়ভিত্তিক প্রস্তুতি ও মডেল টেস্ট
            </p>
          </div>
        </button>

        {/* Action Controls Header Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Subject Indicator Pill */}
          {selectedSubject && selectedSubject !== 'all' && (
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-300 text-[#0B132B]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="truncate max-w-[130px]">{selectedSubject}</span>
            </div>
          )}

          {/* Font Settings Neumorphic Button */}
          <div className="relative">
            <button
              onClick={() => setShowFontMenu(!showFontMenu)}
              className={`neu-btn p-2.5 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                showFontMenu ? 'neu-btn-active' : ''
              }`}
              title="ফন্ট স্টাইল ও সাইজ পরিবর্তন করুন"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Font Options Popover Dropdown */}
            {showFontMenu && (
              <div className={`absolute right-0 mt-3 w-72 rounded-3xl p-4 shadow-2xl z-50 border transition-all ${
                isDarkMode ? 'bg-[#121E36] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Type className="w-4 h-4 text-amber-500" />
                    <span>ফন্ট সাইজ ও স্টাইল</span>
                  </div>
                  <button
                    onClick={() => setShowFontMenu(false)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Font Size Chooser */}
                <div className="mb-4 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    ফন্ট সাইজ (Font Size):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {fontSizeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => onChangeFontSize(opt.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                          fontSize === opt.id
                            ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                            : 'neu-btn text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-[9px] font-normal opacity-70">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family Chooser */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    ফন্ট স্টাইল (Font Family):
                  </label>
                  <div className="space-y-1">
                    {fontOptions.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onChangeFontFamily(f.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          fontFamily === f.id
                            ? 'bg-[#0B132B] text-white font-bold shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="block font-bold">{f.name}</span>
                          <span className="text-[10px] opacity-60">{f.sample}</span>
                        </div>
                        {fontFamily === f.id && (
                          <Check className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Neumorphic Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="neu-btn p-2.5 rounded-2xl flex items-center justify-center cursor-pointer transition-all"
            title={isDarkMode ? "লাইটে মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-[#0B132B]" />
            )}
          </button>

          {/* Home Link if not on Home Page */}
          {currentPage !== 'home' && (
            <button
              onClick={onNavigateHome}
              className="neu-btn px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Home className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">হোম</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


