import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Phone, Camera, Check, X, Sparkles, Trophy, Crown, Flame, 
  ChevronRight, ChevronDown, BookOpen, Bookmark, AlertTriangle, RotateCcw, 
  LayoutGrid, Settings, Upload, ArrowLeft, BarChart3, HelpCircle, 
  CheckCircle2, Clock, FileCheck2, XCircle, RefreshCw, Copy, ExternalLink, ShieldCheck,
  LogIn, LogOut, Bell, Edit3, Target, Award, Headset, MessageSquare, 
  FileQuestion, CheckCheck, Share2, Moon, Sun, Type, Send, Smartphone, Users, MessageCircle
} from 'lucide-react';
import { 
  saveUserProfile, getUserProfile, getStudentStats, 
  toBengaliNumeral, getUserGoal, saveUserGoal, getUserStreakDays, 
  getBookmarkedIds, toggleBookmarkId, isUserRegistered, clearUserProfile, UserProfile,
  compressAndResizeAvatar, getCompletedExamIds, getExamResult,
  getUserRollNumber, getSavedExamHistory, getSavedWrongQuestions,
  removeSavedWrongQuestion, calculateRealUserMetrics, SavedWrongQuestion
} from '../lib/utils';
import { 
  fetchCourseApplicationsFromSupabase, 
  supabaseGetSession, 
  supabaseSignOut, 
  supabaseOnAuthStateChange,
  supabaseUpdateUserProfile
} from '../lib/supabase';
import { CourseEnrollmentRecord, Question } from '../types';
import { AuthModal } from './AuthModal';
import { PremiumEnrollmentModal } from './PremiumEnrollmentModal';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';
import { FontFamilyType } from './Header';

interface ProfilePageProps {
  onNavigateHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenCourses: () => void;
  onStartPractice?: (subject?: string, topic?: string) => void;
  onOpenFontSettings?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  fontSize?: 'normal' | 'medium' | 'large';
  onChangeFontSize?: (size: 'normal' | 'medium' | 'large') => void;
  fontFamily?: FontFamilyType;
  onChangeFontFamily?: (font: FontFamilyType) => void;
  showHarakat?: boolean;
  onChangeShowHarakat?: (show: boolean) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
];

const TARGET_EXAM_PRESETS = [
  '১৮তম শিক্ষক নিবন্ধন প্রিলি (সাধারণ)',
  '১৮তম শিক্ষক নিবন্ধন প্রিলি (মাদ্রাসা)',
  '১৯তম শিক্ষক নিবন্ধন প্রস্তুতি',
  'মাদ্রাসা প্রভাষক আরবি (লিখিত/ভাইভা)',
  'প্রভাষক ইসলামিক স্টাডিজ',
  'সহকারী মৌলভী / ধর্মীয় শিক্ষক',
  'সহকারী শিক্ষক (বাংলা / সাধারণ)',
  'বিসিএস ও প্রাথমিক সহকারী শিক্ষক'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateHome,
  onOpenLeaderboard,
  onOpenCourses,
  onStartPractice,
  isDarkMode = false,
  onToggleDarkMode,
  fontSize = 'normal',
  onChangeFontSize,
  fontFamily = 'hind',
  onChangeFontFamily,
  showHarakat = true,
  onChangeShowHarakat,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [isRegistered, setIsRegistered] = useState<boolean>(() => isUserRegistered());

  // Form State for editing
  const [name, setName] = useState(userProfile?.name || 'শিক্ষার্থী');
  const [phone, setPhone] = useState(userProfile?.phone || userProfile?.email || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [goalText, setGoalText] = useState(getUserGoal());

  // Modals and Drawer States
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showDashboardSection, setShowDashboardSection] = useState<boolean>(true);
  const [showMyProfileSection, setShowMyProfileSection] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false);
  const [showWrongBankModal, setShowWrongBankModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState<boolean>(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // Message notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedRoll, setCopiedRoll] = useState(false);

  // Supabase Auth State
  const [authSession, setAuthSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentStats = getStudentStats();
  const streakDays = getUserStreakDays();
  const bookmarkedIds = getBookmarkedIds();
  const completedExamIds = getCompletedExamIds();

  // Real Real-time metrics
  const realMetrics = calculateRealUserMetrics();
  const totalExamsGiven = completedExamIds.length;
  const correctSolvedCount = studentStats.totalQuestionsAnswered || 0;
  const bestExamsCount = realMetrics.bestExamsCount;
  const averageAccuracy = realMetrics.totalQuestions > 0 ? `${toBengaliNumeral(realMetrics.overallAccuracy)}%` : '০০%';
  const userRollNumber = userProfile?.roll_number || userProfile?.student_id || getUserRollNumber(userProfile?.phone);

  // Load real saved questions
  const bookmarkedQuestions = SAMPLE_QUESTIONS.filter(q => bookmarkedIds.includes(String(q.id)));
  const savedWrongQuestions = getSavedWrongQuestions();
  const savedExamHistory = getSavedExamHistory();

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
        setName(prof.name || 'শিক্ষার্থী');
        setPhone(prof.phone || prof.email || '');
        if (prof.avatar) setAvatar(prof.avatar);
      }
    });

    const handleProfileSync = () => {
      const p = getUserProfile();
      setUserProfile(p);
      const reg = isUserRegistered();
      setIsRegistered(reg);
      if (p) {
        setName(p.name || 'শিক্ষার্থী');
        setPhone(p.phone || p.email || '');
        if (p.avatar) setAvatar(p.avatar);
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

  const handleCopyRoll = () => {
    if (userRollNumber) {
      navigator.clipboard.writeText(userRollNumber);
      setCopiedRoll(true);
      setSuccessMsg(`রোল নম্বর ${userRollNumber} কপি হয়েছে!`);
      setTimeout(() => {
        setCopiedRoll(false);
        setSuccessMsg('');
      }, 2000);
    }
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
    clearUserProfile();
    setAuthSession(null);
    setIsRegistered(false);
    setUserProfile(null);
    setShowLogoutConfirm(false);
    setSuccessMsg('সফলভাবে লগআউট হয়েছে');
    setTimeout(() => {
      setSuccessMsg('');
    }, 1500);
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
      setErrorMsg('অনুগ্রহ করে আপনার নাম প্রদান করুন');
      return;
    }
    const currentProfile = getUserProfile();
    const updated = saveUserProfile(name, phone, avatar, true, currentProfile?.email);
    setUserProfile(updated);
    setIsRegistered(true);
    await supabaseUpdateUserProfile({ fullName: name, avatarUrl: avatar, phone });
    setErrorMsg('');
    setSuccessMsg('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => {
      setSuccessMsg('');
      setShowEditProfileModal(false);
    }, 900);
  };

  const handleSaveGoal = (newGoal: string) => {
    saveUserGoal(newGoal);
    setGoalText(newGoal);
    setShowGoalModal(false);
    setSuccessMsg('লক্ষ্য সফলভাবে সেট করা হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-[#070D1E] pb-32 animate-fade-in font-bengali text-slate-800 dark:text-slate-100">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5 transition-colors">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs"
              title="হোমে ফিরুন"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight font-tiro">
                প্রোফাইল
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                আপনার একাউন্ট ও কার্যক্রম
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Profile Button */}
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#0b705c] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              title="প্রোফাইল সম্পাদনা"
            >
              <Edit3 className="w-4.5 h-4.5" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              title="বিজ্ঞপ্তি"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0B132B] shadow-xs animate-pulse">
                ৩
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        
        {/* ========================================================================= */}
        {/* SMART MAIN PROFILE CARD */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#043E30] to-[#022C22] text-white p-5 sm:p-6 shadow-xl border border-emerald-800/40">
          
          {/* Subtle Organic Background Patterns */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="350" cy="50" r="140" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="50" cy="220" r="120" stroke="white" strokeWidth="1.5" />
              <path d="M-50 100 Q 150 150 450 60" stroke="#10B981" strokeWidth="2" fill="none" />
              <path d="M-30 180 Q 200 240 430 140" stroke="#34D399" strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          <div className="relative z-10 space-y-5">
            
            {/* Top Row inside Card: Avatar, User Details, Golden Ribbon Badge */}
            <div className="flex items-start justify-between gap-3">
              
              <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                {/* User Avatar with Golden Crown Ring */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-br from-emerald-200 via-white to-emerald-400 shadow-xl">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full rounded-full object-cover border-2 border-[#064E3B]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-800 flex items-center justify-center text-white font-black text-2xl">
                        <User className="w-10 h-10 text-emerald-200" />
                      </div>
                    )}
                  </div>
                  {/* Golden Crown Badge Button */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 rounded-full flex items-center justify-center shadow-lg border-2 border-[#064E3B]">
                    <Crown className="w-4 h-4 fill-amber-900" />
                  </div>
                </div>

                {/* User Info Details */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Premium Member Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold shadow-xs">
                    <Crown className="w-3.5 h-3.5 fill-amber-300" />
                    <span>{isRegistered ? 'রেজিস্টার্ড মেম্বার' : 'গেস্ট শিক্ষার্থী'}</span>
                  </div>

                  {/* Name */}
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide truncate leading-tight drop-shadow-xs font-tiro">
                    {name || 'শিক্ষার্থী'}
                  </h2>

                  {/* Student Roll Number Badge with Copy Action */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="tracking-wide">রোল: <span className="font-mono text-amber-300">{userRollNumber}</span></span>
                    <button
                      onClick={handleCopyRoll}
                      className="p-0.5 hover:text-white text-emerald-300 transition-colors cursor-pointer active:scale-90"
                      title="রোল নম্বর কপি করুন"
                      type="button"
                    >
                      {copiedRoll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Phone and Domain */}
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-100/90 truncate">
                    {phone && (
                      <>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-300" />
                          <span>{phone}</span>
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <span>🌐 tamreen.app</span>
                    </span>
                  </div>

                  {/* Update Profile Pill Button */}
                  <div>
                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 hover:bg-emerald-700 text-white text-[11px] font-bold border border-emerald-500/40 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>প্রোফাইল আপডেট করুন</span>
                      <Edit3 className="w-3 h-3 text-emerald-200" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side Golden Ribbon Badge */}
              <div className="shrink-0 pt-1">
                <div className="relative flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-lg ring-2 ring-amber-300/40 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#064E3B] flex items-center justify-center">
                      <Crown className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-md" />
                    </div>
                  </div>
                  {/* Ribbon Tails */}
                  <div className="flex -mt-2 gap-1">
                    <div className="w-3.5 h-4 bg-emerald-600 rounded-b-sm transform -rotate-12 shadow-xs"></div>
                    <div className="w-3.5 h-4 bg-emerald-600 rounded-b-sm transform rotate-12 shadow-xs"></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Floating 5 Smart Metrics Row */}
            <div className="bg-white dark:bg-[#0D172A] text-slate-800 dark:text-slate-100 rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-5 divide-x divide-slate-200/80 dark:divide-slate-800 text-center">
                
                {/* 1. সক্রিয় */}
                <div className="px-1 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    সক্রিয়
                  </span>
                  <div className="flex items-center justify-center">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-anek">
                    {toBengaliNumeral(streakDays)} দিন
                  </span>
                </div>

                {/* 2. সফলতা */}
                <div className="px-1 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    সফলতা
                  </span>
                  <div className="flex items-center justify-center">
                    <Award className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-anek">
                    {toBengaliNumeral(correctSolvedCount)} টি
                  </span>
                </div>

                {/* 3. গড় সঠিক */}
                <div className="px-1 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    গড় সঠিক
                  </span>
                  <div className="flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-anek">
                    {averageAccuracy}
                  </span>
                </div>

                {/* 4. সেরা পরীক্ষা */}
                <div className="px-1 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    সেরা পরীক্ষা
                  </span>
                  <div className="flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-blue-500 fill-blue-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-anek">
                    {toBengaliNumeral(bestExamsCount)} টি
                  </span>
                </div>

                {/* 5. মোট পরীক্ষা */}
                <div className="px-1 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    মোট পরীক্ষা
                  </span>
                  <div className="flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block font-anek">
                    {toBengaliNumeral(totalExamsGiven)} টি
                  </span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* VERTICAL LIST OF OPTIONS (নিচে নিচে সাজানো যেমন ব্যবহারকারী চেয়েছেন) */}
        {/* ১. আমার প্রোফাইল */}
        {/* ২. ড্যাশবোর্ড */}
        {/* ৩. সাপোর্ট ও সাহায্য */}
        {/* ৪. একাউন্ট সেটিংস */}
        {/* ৫. লগআউট */}
        {/* ৬. আমাদের সাথে যুক্ত থাকুন */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1">
          
          {/* ======================== 1. আমার প্রোফাইল ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
            <button
              onClick={() => setShowMyProfileSection(!showMyProfileSection)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white block">
                    আমার প্রোফাইল
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ব্যক্তিগত তথ্য, লক্ষ্য ও প্রোফাইল ব্যবস্থাপনা
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showMyProfileSection ? 'rotate-90 text-[#0b705c]' : ''}`} />
            </button>

            {/* My Profile Expanded Info Content */}
            {showMyProfileSection && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px]">নাম</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block truncate">{name || 'যুক্ত নেই'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 font-bold block text-[10px]">স্টুডেন্ট রোল নং</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm block font-mono">{userRollNumber}</span>
                      <button 
                        onClick={handleCopyRoll} 
                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 transition-colors cursor-pointer" 
                        title="রোল কপি করুন"
                        type="button"
                      >
                        {copiedRoll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-bold block text-[10px]">মোবাইল / ইমেইল</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block truncate">{phone || 'যুক্ত নেই'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl col-span-2 sm:col-span-3 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">টার্গেট পরীক্ষা ও লক্ষ্য</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm mt-0.5 block">{goalText}</span>
                    </div>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-[#0b705c] dark:text-emerald-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-200"
                    >
                      পরিবর্তন
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0b705c] hover:bg-[#095949] text-white font-black text-xs transition-all active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>প্রোফাইল সংশোধন করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================== 2. ড্যাশবোর্ড (Dashboard Options) ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
            <button
              onClick={() => setShowDashboardSection(!showDashboardSection)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white block">
                    ড্যাশবোর্ড
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    পরীক্ষা, কোর্স, বুকমার্ক, ভুলের খাতা ও অগ্রগতি
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0b705c] dark:text-emerald-400">
                  {showDashboardSection ? 'বন্ধ করুন' : 'সব দেখুন'}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showDashboardSection ? 'rotate-180 text-[#0b705c]' : ''}`} />
              </div>
            </button>

            {/* DASHBOARD 8 SMART CARDS GRID + PREMIUM BANNER */}
            {showDashboardSection && (
              <div className="p-4 sm:p-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in">
                
                {/* 8 Cards Grid matching reference image */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  
                  {/* 1. পরীক্ষা দিন */}
                  <button
                    onClick={() => {
                      if (onStartPractice) onStartPractice();
                      else onNavigateHome();
                    }}
                    className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 text-[#0b705c] dark:text-emerald-300 flex items-center justify-center">
                        <FileQuestion className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">পরীক্ষা দিন</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        মডেল টেস্ট দিন ও নিজেকে মূল্যায়ন করুন
                      </p>
                    </div>
                  </button>

                  {/* 2. কোর্স সমূহ */}
                  <button
                    onClick={onOpenCourses}
                    className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">কোর্স সমূহ</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        আপনার কোর্স দেখুন এবং পড়াশোনা করুন
                      </p>
                    </div>
                  </button>

                  {/* 3. বুকমার্ক */}
                  <button
                    onClick={() => setShowBookmarksModal(true)}
                    className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">বুকমার্ক</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        গুরুত্বপূর্ণ প্রশ্ন সংরক্ষণ করুন ({toBengaliNumeral(bookmarkedIds.length)})
                      </p>
                    </div>
                  </button>

                  {/* 4. পারফরম্যান্স */}
                  <button
                    onClick={() => setShowPerformanceModal(true)}
                    className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 hover:bg-purple-100/80 dark:hover:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/80 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">পারফরম্যান্স</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        গ্রাফ ও রিপোর্ট দেখে অগ্রগতি বিশ্লেষণ করুন
                      </p>
                    </div>
                  </button>

                  {/* 5. লক্ষ্য সেট করুন */}
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 hover:bg-teal-100/80 dark:hover:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/80 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                        <Target className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">লক্ষ্য সেট করুন</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        আপনার লক্ষ্য নির্ধারণ ও ট্র্যাক করুন
                      </p>
                    </div>
                  </button>

                  {/* 6. ভুলের খাতা */}
                  <button
                    onClick={() => setShowWrongBankModal(true)}
                    className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">ভুলের খাতা</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        ভুল প্রশ্নগুলো দেখুন ও পুনরায় অনুশীলন করুন
                      </p>
                    </div>
                  </button>

                  {/* 7. পরীক্ষার ইতিহাস */}
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 hover:bg-sky-100/80 dark:hover:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/80 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">পরীক্ষার ইতিহাস</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        আপনার দেয়া সকল পরীক্ষার রেকর্ড দেখুন
                      </p>
                    </div>
                  </button>

                  {/* 8. অর্জন সমূহ */}
                  <button
                    onClick={() => setShowAchievementsModal(true)}
                    className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">অর্জন সমূহ</h4>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        ব্যাজ ও পুরস্কার দেখুন আপনার সাফল্য গুলো
                      </p>
                    </div>
                  </button>

                </div>

                {/* PREMIUM MEMBERSHIP BANNER (Matching bottom banner in image) */}
                <div className="rounded-2xl bg-[#063B2F] text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-emerald-700/50">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
                      <Crown className="w-6 h-6 fill-amber-950" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                        প্রিমিয়াম মেম্বারশিপ সক্রিয়
                      </h4>
                      <p className="text-xs font-medium text-emerald-200/90 mt-0.5">
                        সবকিছু আনলিমিটেড অ্যাক্সেস উপভোগ করুন
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                  >
                    <span>সুবিধা দেখুন</span>
                    <ChevronRight className="w-4 h-4 text-amber-950" />
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* ======================== 3. সাপোর্ট ও সাহায্য ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white block">
                    সাপোর্ট ও সাহায্য
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    আমাদের সাথে যোগাযোগ করুন যেকোনো সমস্যার সমাধানে
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* ======================== 4. একাউন্ট সেটিংস ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white block">
                    একাউন্ট সেটিংস
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    হরকত, ফন্ট সাইজ, ডার্ক মোড ও অন্যান্য পছন্দসমূহ
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* ======================== 5. লগআউট ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
            {isRegistered ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors text-rose-600 dark:text-rose-400"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black block">
                      লগআউট করুন
                    </span>
                    <span className="text-xs font-semibold text-rose-500/80">
                      আপনার অ্যাকাউন্ট থেকে সাইন আউট করুন
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
                className="w-full p-4 flex items-center justify-between text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors text-[#0b705c] dark:text-emerald-400"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black block">
                      লগইন / নতুন একাউন্ট
                    </span>
                    <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                      অ্যাকাউন্টে প্রবেশ করে অগ্রগতি সংরক্ষণ করুন
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500" />
              </button>
            )}
          </div>

          {/* ======================== 6. আমাদের সাথে যুক্ত থাকুন ======================== */}
          <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                আমাদের সাথে যুক্ত থাকুন
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                সোশ্যাল মিডিয়ায় আমাদের ফলো করুন
              </p>
            </div>

            {/* Social Icons matching reference image */}
            <div className="flex items-center gap-2.5">
              {/* Facebook Page */}
              <a
                href="https://www.facebook.com/MadrasahNTRCA"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs"
                title="ফেসবুক পেজ - Madrasah NTRCA"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@madrashntrcapreparation?si=NAPblR31mH9nBbnq"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs"
                title="ইউটিউব চ্যানেল"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Telegram Channel */}
              <a
                href="https://t.me/mntrcap"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs"
                title="টেলিগ্রাম চ্যানেল"
              >
                <Send className="w-5 h-5" />
              </a>

              {/* WhatsApp Group */}
              <a
                href="https://chat.whatsapp.com/DdQxbgyCbhWGgHcSrxeDi6"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs"
                title="হোয়াটসঅ্যাপ গ্রুপ"
              >
                <MessageSquare className="w-5 h-5" />
              </a>

              {/* WhatsApp Direct */}
              <a
                href="https://wa.me/8801540072250"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950/60 hover:bg-green-100 text-green-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs"
                title="হোয়াটসঅ্যাপ চ্যাট (01540-072250)"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODALS & SUB-VIEWS */}
      {/* ========================================================================= */}

      {/* 1. EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  প্রোফাইল আপডেট
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  আপনার ছবি, নাম ও ফোন নম্বর পরিবর্তন করুন
                </p>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <div className="text-center space-y-3">
              <div className="relative inline-block">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-[#0b705c]/30 shadow-lg border-2 border-white dark:border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#0b705c] text-white flex items-center justify-center mx-auto ring-4 ring-[#0b705c]/30 shadow-lg font-black text-3xl">
                    <User className="w-10 h-10 text-amber-300" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2.5 bg-[#0b705c] hover:bg-[#085a4a] text-white rounded-full shadow-md cursor-pointer transition-transform active:scale-95 border-2 border-white dark:border-slate-800"
                  title="ছবি আপলোড করুন"
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

              {/* Preset Avatars */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  অথবা প্রিসেট ছবি বেছে নিন:
                </span>
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatar === url ? 'border-[#0b705c] scale-110 ring-2 ring-[#0b705c]/40' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: Jobayer Ahmed"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01779834999"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  বিজ্ঞপ্তি ও নোটিফিকেশন
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">আজকের আরবি মডেল টেস্ট উন্মুক্ত</span>
                  <span className="text-[10px] text-emerald-600">১০ মি. আগে</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  ১৮তম নিবন্ধন স্পেশাল ৫০ নম্বরের পূর্ণাঙ্গ মডেল টেস্ট এখন লাইভ। অংশগ্রহণ করে নিজের মেধা যাচাই করুন।
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-800 dark:text-blue-300">নতুন লেকচার শিট আপলোড</span>
                  <span className="text-[10px] text-blue-600">১ ঘণ্টা আগে</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  নাহু ও সরফ এর গুরুত্বপূর্ণ নিয়মাবলীর হ্যান্ডনোট কোর্স সেকশনে যোগ করা হয়েছে।
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300">ধারাবাহিক স্টাডি স্ট্রিক ৫ দিন!</span>
                  <span className="text-[10px] text-amber-600">গতকাল</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  মাশাআল্লাহ! আপনি গত ৫ দিন ধরে নিয়মিত প্রশ্ন অনুশীলন করছেন। এই ধারা বজায় রাখুন।
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 3. GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  টার্গেট পরীক্ষা নির্ধারণ করুন
                </h3>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার লক্ষ্য অনুযায়ী প্রশ্ন ও মডেল টেস্ট সুপারিশ করা হবে:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {TARGET_EXAM_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSaveGoal(preset)}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                    goalText === preset
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-[#0b705c] text-[#0b705c] dark:text-emerald-300 ring-2 ring-[#0b705c]/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{preset}</span>
                  {goalText === preset && <CheckCircle2 className="w-4 h-4 text-[#0b705c]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. BOOKMARKS MODAL */}
      {showBookmarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  সংরক্ষিত বুকমার্ক প্রশ্ন ({toBengaliNumeral(bookmarkedQuestions.length)}টি)
                </h3>
              </div>
              <button
                onClick={() => setShowBookmarksModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {bookmarkedQuestions.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">এখনও কোনো প্রশ্ন বুকমার্ক করা হয়নি</p>
                  <p className="text-xs text-slate-400">পরীক্ষা দেওয়ার সময় 🔖 আইকনে ক্লিক করে প্রশ্ন সংরক্ষণ করুন</p>
                </div>
              ) : (
                bookmarkedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-[#0b705c] dark:text-emerald-400">প্রশ্ন #{toBengaliNumeral(idx + 1)} • {q.subject}</span>
                      <button
                        onClick={() => {
                          toggleBookmarkId(String(q.id));
                          setSuccessMsg('বুকমার্ক সরানো হয়েছে');
                          setTimeout(() => setSuccessMsg(''), 1000);
                        }}
                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{q.question}</p>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      সঠিক উত্তর: {q[q.correct_answer as keyof Question] || q.option_a}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowBookmarksModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer shrink-0"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 5. WRONG ANSWER BANK MODAL */}
      {showWrongBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ভুলের খাতা ও দুর্বলতা
                </h3>
              </div>
              <button
                onClick={() => setShowWrongBankModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-300 leading-relaxed">
                💡 ভুলগুলোই আপনার সাফল্যের চাবিকাঠি! নিচের প্রশ্নগুলো আবার ঝালিয়ে নিন:
              </div>

              {wrongQuestions.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                    ভুল প্রশ্ন #{toBengaliNumeral(idx + 1)} • {q.subject}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{q.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✓ সঠিক: {q[q.correct_answer as keyof Question] || q.option_a}
                    </div>
                    {q.explanation && (
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 col-span-2 text-[11px]">
                        ব্যাখ্যা: {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowWrongBankModal(false);
                if (onStartPractice) onStartPractice('আরবি ব্যাকরণ (নাহু ও সরফ)');
              }}
              className="w-full py-2.5 rounded-xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs transition-all text-center cursor-pointer shrink-0 shadow-md"
            >
              ভুল প্রশ্নগুলো পুনরায় টেস্ট দিন
            </button>
          </div>
        </div>
      )}

      {/* 6. PERFORMANCE MODAL */}
      {showPerformanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  পারফরম্যান্স ও গ্রোথ রিপোর্ট
                </h3>
              </div>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">গড় নির্ভুলতা</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {realMetrics.totalQuestions > 0 ? `${toBengaliNumeral(realMetrics.overallAccuracy)}%` : '০০%'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl text-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">সমাধানকৃত প্রশ্ন</span>
                <span className="text-2xl font-black text-amber-500 mt-1 block">
                  {toBengaliNumeral(correctSolvedCount)}টি
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">বিষয়ভিত্তিক পারদর্শিতা</h4>
              {realMetrics.subjectStats && Object.keys(realMetrics.subjectStats).length > 0 ? (
                <div className="space-y-2 text-xs font-bold max-h-48 overflow-y-auto pr-1">
                  {Object.entries(realMetrics.subjectStats).map(([subj, stats]: [string, any]) => {
                    const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    return (
                      <div key={subj}>
                        <div className="flex justify-between mb-1 text-slate-800 dark:text-slate-200">
                          <span>{subj}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{toBengaliNumeral(acc)}% ({toBengaliNumeral(stats.correct)}/{toBengaliNumeral(stats.total)})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#0b705c] h-full rounded-full transition-all" style={{ width: `${acc}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  এখনো কোনো পরীক্ষা দেওয়া হয়নি। মডেল টেস্ট ও অনুশীলন সম্পন্ন করলে বিষয়ভিত্তিক গ্রাফ এখানে দেখা যাবে।
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPerformanceModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 7. EXAM HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  পরীক্ষার ইতিহাস ও রেকর্ড
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {savedExamHistory.length > 0 ? (
                savedExamHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="text-xs font-black text-slate-800 dark:text-white truncate">{item.examTitle || 'মডেল টেস্ট'}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.date ? new Date(item.date).toLocaleDateString('bn-BD') : 'সম্প্রতি'} • {toBengaliNumeral(item.totalQuestions || 0)}টি প্রশ্ন
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs rounded-xl shrink-0">
                      {toBengaliNumeral(item.score || 0)}/{toBengaliNumeral(item.totalQuestions || 0)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  এখনো কোনো পরীক্ষা সম্পন্ন হয়নি। যেকোনো মডেল টেস্ট সম্পন্ন করলে পরীক্ষার ইতিহাস এখানে যুক্ত হবে।
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 8. ACHIEVEMENTS MODAL */}
      {showAchievementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  অর্জন ও সাফল্যের ব্যাজ
                </h3>
              </div>
              <button
                onClick={() => setShowAchievementsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              <div className={`p-3 rounded-2xl text-center space-y-1 border ${streakDays >= 1 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${streakDays >= 1 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Flame className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">ধারাবাহিক শিক্ষার্থী</h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{streakDays >= 1 ? `টানা ${toBengaliNumeral(streakDays)} দিন স্ট্রিক` : 'অনুশীলন শুরু করুন'}</p>
              </div>

              <div className={`p-3 rounded-2xl text-center space-y-1 border ${totalExamsGiven >= 1 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${totalExamsGiven >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Award className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">মডেল টেস্ট মাস্টার</h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{totalExamsGiven >= 1 ? `${toBengaliNumeral(totalExamsGiven)}টি পরীক্ষা সম্পন্ন` : '১ম পরীক্ষা দিন'}</p>
              </div>

              <div className={`p-3 rounded-2xl text-center space-y-1 border ${realMetrics.overallAccuracy >= 80 && realMetrics.totalQuestions >= 10 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${realMetrics.overallAccuracy >= 80 && realMetrics.totalQuestions >= 10 ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Target className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">নির্ভুল সমাধানকারী</h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{realMetrics.overallAccuracy >= 80 ? `${toBengaliNumeral(realMetrics.overallAccuracy)}% একুরেসি` : '৮০% নির্ভুলতা অর্জন করুন'}</p>
              </div>

              <div className={`p-3 rounded-2xl text-center space-y-1 border ${isRegistered ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${isRegistered ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Crown className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">নিবন্ধিত শিক্ষার্থী</h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isRegistered ? 'অ্যাকাউন্ট ভেরিফাইড' : 'নিবন্ধন সম্পন্ন করুন'}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAchievementsModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 9. SUPPORT & HELP MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Headset className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  সাপোর্ট ও সাহায্য কেন্দ্র
                </h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              অ্যাপ ব্যবহারে বা কোর্সে ভর্তি সংক্রান্ত যেকোনো সহযোগিতার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন:
            </p>

            <div className="space-y-2.5">
              {/* 1. WhatsApp Support (01540-072250) */}
              <a
                href="https://wa.me/8801540072250?text=Hello%20Support"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">হোয়াটসঅ্যাপ সাপোর্ট</h5>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">01540-072250 (মেসেজ বা ভয়েস পাঠান)</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </a>

              {/* 2. WhatsApp Group */}
              <a
                href="https://chat.whatsapp.com/DdQxbgyCbhWGgHcSrxeDi6"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 border border-green-200 dark:border-green-800 rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপ</h5>
                    <p className="text-[11px] text-green-700 dark:text-green-400 font-bold">ব্যাচ ডিসকাশন ও ফ্রি প্রস্তুতি</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-green-600" />
              </a>

              {/* 3. Telegram Channel */}
              <a
                href="https://t.me/mntrcap"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">টেলিগ্রাম চ্যানেল</h5>
                    <p className="text-[11px] text-sky-700 dark:text-sky-400 font-bold">@mntrcap (পিডিএফ, রুটিন ও নোটিশ)</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-500" />
              </a>

              {/* 4. Facebook Official Page */}
              <a
                href="https://www.facebook.com/MadrasahNTRCA"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">ফেসবুক পেজ</h5>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold">Madrasah NTRCA</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </a>

              {/* 5. YouTube Channel */}
              <a
                href="https://youtube.com/@madrashntrcapreparation?si=NAPblR31mH9nBbnq"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-white">ইউটিউব চ্যানেল</h5>
                    <p className="text-[11px] text-red-700 dark:text-red-400 font-bold">ভিডিও ক্লাস ও দিকনির্দেশনা</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-600" />
              </a>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* 10. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  একাউন্ট ও ডিসপ্লে সেটিংস
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              {onToggleDarkMode && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">ডার্ক মোড</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">রাতের বেলায় চোখের সুরক্ষায়</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleDarkMode}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isDarkMode ? 'bg-[#0b705c]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {/* Harakat Toggle */}
              {onChangeShowHarakat && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Type className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">আরবি হরকত (যবর-যের-পেশ)</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">প্রশ্নে হরকত প্রদর্শন করুন</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onChangeShowHarakat(!showHarakat)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${showHarakat ? 'bg-[#0b705c]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showHarakat ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {/* Font Size Selector */}
              {onChangeFontSize && (
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">লেখার ফন্ট সাইজ</span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['normal', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => onChangeFontSize(size)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          fontSize === size
                            ? 'bg-[#0b705c] text-white border-[#0b705c]'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {size === 'normal' ? 'স্বাভাবিক' : size === 'medium' ? 'মাঝারি' : 'বড়'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0b705c] text-white text-xs font-black hover:bg-[#085a4a] cursor-pointer shadow-xs"
            >
              সেটিংস সেভ করুন
            </button>
          </div>
        </div>
      )}

      {/* 11. LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                লগআউট করতে চান?
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                লগআউট করলে পুনরায় আপনার মোবাইল ও পাসওয়ার্ড দিয়ে সাইন ইন করতে হবে।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বাতিল
              </button>
              <button
                onClick={handleSignOut}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                লগআউট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authInitialMode}
        onAuthSuccess={(profile) => {
          setName(profile.name || 'Jobayer Ahmed');
          setPhone(profile.phone || '01779834999');
          if (profile.avatar) setAvatar(profile.avatar);
          setIsRegistered(true);
          setShowAuthModal(false);
          setSuccessMsg('সফলভাবে লগইন হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 1500);
        }}
      />

      {/* Premium Package Enrollment Modal */}
      {showPremiumModal && (
        <PremiumEnrollmentModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          initialPackageId="quarterly"
          onSuccess={() => {
            setShowPremiumModal(false);
            setSuccessMsg('আপনার প্রিমিয়াম মেম্বারশিপ আবেদন সফল হয়েছে!');
            setTimeout(() => setSuccessMsg(''), 3000);
          }}
        />
      )}

    </div>
  );
};
