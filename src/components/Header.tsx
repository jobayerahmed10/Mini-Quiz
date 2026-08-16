import React, { useState } from 'react';
import { BookOpenCheck, Sun, Moon, Type, Check, X, Sparkles, Languages, ArrowLeft, User, Trophy, Settings, ChevronDown, BarChart3, GraduationCap } from 'lucide-react';
import { PageRoute } from '../types';
import { getUserProfile } from '../lib/utils';
import { AtTamreenLogo } from './AtTamreenLogo';

export type FontFamilyType = 'hind' | 'noto' | 'tiro' | 'anek' | 'amiri' | 'scheherazade' | 'cairo';

interface HeaderProps {
  currentPage: PageRoute;
  activeTab?: string;
  selectedSubject?: string;
  onNavigateHome: () => void;
  onGoBack?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: 'normal' | 'medium' | 'large';
  onChangeFontSize: (size: 'normal' | 'medium' | 'large') => void;
  fontFamily: FontFamilyType;
  onChangeFontFamily: (font: FontFamilyType) => void;
  showHarakat: boolean;
  onChangeShowHarakat: (show: boolean) => void;
  onOpenProfile?: () => void;
  onOpenLeaderboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  activeTab,
  selectedSubject,
  onNavigateHome,
  onGoBack,
  isDarkMode,
  onToggleDarkMode,
  fontSize,
  onChangeFontSize,
  fontFamily,
  onChangeFontFamily,
  showHarakat,
  onChangeShowHarakat,
  onOpenProfile,
  onOpenLeaderboard,
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userProfile = getUserProfile();

  const bengaliFonts: { id: FontFamilyType; name: string; sample: string }[] = [
    { id: 'hind', name: 'হিন্দ শিলিগুড়ি', sample: 'Bengali Standard' },
    { id: 'noto', name: 'নোটো সেরিফ', sample: 'Noto Serif Bengali' },
    { id: 'tiro', name: 'তিরো বাংলা', sample: 'Tiro Serif Bangla' },
    { id: 'anek', name: 'অনেক বাংলা', sample: 'Anek Modern' },
  ];

  const arabicFonts: { id: FontFamilyType; name: string; sample: string; arName: string }[] = [
    { id: 'amiri', name: 'আমিরি ফন্ট (Amiri)', arName: 'خط أميري', sample: '﴿ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ﴾' },
    { id: 'scheherazade', name: 'শাহরাজাদ (Scheherazade)', arName: 'خط شهرزاد', sample: '﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾' },
    { id: 'cairo', name: 'কায়রো (Cairo Arabic)', arName: 'خط القاهرة', sample: 'القرآن والسنة والحديث' },
  ];

  const fontSizeOptions: { id: 'normal' | 'medium' | 'large'; label: string; desc: string }[] = [
    { id: 'normal', label: 'স্বাভাবিক', desc: '১০০%' },
    { id: 'medium', label: 'মাঝারি', desc: '১০৮%' },
    { id: 'large', label: 'বড়', desc: '১১৬%' },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300 border-b ${
      isDarkMode ? 'bg-[#0B132B]/90 border-slate-800 text-white' : 'bg-[#F0F4F8]/95 border-slate-200/80 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Top Left Area (Back Button + Brand Logo) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Top-Left Back Button when inside sub-page or non-home tab */}
          {(currentPage !== 'home' || (activeTab && activeTab !== 'exam')) && (
            <button
              onClick={onGoBack || onNavigateHome}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all border shrink-0 active:scale-95 shadow-xs ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-[#0B132B] border-slate-300 hover:bg-slate-100'
              }`}
              title="পিছনে ফিরে যান"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-extrabold hidden xs:inline">পিছনে</span>
            </button>
          )}

          {/* Exact Brand Logo + Title + Subtitle */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-hidden cursor-pointer min-w-0"
            title="হোম পেজে যান"
          >
            {/* Green Squircle Logo Box with Golden Graduation Cap */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] bg-[#046A38] dark:bg-[#064E3B] flex items-center justify-center shrink-0 shadow-sm border border-emerald-600/30">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" strokeWidth={2.3} />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-tiro font-black text-xl sm:text-2xl md:text-[26px] tracking-tight truncate leading-none ${isDarkMode ? 'text-white' : 'text-[#064E3B]'}`}>
                  আত-তামরীন
                </span>
                <span className="bg-[#046A38] dark:bg-[#064E3B] text-[#EAB308] font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 rounded-full inline-flex items-center justify-center leading-normal shrink-0">
                  একাডেমি
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-tight tracking-normal truncate">
                প্রস্তুতি হোক আরও স্মার্ট
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls Header Right */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Active Subject Indicator Pill */}
          {selectedSubject && selectedSubject !== 'all' && (
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-300 text-[#0B132B]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="truncate max-w-[130px]">{selectedSubject}</span>
            </div>
          )}

          {/* Font Settings Button with Orange T */}
          <div className="relative">
            <button
              onClick={() => setShowFontMenu(!showFontMenu)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] sm:rounded-2xl flex items-center justify-center cursor-pointer transition-all border shadow-xs active:scale-95 ${
                showFontMenu
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30'
                  : isDarkMode
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90'
              }`}
              title="ফন্ট স্টাইল, আরবি ফন্ট ও হরকত সেটিং"
            >
              <span className="text-[#E65100] dark:text-[#FB923C] font-black text-lg sm:text-xl leading-none font-sans">
                T
              </span>
            </button>

            {/* Font Options Popover Dropdown */}
            {showFontMenu && (
              <>
                {/* Backdrop for mobile to tap outside */}
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
                  onClick={() => setShowFontMenu(false)}
                />

                <div
                  className={`fixed sm:absolute top-16 right-3 left-3 sm:left-auto sm:right-0 sm:top-full mt-0 sm:mt-2.5 w-auto sm:w-80 max-w-[340px] mx-auto sm:mx-0 max-h-[78vh] sm:max-h-[82vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl z-50 border transition-all ${
                    isDarkMode ? 'bg-[#121E36] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <Type className="w-4 h-4 text-amber-500" />
                      <span>ফন্ট ও আরবি সেটিং</span>
                    </div>
                    <button
                      onClick={() => setShowFontMenu(false)}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Font Size Chooser */}
                  <div className="mb-3 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      ফন্ট সাইজ (Font Size):
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {fontSizeOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => onChangeFontSize(opt.id)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-black cursor-pointer transition-all border ${
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

                  {/* 2. Arabic Harakat Option (হরকত সহ / ছাড়া) */}
                  <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>আরবি হরকত (Tashkeel) সেটিং:</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => onChangeShowHarakat(true)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          showHarakat
                            ? 'bg-[#0B132B] text-amber-400 border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span>হরকত সহ</span>
                        <span className="text-[10px] font-amiri opacity-90">﴿قُلْ هُوَ اللَّهُ﴾</span>
                      </button>

                      <button
                        onClick={() => onChangeShowHarakat(false)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          !showHarakat
                            ? 'bg-[#0B132B] text-amber-400 border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span>হরকত ছাড়া</span>
                        <span className="text-[10px] font-amiri opacity-90">﴿قل هو الله﴾</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Bengali Fonts */}
                  <div className="mb-3 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>বাংলা ফন্ট (Bangla Fonts):</span>
                    </label>
                    <div className="space-y-1">
                      {bengaliFonts.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onChangeFontFamily(f.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                            fontFamily === f.id
                              ? 'bg-[#0B132B] text-white font-bold shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-[11px]">{f.name}</span>
                            <span className="text-[9px] opacity-60">{f.sample}</span>
                          </div>
                          {fontFamily === f.id && (
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Arabic Fonts */}
                  <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" />
                      <span>আরবি ফন্ট (Arabic Fonts):</span>
                    </label>
                    <div className="space-y-1">
                      {arabicFonts.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onChangeFontFamily(f.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                            fontFamily === f.id
                              ? 'bg-[#0B132B] text-white font-bold shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-[11px] flex items-center gap-1">
                              {f.name}
                              <span className="text-[9px] text-amber-400 font-normal">({f.arName})</span>
                            </span>
                            <span className="text-[10px] text-amber-500/90 font-amiri block mt-0.5" dir="rtl">{f.sample}</span>
                          </div>
                          {fontFamily === f.id && (
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Dark Mode Toggle Button (Moon / Sun) */}
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] sm:rounded-2xl flex items-center justify-center cursor-pointer transition-all border shadow-xs active:scale-95 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200/90 dark:border-slate-700"
            title={isDarkMode ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E293B] dark:text-slate-200" strokeWidth={2.2} />
            )}
          </button>

          {/* User Profile / Circular Avatar Button */}
          <div className="relative">
            <button
              onClick={() => {
                if (onOpenProfile) {
                  onOpenProfile();
                } else {
                  setShowUserMenu(!showUserMenu);
                }
                setShowFontMenu(false);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-[#EAB308] p-[1.5px] bg-amber-100 dark:bg-slate-800 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all active:scale-95 shadow-xs"
              title="ব্যবহারকারীর প্রোফাইল ও মেনু"
            >
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#046A38] text-amber-300 flex items-center justify-center font-black text-xs">
                  <User className="w-4 h-4 text-amber-300" />
                </div>
              )}
            </button>

            {/* Top Right User Menu Dropdown Popover */}
            {showUserMenu && (
              <div className={`absolute right-0 mt-3 w-72 sm:w-80 rounded-3xl p-4 shadow-2xl z-50 border transition-all animate-fade-in ${
                isDarkMode ? 'bg-[#121E36] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {/* User Header Profile Card */}
                <div className="p-3.5 bg-gradient-to-r from-[#0b705c] via-[#085a4a] to-[#0B132B] text-white rounded-2xl mb-3 flex items-center gap-3 relative overflow-hidden shadow-xs border border-amber-400/30">
                  {userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile?.name || 'User'}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400 border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg border border-white/20 text-amber-300 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-black truncate text-amber-300 font-tiro tracking-wide drop-shadow-xs">
                      {userProfile?.name || 'ব্যবহারকারীর নাম নেই'}
                    </h4>
                    <p className="text-[11px] font-bold text-amber-200 truncate">
                      {userProfile?.phone || 'ফোন নম্বর যুক্ত করুন'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black px-2 py-0.5 bg-amber-400 text-[#0B132B] rounded-full">
                      শিক্ষক নিবন্ধন পরীক্ষার্থী
                    </span>
                  </div>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="p-1 text-white/70 hover:text-white cursor-pointer absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Menu Items List */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-[#0b705c] dark:text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">👤 প্রোফাইল ও এডিট</span>
                      <span className="block text-[10px] font-medium opacity-60">ছবি, নাম ও নম্বর পরিবর্তন</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">📊 ড্যাশবোর্ড ও পরিসংখ্যান</span>
                      <span className="block text-[10px] font-medium opacity-60">মোট পরীক্ষা, পয়েন্ট ও নির্ভুলতা</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenLeaderboard) onOpenLeaderboard();
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">🏆 লিডারবোর্ড</span>
                      <span className="block text-[10px] font-medium opacity-60">মেধা অবস্থান ও সেরা পারফরমার</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowFontMenu(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/80 pt-2.5"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">⚙️ ফন্ট সাইজ ও আরবি সেটিং</span>
                      <span className="block text-[10px] font-medium opacity-60">ফন্ট, হরকত ও ডিসপ্লে পরিবর্তন</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


