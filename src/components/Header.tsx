import React, { useState } from 'react';
import { BookOpenCheck, Home, Sun, Moon, Type, Check, X, Sparkles, Languages, ArrowLeft, User, Trophy, Settings, ChevronDown, BarChart3 } from 'lucide-react';
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
    { id: 'noto', name: 'নোটো সান্স', sample: 'Noto Sans Bengali' },
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
      isDarkMode ? 'bg-[#0B132B]/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2">
        {/* Top Left Area (Back Button + Brand Logo) */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Top-Left Back Button when inside sub-page or non-home tab */}
          {(currentPage !== 'home' || (activeTab && activeTab !== 'exam')) && (
            <button
              onClick={onGoBack || onNavigateHome}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all border shrink-0 active:scale-95 shadow-xs ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-[#0B132B] border-slate-300 hover:bg-slate-200'
              }`}
              title="পিছনে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-extrabold hidden xs:inline">পিছনে</span>
            </button>
          )}

          {/* Brand Logo & Name */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-hidden cursor-pointer min-w-0"
            title="হোম পেজে যান"
          >
            <div className="p-1.5 sm:p-2 rounded-2xl bg-gradient-to-br from-[#0b705c]/15 to-amber-500/15 dark:from-[#0b705c]/35 dark:to-amber-500/25 border border-emerald-600/40 dark:border-amber-400/40 shadow-md group-hover:scale-105 transition-all shrink-0">
              <AtTamreenLogo size={48} className="w-10 h-10 sm:w-13 sm:h-13" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-tiro font-black text-lg sm:text-2xl lg:text-3xl tracking-wide truncate leading-snug drop-shadow-xs ${isDarkMode ? 'text-white' : 'text-[#0B132B]'}`}>
                  <span className="typo-gradient-brand">আত-তামরীন</span>{' '}
                  <span className="typo-gradient-gold font-anek font-bold text-sm sm:text-xl px-2 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-400/20 border border-amber-500/30 inline-block align-middle ml-1">
                    একাডেমি
                  </span>
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-semibold tracking-wide hidden sm:block truncate mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                শিক্ষক নিবন্ধন ও বিষয়ভিত্তিক জব প্রস্তুতি প্ল্যাটফর্ম
              </p>
            </div>
          </button>
        </div>

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
              title="ফন্ট স্টাইল, আরবি ফন্ট ও হরকত সেটিং"
            >
              <Type className="w-4 h-4 text-amber-500" />
            </button>

            {/* Font Options Popover Dropdown */}
            {showFontMenu && (
              <div className={`absolute right-0 mt-3 w-80 max-h-[85vh] overflow-y-auto rounded-3xl p-4 shadow-2xl z-50 border transition-all ${
                isDarkMode ? 'bg-[#121E36] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
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

                {/* 2. Arabic Harakat Option (হরকত সহ / ছাড়া) */}
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>আরবি হরকত (Tashkeel) সেটিং:</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    আরবি প্রশ্নে হরকত/জের-জবর যুক্ত বা মুক্ত রাখুন:
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onChangeShowHarakat(true)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
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
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
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
                <div className="mb-4 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>বাংলা ফন্ট (Bangla Fonts):</span>
                  </label>
                  <div className="space-y-1">
                    {bengaliFonts.map((f) => (
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

                {/* 4. Arabic Fonts */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5" />
                    <span>আরবি ফন্ট (Arabic Calligraphy Fonts):</span>
                  </label>
                  <div className="space-y-1">
                    {arabicFonts.map((f) => (
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
                          <span className="block font-bold flex items-center gap-1.5">
                            {f.name}
                            <span className="text-[10px] text-amber-400 font-normal">({f.arName})</span>
                          </span>
                          <span className="text-[11px] text-amber-500/90 font-amiri block mt-0.5" dir="rtl">{f.sample}</span>
                        </div>
                        {fontFamily === f.id && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
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

          {/* User Profile / Top-Right Menu Button */}
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
              className={`p-1.5 sm:px-3 sm:py-2 rounded-2xl flex items-center gap-2 cursor-pointer transition-all border shadow-xs active:scale-95 ${
                showUserMenu
                  ? 'bg-[#0b705c] text-white border-[#0b705c]'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
              title="ব্যবহারকারীর প্রোফাইল ও মেনু"
            >
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-400 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0b705c] text-amber-300 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-400">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="text-left hidden md:block min-w-0 max-w-[110px]">
                <span className="block text-xs font-black truncate leading-tight font-tiro text-emerald-800 dark:text-emerald-300">
                  {userProfile?.name || 'প্রোফাইল'}
                </span>
                <span className="block text-[9px] opacity-75 font-bold truncate">
                  {userProfile?.phone ? userProfile.phone : 'মেনু ও তথ্য'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0 hidden sm:block" />
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
                      <span className="block font-black">🏆 জাতীয় মেধা তালিকা</span>
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


