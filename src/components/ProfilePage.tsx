import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Phone, Camera, Check, X, Sparkles, Trophy, Crown, Flame, 
  ChevronRight, BookOpen, Bookmark, AlertTriangle, RotateCcw, 
  LayoutGrid, Settings, Upload, ArrowLeft, BarChart3, HelpCircle, 
  CheckCircle2, Clock, FileCheck2, XCircle, RefreshCw, Copy, ExternalLink, ShieldCheck,
  LogIn, LogOut
} from 'lucide-react';
import { 
  saveUserProfile, getUserProfile, getStudentStats, 
  toBengaliNumeral, getUserGoal, saveUserGoal, getUserStreakDays, 
  getBookmarkedIds, isUserRegistered, clearUserProfile, UserProfile,
  compressAndResizeAvatar
} from '../lib/utils';
import { 
  fetchCourseApplicationsFromSupabase, 
  supabaseGetSession, 
  supabaseSignOut, 
  supabaseOnAuthStateChange,
  supabaseUpdateUserProfile
} from '../lib/supabase';
import { CourseEnrollmentRecord } from '../types';
import { AuthModal } from './AuthModal';

interface ProfilePageProps {
  onNavigateHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenCourses: () => void;
  onOpenFontSettings?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateHome,
  onOpenLeaderboard,
  onOpenCourses,
  onOpenFontSettings,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [isRegistered, setIsRegistered] = useState<boolean>(() => isUserRegistered());

  const [activeTab, setActiveTab] = useState<'menu' | 'edit_profile' | 'dashboard' | 'bookmarks' | 'wrong_bank' | 'archive' | 'vip_membership' | 'applications'>('menu');
  
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || userProfile?.email || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [goalText, setGoalText] = useState(getUserGoal());

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
      const prof = getUserProfile();
      if (prof) {
        setUserProfile(prof);
        setIsRegistered(true);
        setName(prof.name);
        setPhone(prof.phone || prof.email || '');
        setAvatar(prof.avatar || '');
      }
    });

    const handleProfileSync = () => {
      const p = getUserProfile();
      setUserProfile(p);
      const reg = isUserRegistered();
      setIsRegistered(reg);
      if (p) {
        setName(p.name);
        setPhone(p.phone || p.email || '');
        setAvatar(p.avatar || '');
      } else {
        setName('');
        setPhone('');
        setAvatar('');
      }
    };

    window.addEventListener('tamreen_profile_updated', handleProfileSync);
    window.addEventListener('tamreen_auth_status_changed', handleProfileSync);

    return () => {
      unsubscribe();
      window.removeEventListener('tamreen_profile_updated', handleProfileSync);
      window.removeEventListener('tamreen_auth_status_changed', handleProfileSync);
    };
  }, []);

  const handleSignOut = async () => {
    await supabaseSignOut();
    clearUserProfile();
    setAuthSession(null);
    setIsRegistered(false);
    setUserProfile(null);
    setName('');
    setPhone('');
    setAvatar('');
    setSuccessMsg('সফলভাবে লগআউট হয়েছে');
    setTimeout(() => {
      setSuccessMsg('');
      onNavigateHome();
    }, 800);
  };

  // Course Applications State from Supabase
  const [applications, setApplications] = useState<CourseEnrollmentRecord[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [appFetchError, setAppFetchError] = useState<string | null>(null);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentStats = getStudentStats();
  const streakDays = getUserStreakDays();
  const bookmarkedCount = getBookmarkedIds().length;

  const loadApplications = async () => {
    setLoadingApps(true);
    setAppFetchError(null);
    const res = await fetchCourseApplicationsFromSupabase(phone);
    setLoadingApps(false);
    if (res.applications) {
      setApplications(res.applications);
    }
    if (res.error) {
      setAppFetchError(res.error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [phone]);

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    }
  }, [activeTab]);

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrxId(trx);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('ছবি সাইজ ৮ মেগাবাইটের কম হতে হবে');
        return;
      }
      try {
        const compressedBase64 = await compressAndResizeAvatar(file, 280, 0.82);
        if (compressedBase64) {
          setAvatar(compressedBase64);
          setErrorMsg('');
        } else {
          setErrorMsg('ছবি প্রসেস করা সম্ভব হয়নি, অন্য ছবি নির্বাচন করুন');
        }
      } catch {
        setErrorMsg('ছবি আপলোডে সমস্যা হয়েছে');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম প্রদান করুন');
      return;
    }
    const currentProfile = getUserProfile();
    const updated = saveUserProfile(name, phone, avatar, true, currentProfile?.email);
    setUserProfile(updated);
    await supabaseUpdateUserProfile({ fullName: name, avatarUrl: avatar, phone });
    setErrorMsg('');
    setSuccessMsg('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('menu');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070D1E] pb-28 animate-fade-in">
      
      {/* Top Banner Header Section */}
      <div className="bg-gradient-to-br from-[#073D33] via-[#095748] to-[#042822] text-white pt-6 pb-8 px-4 sm:px-6 relative shadow-xl">
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            {activeTab !== 'menu' ? (
              <button
                onClick={() => setActiveTab('menu')}
                className="p-2.5 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-black"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>মেনুতে ফিরুন</span>
              </button>
            ) : (
              <button
                onClick={onNavigateHome}
                className="p-2.5 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-black"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>হোমে ফিরুন</span>
              </button>
            )}

            <span className="text-xs font-black px-3 py-1.5 bg-amber-400 text-[#0B132B] rounded-full flex items-center gap-1.5 shadow-md">
              <Crown className="w-4 h-4 fill-[#0B132B]" />
              {isRegistered ? 'VIP মেম্বারশিপ অ্যাক্টিভ' : 'গেস্ট অ্যাকাউন্ট'}
            </span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name || 'User'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-amber-400/90 shadow-2xl border-2 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#0B132B] flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-amber-400/90">
                  <User className="w-10 h-10" />
                </div>
              )}
              {isRegistered && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 text-[#0B132B] rounded-full flex items-center justify-center shadow-lg border-2 border-[#095748]">
                  <Crown className="w-4.5 h-4.5 fill-[#0B132B]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <span className="inline-block text-[10px] font-black px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-md tracking-wider uppercase font-anek">
                {isRegistered ? 'শিক্ষক নিবন্ধন পরীক্ষার্থী' : 'অনিবন্ধিত শিক্ষার্থী'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-tiro text-amber-300 tracking-wide truncate leading-tight drop-shadow-md">
                {isRegistered ? (name || 'শিক্ষার্থী') : 'অতিথি শিক্ষার্থী'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-emerald-100/90 truncate">
                {isRegistered 
                  ? (phone ? `${phone} • tamreen.app` : 'নিবন্ধিত শিক্ষার্থী')
                  : 'লগইন বা রেজিষ্ট্রেশন করা নেই'}
              </p>
              {isRegistered ? (
                <button
                  onClick={() => setActiveTab('edit_profile')}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  <span>প্রোফাইল সংশোধন করুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthInitialMode('login');
                    setShowAuthModal(true);
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  <span>এখনই লগইন করুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3 Metrics Row */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-extrabold text-emerald-200 block">স্ট্রাইক</span>
              <div className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{toBengaliNumeral(streakDays)} দিন</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-extrabold text-emerald-200 block">সমাধান</span>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {toBengaliNumeral(studentStats.totalQuestionsAnswered || 1420)}টি
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-extrabold text-emerald-200 block">লক্ষ্য</span>
              <div className="text-[11px] font-black text-amber-200 mt-0.5 truncate leading-tight">
                {goalText}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Page Body Container */}
      <div className="max-w-xl mx-auto px-4 py-6">

        {/* MAIN MENU */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            
            {/* 1. My Profile */}
            <button
              onClick={() => setActiveTab('edit_profile')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-base font-black">আমার প্রোফাইল</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 2. Performance Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full p-4 rounded-2xl bg-[#0b705c]/10 dark:bg-emerald-950/40 hover:bg-[#0b705c]/20 text-[#0b705c] dark:text-emerald-300 border border-[#0b705c]/30 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#0b705c] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-base font-black block">স্টাডি ড্যাশবোর্ড ও গ্রোথ</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">পরীক্ষার ফলাফল, বিষয়ভিত্তিক নির্ভুলতা ও অগ্রগতি</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0b705c]" />
            </button>

            {/* 3. My Courses */}
            <button
              onClick={onOpenCourses}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-base font-black">আমার কোর্সসমূহ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 4. Bookmarked Questions */}
            <button
              onClick={() => setActiveTab('bookmarks')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-base font-black block">বুকমার্ককৃত প্রশ্ন</span>
                  {bookmarkedCount > 0 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {toBengaliNumeral(bookmarkedCount)}টি প্রশ্ন সংরক্ষিত
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 5. Wrong Answer Bank */}
            <button
              onClick={() => setActiveTab('wrong_bank')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-red-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-base font-black">ভুল উত্তরের ব্যাংক</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 6. Exam Archive */}
            <button
              onClick={() => setActiveTab('archive')}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="text-base font-black">পরীক্ষার আর্কাইভ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 7. Premium Membership */}
            <button
              onClick={() => setActiveTab('vip_membership')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-[#0B132B] flex items-center justify-center shrink-0 shadow-xs">
                  <Crown className="w-5 h-5 fill-[#0B132B]" />
                </div>
                <div className="text-left">
                  <span className="text-base font-black block">প্রিমিয়াম মেম্বারশিপ</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">সকল আনলিমিটেড মক টেস্ট সুবিধা</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </button>

            {/* 9. Settings */}
            <button
              onClick={onOpenFontSettings}
              className="w-full p-4 rounded-2xl bg-white dark:bg-[#0D172A] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-base font-black">সেটিংস ও পছন্দ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            {/* 10. Login / Create Account OR Sign Out */}
            {isRegistered ? (
              <button
                onClick={handleSignOut}
                className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-200/70 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-base font-black block">লগআউট করুন</span>
                    <span className="text-xs font-semibold text-rose-500/80">
                      {phone || userProfile?.email || authSession?.user?.email || 'অ্যাকাউন্ট থেকে প্রস্থান করুন'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-rose-400" />
              </button>
            ) : (
              <div className="p-4 bg-gradient-to-r from-[#07532B]/10 to-[#EAB308]/15 border border-[#07532B]/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#07532B] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      আত-তামরীন অ্যাকাউন্টে যুক্ত হোন
                    </h4>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      পরীক্ষার রেকর্ড ও কোর্স অ্যাক্সেস পেতে লগইন করুন
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setAuthInitialMode('login');
                      setShowAuthModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#07532B] hover:bg-[#064423] text-white font-black text-xs transition-colors text-center shadow-xs cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                  <button
                    onClick={() => {
                      setAuthInitialMode('register');
                      setShowAuthModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#07532B] dark:text-emerald-400 hover:bg-slate-50 font-black text-xs transition-colors text-center shadow-xs cursor-pointer"
                  >
                    নতুন অ্যাকাউন্ট
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* EDIT PROFILE TAB */}
        {activeTab === 'edit_profile' && (
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-black text-[#0B132B] dark:text-white">
                প্রোফাইল সংশোধন ও ছবি নির্বাচন
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                আপনার ছবি ও তথ্য মেধা তালিকায় প্রদর্শন করা হবে
              </p>
            </div>

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

            <div className="text-center space-y-3">
              <div className="relative inline-block">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-28 h-28 rounded-full object-cover mx-auto ring-4 ring-[#0b705c]/30 shadow-lg border-2 border-white dark:border-slate-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#0b705c] text-white flex items-center justify-center mx-auto ring-4 ring-[#0b705c]/30 shadow-lg font-black text-3xl">
                    <User className="w-12 h-12 text-amber-300" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-[#0b705c] hover:bg-[#085a4a] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95 border-2 border-white dark:border-slate-800"
                  title="ছবি পরিবর্তন করুন"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 block">
                  অথবা তৈরি করা অবয়ব নির্বাচন করুন:
                </span>
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatar === url ? 'border-[#0b705c] scale-110 ring-2 ring-[#0b705c]/40' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: মোঃ আব্দুর রহিম"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 01700000000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#0b705c] dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>গ্যালারি থেকে ছবি আপলোড করুন</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 rounded-2xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <h3 className="text-base font-black text-[#0B132B] dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0b705c]" />
              <span>পারফরম্যান্স ড্যাশবোর্ড</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-xs font-bold text-slate-500 block">সম্পন্ন পরীক্ষা</span>
                <span className="text-xl font-black text-[#0b705c] dark:text-emerald-400 mt-1 block">
                  {toBengaliNumeral(studentStats.todayPracticeCount ? Math.max(12, studentStats.todayPracticeCount) : 12)}টি
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-xs font-bold text-slate-500 block">গড় নির্ভুলতা</span>
                <span className="text-xl font-black text-amber-500 mt-1 block">
                  ৯৪%
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 text-center leading-relaxed">
              🌟 মাশাআল্লাহ্‌! আপনার ১৮তম শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি অনেক এগিয়ে রয়েছে।
            </div>
          </div>
        )}

        {/* MY APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            
            {/* Header Box */}
            <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B132B] dark:text-white leading-tight">
                    আমার ভর্তি আবেদনসমূহ
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Supabase 'course_applications' ডাটাবেস থেকে রিয়েল-টাইম স্ট্যাটাস
                  </p>
                </div>
              </div>

              <button
                onClick={loadApplications}
                disabled={loadingApps}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${loadingApps ? 'animate-spin text-[#0b705c]' : ''}`} />
                <span className="hidden sm:inline">রিফ্রেশ</span>
              </button>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 block uppercase tracking-wider">যাচাইাধীন</span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5 block">
                  {toBengaliNumeral(applications.filter(a => a.status === 'pending').length)}টি
                </span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">অনুমোদিত</span>
                <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
                  {toBengaliNumeral(applications.filter(a => a.status === 'approved').length)}টি
                </span>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 block uppercase tracking-wider">বাতিলকৃত</span>
                <span className="text-lg font-black text-rose-800 dark:text-rose-300 mt-0.5 block">
                  {toBengaliNumeral(applications.filter(a => a.status === 'rejected').length)}টি
                </span>
              </div>
            </div>

            {/* Loading Indicator */}
            {loadingApps && (
              <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#0b705c] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Supabase থেকে আবেদনের তথ্য লোড করা হচ্ছে...
                </p>
              </div>
            )}

            {/* Fetch Error */}
            {!loadingApps && appFetchError && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>{appFetchError}</span>
                <button
                  onClick={loadApplications}
                  className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-black cursor-pointer"
                >
                  পুনরায় চেষ্টা করুন
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loadingApps && applications.length === 0 && (
              <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
                    কোনো আবেদন জমা দেওয়া হয়নি
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    আপনার ফোন নম্বর ({phone}) দিয়ে এখনও কোনো কোর্সে ভর্তি আবেদন পাওয়া যায়নি।
                  </p>
                </div>
                <button
                  onClick={onOpenCourses}
                  className="px-5 py-2.5 rounded-2xl bg-[#0b705c] hover:bg-[#085a4a] text-white text-xs font-black shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>কোর্সসমূহ এক্সপ্লোর করুন</span>
                </button>
              </div>
            )}

            {/* Applications List */}
            {!loadingApps && applications.length > 0 && (
              <div className="space-y-3.5">
                {applications.map((app, index) => {
                  const isApproved = app.status === 'approved';
                  const isPending = app.status === 'pending';
                  const isRejected = app.status === 'rejected';

                  return (
                    <div
                      key={app.id || index}
                      className="bg-white dark:bg-[#0D172A] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {/* Card Top Row: Title & Badge */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div>
                          <span className="text-[10px] font-black text-[#0b705c] dark:text-emerald-400 tracking-wider uppercase block">
                            ভর্তি আবেদন #{toBengaliNumeral(index + 1)}
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-snug">
                            {app.course_title}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isApproved && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shrink-0 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>অনুমোদিত</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shrink-0 shadow-xs animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>যাচাইাধীন</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1.5 shrink-0 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>বাতিলকৃত</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detail Fields */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                          <span className="text-slate-400 font-semibold block text-[10px]">শিক্ষার্থীর নাম</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{app.student_name}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                          <span className="text-slate-400 font-semibold block text-[10px]">পেমেন্ট মেথড</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block capitalize">
                            {app.payment_method} ({app.amount})
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl col-span-2 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">ট্রানজেকশন আইডি (TrxID)</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-amber-300 text-xs sm:text-sm mt-0.5 block tracking-wide">
                              {app.transaction_id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyTrx(app.transaction_id)}
                            className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedTrxId === app.transaction_id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedTrxId === app.transaction_id ? 'কপি হয়েছে' : 'কপি'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Contextual Status Banner */}
                      {isApproved && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>আবেদন অনুমোদিত! কোর্সটি সম্পূর্ণ সক্রিয়।</span>
                          </div>
                          <button
                            onClick={onOpenCourses}
                            className="px-3 py-1.5 bg-[#0b705c] hover:bg-[#085a4a] text-white rounded-xl text-[11px] font-black transition-colors cursor-pointer shrink-0 ml-2 shadow-xs"
                          >
                            কোর্সে যান
                          </button>
                        </div>
                      )}

                      {isPending && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>আপনার ট্রানজেকশন তথ্য এডমিন প্যানেলে যাচাই করা হচ্ছে। শীঘ্রই আপডেট জানানো হবে।</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>ট্রানজেকশন আইডিতে অসঙ্গতি থাকায় আবেদনটি বাতিল হয়েছে। তথ্যাদি যাচাই করে পুনরায় আবেদন করুন।</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Auth Modal (Login / Create Account) */}
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
