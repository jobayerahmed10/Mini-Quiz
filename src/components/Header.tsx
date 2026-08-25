import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Type, 
  Check, 
  X, 
  Sparkles, 
  Languages, 
  ArrowLeft, 
  User, 
  Trophy, 
  Settings, 
  BarChart3, 
  GraduationCap,
  Search,
  Home,
  FileText,
  BookOpen,
  Briefcase,
  Layers,
  LogIn,
  UserPlus,
  ShieldCheck,
  LogOut,
  Wifi
} from 'lucide-react';
import { PageRoute, TabRoute } from '../types';
import { getUserProfile, isUserRegistered, clearUserProfile, UserProfile } from '../lib/utils';
import { supabaseSignOut } from '../lib/supabase';
import { NetworkHelpModal } from './NetworkHelpModal';

export type FontFamilyType = 'hind' | 'noto' | 'tiro' | 'anek' | 'amiri' | 'scheherazade' | 'cairo';

interface HeaderProps {
  currentPage: PageRoute;
  activeTab?: TabRoute;
  selectedSubject?: string;
  onNavigateHome: () => void;
  onTabChange?: (tab: TabRoute) => void;
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
  onOpenLogin?: () => void;
  onOpenLeaderboard?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  activeTab = 'home',
  selectedSubject,
  onNavigateHome,
  onTabChange,
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
  onOpenLogin,
  onOpenLeaderboard,
  searchQuery = '',
  onSearchChange,
}) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNetworkHelp, setShowNetworkHelp] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [isRegistered, setIsRegistered] = useState<boolean>(() => isUserRegistered());

  // Listen for realtime auth and profile updates
  useEffect(() => {
    const handleProfileSync = () => {
      setUserProfile(getUserProfile());
      setIsRegistered(isUserRegistered());
    };

    window.addEventListener('tamreen_profile_updated', handleProfileSync);
    window.addEventListener('tamreen_auth_status_changed', handleProfileSync);
    return () => {
      window.removeEventListener('tamreen_profile_updated', handleProfileSync);
      window.removeEventListener('tamreen_auth_status_changed', handleProfileSync);
    };
  }, []);

  const isAtHomeRoot = currentPage === 'home' && activeTab === 'home';

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

  const handleSubTabClick = (tab: TabRoute) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300 border-b shadow-xs ${
      isDarkMode ? 'bg-[#0B132B]/95 border-slate-800 text-white' : 'bg-[#EEF2F6]/95 border-slate-200/60 text-slate-900'
    }`}>
      {/* 1. TOP BRANDING ROW */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 pt-2.5 pb-2 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Back Button OR Logo + Brand Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          {!isAtHomeRoot ? (
            /* Circular Neumorphic Back Button */
            <button
              onClick={onGoBack || onNavigateHome}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full neu-pill flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="পিছনে ফিরে যান"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-amber-500 shrink-0" strokeWidth={2.6} />
            </button>
          ) : (
            /* Green Squircle Logo Box with Golden Graduation Cap (Exact match to Screenshot) */
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] sm:rounded-[16px] bg-[#046A38] dark:bg-[#064E3B] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(4,106,56,0.3)] border border-emerald-500/40">
              <GraduationCap className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#FACC15]" strokeWidth={2.2} />
            </div>
          )}

          {/* Exact Brand Logo Title + Subtitle */}
          <button
            onClick={onNavigateHome}
            className="flex items-center text-left group focus:outline-hidden cursor-pointer min-w-0"
            title="হোম পেজে যান"
          >
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className={`font-bold text-[19px] sm:text-2xl tracking-tight whitespace-nowrap leading-none transition-all ${
                  isDarkMode ? 'text-white' : 'text-[#064E3B]'
                }`}>
                  আত-তামরীন
                </span>
                <span className="bg-[#046A38] dark:bg-[#064E3B] text-[#FACC15] font-bold text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full inline-flex items-center justify-center leading-tight shrink-0 shadow-xs">
                  একাডেমি
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight tracking-normal truncate">
                প্রস্তুতি হোক আরও স্মার্ট
              </p>
            </div>
          </button>
        </div>

        {/* Right Controls: Font ('T') + DarkMode ('Moon/Sun') + User Avatar / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Subject Pill on wide screens */}
          {selectedSubject && selectedSubject !== 'all' && selectedSubject !== 'সকল বিষয়' && (
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-amber-300' : 'bg-[#EEF2F6] border-slate-300 text-[#0B132B]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="truncate max-w-[130px]">{selectedSubject}</span>
            </div>
          )}

          {/* Font Settings Button with Orange T */}
          <div className="relative">
            <button
              onClick={() => setShowFontMenu(!showFontMenu)}
              className={`w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                showFontMenu
                  ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-400 ring-2 ring-amber-400/30'
                  : 'neu-pill'
              }`}
              title="ফন্ট স্টাইল, আরবি ফন্ট ও হরকত সেটিং"
            >
              <span className="text-[#E65100] dark:text-[#FB923C] font-black text-base sm:text-lg leading-none font-sans">
                T
              </span>
            </button>

            {/* Font Options Popover Dropdown */}
            {showFontMenu && (
              <>
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
                              ? 'bg-[#046A38] text-white border-[#046A38] shadow-xs'
                              : 'neu-btn text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div>{opt.label}</div>
                          <div className="text-[9px] font-normal opacity-70">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Arabic Harakat Option */}
                  <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                    <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>আরবি হরকত (Tashkeel) সেটিং:</span>
                    </label>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => onChangeShowHarakat(true)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          showHarakat
                            ? 'bg-[#046A38] text-amber-300 border-[#046A38] shadow-xs'
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
                            ? 'bg-[#046A38] text-amber-300 border-[#046A38] shadow-xs'
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
                              ? 'bg-[#046A38] text-white font-bold shadow-xs'
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
                              ? 'bg-[#046A38] text-white font-bold shadow-xs'
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
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl sm:rounded-2xl neu-pill flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title={isDarkMode ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1E293B] dark:text-slate-200" strokeWidth={2.2} />
            )}
          </button>

          {/* User Profile OR Login Button */}
          <div className="relative">
            {isRegistered ? (
              /* Registered / Logged In: Show Circular Avatar with Gold Ring */
              <button
                onClick={() => {
                  if (onOpenProfile) {
                    onOpenProfile();
                  } else {
                    setShowUserMenu(!showUserMenu);
                  }
                  setShowFontMenu(false);
                }}
                className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full ring-2 ring-[#EAB308] p-[1.5px] bg-[#EEF2F6] dark:bg-slate-800 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center transition-all active:scale-95 shadow-xs"
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
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                  </div>
                )}
              </button>
            ) : (
              /* Unregistered Guest: Show Exact Screenshot Matching "লগইন" Pill Button */
              <button
                onClick={() => {
                  if (onOpenLogin) {
                    onOpenLogin();
                  } else if (onOpenProfile) {
                    onOpenProfile();
                  } else {
                    setShowUserMenu(!showUserMenu);
                  }
                  setShowFontMenu(false);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#046A38] hover:bg-[#03542c] text-[#FACC15] font-hind font-bold text-xs sm:text-sm shadow-[0_2px_8px_rgba(4,106,56,0.3)] hover:brightness-110 active:scale-95 transition-all border border-emerald-500/50 cursor-pointer shrink-0"
                title="লগইন বা অ্যাকাউন্ট তৈরি করুন"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FACC15]" strokeWidth={2.4} />
                <span className="whitespace-nowrap font-bold text-[#FACC15]">লগইন</span>
              </button>
            )}

            {/* Top Right User Menu Dropdown Popover */}
            {showUserMenu && (
              <div className={`absolute right-0 mt-3 w-72 sm:w-80 rounded-3xl p-4 shadow-2xl z-50 border transition-all animate-fade-in ${
                isDarkMode ? 'bg-[#121E36] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {/* User Header Profile Card */}
                {isRegistered ? (
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
                        {userProfile?.name || 'ব্যবহারকারীর নাম'}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-200 truncate">
                        {userProfile?.phone || userProfile?.email || 'নিবন্ধিত শিক্ষার্থী'}
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
                ) : (
                  <div className="p-4 bg-gradient-to-br from-slate-900 via-[#0B132B] to-[#064E3B] text-white rounded-2xl mb-3 relative overflow-hidden border border-emerald-500/30 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300 font-bold">
                          <LogIn className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white font-hind">লগইন করুন</h4>
                          <p className="text-[11px] font-medium text-emerald-200/80">পড়াশোনা সুবিধা আনলক করুন</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUserMenu(false)}
                        className="p-1 text-white/70 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenLogin) onOpenLogin();
                        }}
                        className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>লগইন</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onOpenLogin) onOpenLogin();
                        }}
                        className="py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all border border-white/20 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>রেজিষ্ট্রেশন</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Menu Items List */}
                <div className="space-y-1">
                  {isRegistered ? (
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
                  ) : null}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">📊 স্টাডি ড্যাশবোর্ড ও অগ্রগতি</span>
                      <span className="block text-[10px] font-medium opacity-60">মোট পরীক্ষা, বিষয়ভিত্তিক নির্ভুলতা ও গ্রোথ</span>
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

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowNetworkHelp(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/80 pt-2.5"
                  >
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black">📶 মোবাইল ডাটা ও স্পিড গাইড</span>
                      <span className="block text-[10px] font-medium opacity-60">যেকোনো সিমে দ্রুত ওপেনের সমাধান</span>
                    </div>
                  </button>

                  {/* Log Out Button at the very bottom of the user menu */}
                  {isRegistered && (
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await supabaseSignOut();
                        clearUserProfile();
                      }}
                      className="w-full text-left p-2.5 rounded-xl text-xs font-black flex items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-1"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-black">🚪 লগআউট করুন</span>
                        <span className="block text-[10px] font-medium opacity-60">অ্যাকাউন্ট থেকে প্রস্থান করুন</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR ROW (Exact Inset Neumorphic match to screenshot) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-1 pb-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="কোর্স, বিষয় বা প্রশ্ন খুঁজুন..."
            className="w-full pl-10 pr-9 py-2.5 neu-inset rounded-full text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#046A38]/30 dark:focus:ring-emerald-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. HORIZONTAL SUB-TABS ROW (Neumorphic Pills - Exact match to screenshots) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
          {/* 1. হোম */}
          <button
            onClick={() => handleSubTabClick('home')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'home' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <Home className={`w-3.5 h-3.5 ${activeTab === 'home' && currentPage === 'home' ? 'text-[#EAB308]' : ''}`} />
            <span>হোম</span>
          </button>

          {/* 2. পরীক্ষা দিন */}
          <button
            onClick={() => handleSubTabClick('exam')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'exam' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'exam' && currentPage === 'home' ? 'text-[#EAB308]' : ''}`} />
            <span>পরীক্ষা দিন</span>
          </button>

          {/* 3. কোর্স */}
          <button
            onClick={() => handleSubTabClick('courses')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'courses' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'courses' && currentPage === 'home' ? 'text-[#EAB308]' : ''}`} />
            <span>কোর্স</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#EF4444] text-white rounded-full">নতুন</span>
          </button>

          {/* 4. তামরীন এআই */}
          <button
            onClick={() => handleSubTabClick('ustad_ai')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ustad_ai' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>তামরীন এআই</span>
          </button>

          {/* 5. সার্কুলার */}
          <button
            onClick={() => handleSubTabClick('circulars')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'circulars' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <Briefcase className={`w-3.5 h-3.5 ${activeTab === 'circulars' && currentPage === 'home' ? 'text-[#EAB308]' : ''}`} />
            <span>সার্কুলার</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#EF4444] text-white rounded-full">ভর্তি</span>
          </button>

          {/* 6. বিষয়ভিত্তিক */}
          <button
            onClick={() => handleSubTabClick('subjects')}
            className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'subjects' && currentPage === 'home'
                ? 'bg-[#046A38] text-white shadow-[0_3px_10px_rgba(4,106,56,0.35)]'
                : 'neu-pill text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === 'subjects' && currentPage === 'home' ? 'text-[#EAB308]' : ''}`} />
            <span>বিষয়ভিত্তিক</span>
          </button>
        </div>
      </div>

      {/* Mobile Data and WiFi Help Modal */}
      <NetworkHelpModal 
        isOpen={showNetworkHelp} 
        onClose={() => setShowNetworkHelp(false)} 
      />
    </header>
  );
};
