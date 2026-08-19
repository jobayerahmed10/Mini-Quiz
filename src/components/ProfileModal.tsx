import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Phone, Camera, Check, X, Sparkles, Trophy, Award, 
  BarChart3, Settings, Upload, Crown, Flame, Target, CheckCircle2, 
  ChevronRight, BookOpen, Bookmark, AlertTriangle, RotateCcw, 
  LayoutGrid, Mail, Star, ExternalLink, SlidersHorizontal, ArrowLeft,
  LogIn, LogOut
} from 'lucide-react';
import { 
  saveUserProfile, UserProfile, getUserProfile, getStudentStats, 
  toBengaliNumeral, getUserGoal, saveUserGoal, getUserStreakDays, 
  getBookmarkedIds 
} from '../lib/utils';
import { 
  supabaseGetSession, 
  supabaseSignOut, 
  supabaseOnAuthStateChange 
} from '../lib/supabase';
import { AuthModal } from './AuthModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
  onOpenCourses?: () => void;
  onOpenFontSettings?: () => void;
}

// Preset avatars for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenLeaderboard,
  onOpenCourses,
  onOpenFontSettings,
}) => {
  const currentProfile = getUserProfile();
  const [activeTab, setActiveTab] = useState<'menu' | 'edit_profile' | 'dashboard' | 'courses' | 'bookmarks' | 'wrong_bank' | 'archive' | 'vip_membership' | 'settings'>('menu');
  
  const [name, setName] = useState(currentProfile?.name || 'জোবায়ের আহমদ');
  const [phone, setPhone] = useState(currentProfile?.phone || '01700000000');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250');
  const [goalText, setGoalText] = useState(getUserGoal());
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Supabase Auth State
  const [authSession, setAuthSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    supabaseGetSession().then((session) => {
      setAuthSession(session);
    });

    const unsubscribe = supabaseOnAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session?.user) {
        const prof = getUserProfile();
        if (prof) {
          setName(prof.name);
          setPhone(prof.phone);
          setAvatar(prof.avatar);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabaseSignOut();
    setAuthSession(null);
    setSuccessMsg('সফলভাবে লগআউট হয়েছে');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentStats = getStudentStats();
  const streakDays = getUserStreakDays();
  const bookmarkedCount = getBookmarkedIds().length;

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('ছবি সাইজ ৫ মেগাবাইটের কম হতে হবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম প্রদান করুন');
      return;
    }
    saveUserProfile(name, phone, avatar);
    setErrorMsg('');
    setSuccessMsg('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('menu');
    }, 1500);
  };

  const handleSaveGoal = () => {
    saveUserGoal(goalText);
    setIsEditingGoal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#080E1A] rounded-[36px] max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header Banner matching Image design */}
        <div className="bg-gradient-to-br from-[#073D33] via-[#095748] to-[#042822] text-white p-6 sm:p-7 relative shrink-0">
          
          {/* Close / Back button */}
          <div className="flex items-center justify-between mb-4">
            {activeTab !== 'menu' ? (
              <button
                onClick={() => setActiveTab('menu')}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>মেনুতে ফিরুন</span>
              </button>
            ) : (
              <span className="text-xs font-black px-3 py-1 bg-amber-400 text-[#0B132B] rounded-full flex items-center gap-1 shadow-xs">
                <Crown className="w-3.5 h-3.5 fill-[#0B132B]" />
                VIP মেম্বারশিপ অ্যাক্টিভ
              </span>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-amber-400/80 shadow-xl border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#0B132B] flex items-center justify-center font-black text-2xl shadow-xl ring-4 ring-amber-400/80">
                  <User className="w-9 h-9" />
                </div>
              )}
              {/* Crown Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-amber-400 text-[#0B132B] rounded-full flex items-center justify-center shadow-md border-2 border-[#095748]">
                <Crown className="w-4 h-4 fill-[#0B132B]" />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="inline-block text-[9px] font-black px-2 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-md tracking-wider uppercase font-anek">
                শিক্ষক নিবন্ধন পরীক্ষার্থী
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-tiro text-amber-300 tracking-wide truncate leading-tight drop-shadow-md">
                {name || 'জোবায়ের আহমদ'}
              </h3>
              <p className="text-xs font-semibold text-emerald-100/90 truncate">
                {phone ? `${phone} • tamreen.app` : 'jobayer.tamreen@gmail.com'}
              </p>
              <button
                onClick={() => setActiveTab('edit_profile')}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                <span>প্রোফাইল সংশোধন করুন</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Top 3 Metric Cards Grid from screenshot */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            {/* Card 1: Streak */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-200 block">স্ট্রাইক</span>
              <div className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{toBengaliNumeral(streakDays)} দিন</span>
              </div>
            </div>

            {/* Card 2: Solved */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-200 block">সমাধান</span>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {toBengaliNumeral(studentStats.totalQuestionsAnswered || 1420)}টি
              </div>
            </div>

            {/* Card 3: Goal Target */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-center relative group">
              <span className="text-[10px] font-bold text-emerald-200 block">লক্ষ্য</span>
              <div className="text-[11px] font-black text-amber-200 mt-0.5 truncate leading-tight">
                {goalText}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">

          {/* MAIN MENU TAB */}
          {activeTab === 'menu' && (
            <div className="space-y-2">
              
              {/* Item 1: My Profile */}
              <button
                onClick={() => setActiveTab('edit_profile')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black">আমার প্রোফাইল</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 2: Performance Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-[#0b705c]/10 dark:bg-emerald-950/40 hover:bg-[#0b705c]/20 text-[#0b705c] dark:text-emerald-300 border border-[#0b705c]/30 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0b705c] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">পারফরম্যান্স ড্যাশবোর্ড</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">পরীক্ষার ফলাফল, পয়েন্ট ও নির্ভুলতা</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#0b705c]" />
              </button>

              {/* Item 3: My Courses */}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenCourses) onOpenCourses();
                }}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black">আমার কোর্সসমূহ</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 4: Bookmarked Questions */}
              <button
                onClick={() => setActiveTab('bookmarks')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">বুকমার্ককৃত প্রশ্ন</span>
                    {bookmarkedCount > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {toBengaliNumeral(bookmarkedCount)}টি প্রশ্ন সংরক্ষিত
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 5: Wrong Answer Bank */}
              <button
                onClick={() => setActiveTab('wrong_bank')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-red-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black">ভুল উত্তরের ব্যাংক</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 6: Exam Archive */}
              <button
                onClick={() => setActiveTab('archive')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-[#0b705c]/10 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black">পরীক্ষার আর্কাইভ</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 7: Leaderboard */}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLeaderboard) onOpenLeaderboard();
                }}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/80 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#0B132B] flex items-center justify-center shrink-0 shadow-xs">
                    <Trophy className="w-5 h-5 fill-[#0B132B]" />
                  </div>
                  <span className="text-sm font-black">লিডারবোর্ড</span>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600" />
              </button>

              {/* Item 8: Premium Membership */}
              <button
                onClick={() => setActiveTab('vip_membership')}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-[#0B132B] flex items-center justify-center shrink-0 shadow-sm">
                    <Crown className="w-5 h-5 fill-[#0B132B]" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black block">প্রিমিয়াম মেম্বারশিপ</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">সকল আনলিমিটেড মক টেস্ট সুবিধা</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600" />
              </button>

              {/* Item 9: Settings */}
              <button
                onClick={() => {
                  onClose();
                  if (onOpenFontSettings) onOpenFontSettings();
                }}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black">সেটিংস ও পছন্দ</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              {/* Item 10: Auth (Login / Register / Logout) */}
              {authSession?.user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-200/70 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-black block">লগআউট করুন</span>
                      <span className="text-[10px] font-bold text-rose-500/80">
                        {authSession.user.email || 'সক্রিয় অ্যাকাউন্ট'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-400" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthInitialMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full p-3.5 sm:p-4 rounded-2xl bg-[#07532B]/10 dark:bg-[#07532B]/20 hover:bg-[#07532B]/20 text-[#07532B] dark:text-emerald-300 border border-[#07532B]/30 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#07532B] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-black block">লগইন / নতুন অ্যাকাউন্ট তৈরি করুন</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        আত-তামরীন অ্যাকাউন্টে প্রবেশ করুন
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#07532B] dark:text-emerald-400" />
                </button>
              )}
            </div>
          )}

          {/* EDIT PROFILE SUB-TAB */}
          {activeTab === 'edit_profile' && (
            <div className="space-y-5">
              <div className="text-center">
                <h4 className="text-base font-black text-[#0B132B] dark:text-white">
                  প্রোফাইল সংশোধন ও ছবি নির্বাচন
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  আপনার ছবি ও তথ্য লিডারবোর্ড এবং সার্টিফিকেটে যুক্ত থাকবে
                </p>
              </div>

              {/* Alert Feedback */}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Avatar Selector Box */}
              <div className="text-center space-y-3">
                <div className="relative inline-block group">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-[#0b705c]/30 shadow-lg border-2 border-white dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#0b705c] text-white flex items-center justify-center mx-auto ring-4 ring-[#0b705c]/30 shadow-lg font-black text-2xl">
                      <User className="w-10 h-10 text-amber-300" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2.5 bg-[#0b705c] hover:bg-[#085a4a] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95 border-2 border-white dark:border-slate-800"
                    title="ছবি পরিবর্তন করুন"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">
                    অথবা তৈরি করা অবয়ব নির্বাচন করুন:
                  </span>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          avatar === url ? 'border-[#0b705c] scale-110 ring-2 ring-[#0b705c]/40' : 'border-transparent hover:scale-105'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: মোঃ আব্দুর রহিম"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Phone Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    মোবাইল নম্বর / ইমেইল <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="যেমন: 01700000000"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                      required
                    />
                  </div>
                </div>

                {/* Upload File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#0b705c] dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>গ্যালারি বা ফাইল থেকে নতুন ছবি আনুন</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-4 rounded-2xl bg-[#0B132B] hover:bg-[#121E36] text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>সেভ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DASHBOARD SUB-TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <h4 className="text-sm font-black text-[#0B132B] dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0B132B] dark:text-amber-400" />
                  <span>সামগ্রিক পারফরম্যান্স রিক্যাপ</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">মোট সম্পন্ন পরীক্ষা</span>
                    <span className="text-lg font-black text-[#0B132B] dark:text-amber-400 mt-0.5 block">
                      {toBengaliNumeral(studentStats.todayPracticeCount ? Math.max(12, studentStats.todayPracticeCount) : 12)}টি
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">গড় নির্ভুলতা (Accuracy)</span>
                    <span className="text-lg font-black text-amber-500 mt-0.5 block">
                      ৯৪%
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-2xl border border-blue-200 dark:border-slate-700 text-xs font-bold text-[#0B132B] dark:text-amber-300 text-center">
                  🌟 মাশাআল্লাহ্‌! আপনার এনটিআরসিএ শিক্ষক নিবন্ধন প্রস্তুতি সন্তোষজনক পর্যায়ে রয়েছে।
                </div>
              </div>
            </div>
          )}

          {/* BOOKMARKS SUB-TAB */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="text-sm font-black text-[#0B132B] dark:text-white">
                  বুকমার্ককৃত গুরুত্বপূর্ণ প্রশ্নসমূহ
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  পরীক্ষার প্রস্তুতিতে পুনরায় অনুশীলনের জন্য সেভ করা প্রশ্ন
                </p>
              </div>

              {bookmarkedCount === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    এখনও কোনো প্রশ্ন বুকমার্ক করা হয়নি।
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-300">
                  সংরক্ষিত {toBengaliNumeral(bookmarkedCount)}টি প্রশ্ন দ্রুত রিভিশন দিন।
                </div>
              )}
            </div>
          )}

          {/* WRONG BANK SUB-TAB */}
          {activeTab === 'wrong_bank' && (
            <div className="space-y-3">
              <div className="text-center">
                <h4 className="text-sm font-black text-[#0B132B] dark:text-white">
                  ভুল উত্তরের ব্যাংক (Mistake Review)
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  পূর্বের পরীক্ষাগুলোতে ভুল হওয়া প্রশ্নসমূহ
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 text-xs font-bold text-red-800 dark:text-red-300 text-center">
                যে সকল প্রশ্ন ভুল হয়েছে তা পুনরায় পরীক্ষা দিয়ে সঠিক উত্তর আয়ত্ত করুন।
              </div>
            </div>
          )}

          {/* VIP MEMBERSHIP SUB-TAB */}
          {activeTab === 'vip_membership' && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-[#0B132B] rounded-3xl shadow-lg space-y-3 text-center relative overflow-hidden">
                <Crown className="w-12 h-12 fill-[#0B132B] mx-auto text-[#0B132B]" />
                <h4 className="text-lg font-black">
                  তামরীন প্রিমিয়াম ভিআইপি মেম্বারশিপ
                </h4>
                <p className="text-xs font-bold opacity-90 leading-relaxed">
                  এনটিআরসিএ ও বিসিএস পরীক্ষার জন্য আনলিমিটেড মক টেস্ট, স্পেশাল মডেল টেস্ট এবং ওস্তাদ AI সাপোর্ট পান।
                </p>
                <div className="inline-block py-2 px-5 bg-[#0B132B] text-amber-400 font-black text-xs rounded-2xl shadow-md">
                  মেম্বারশিপ সক্রিয় রয়েছে
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authInitialMode}
        onAuthSuccess={(profile) => {
          setName(profile.name);
          setPhone(profile.phone);
          if (profile.avatar) setAvatar(profile.avatar);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};
