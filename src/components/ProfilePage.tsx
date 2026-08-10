import React, { useState, useRef } from 'react';
import { 
  User, Phone, Camera, Check, X, Sparkles, Trophy, Crown, Flame, 
  ChevronRight, BookOpen, Bookmark, AlertTriangle, RotateCcw, 
  LayoutGrid, Settings, Upload, ArrowLeft, BarChart3, HelpCircle, 
  CheckCircle2, Clock
} from 'lucide-react';
import { 
  saveUserProfile, getUserProfile, getStudentStats, 
  toBengaliNumeral, getUserGoal, saveUserGoal, getUserStreakDays, 
  getBookmarkedIds 
} from '../lib/utils';

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
  const currentProfile = getUserProfile();
  const [activeTab, setActiveTab] = useState<'menu' | 'edit_profile' | 'dashboard' | 'bookmarks' | 'wrong_bank' | 'archive' | 'vip_membership'>('menu');
  
  const [name, setName] = useState(currentProfile?.name || 'জোবায়ের আহমদ');
  const [phone, setPhone] = useState(currentProfile?.phone || '01700000000');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250');
  const [goalText, setGoalText] = useState(getUserGoal());

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentStats = getStudentStats();
  const streakDays = getUserStreakDays();
  const bookmarkedCount = getBookmarkedIds().length;

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
              VIP মেম্বারশিপ অ্যাক্টিভ
            </span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-amber-400/90 shadow-2xl border-2 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#0B132B] flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-amber-400/90">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 text-[#0B132B] rounded-full flex items-center justify-center shadow-lg border-2 border-[#095748]">
                <Crown className="w-4.5 h-4.5 fill-[#0B132B]" />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <span className="inline-block text-[10px] font-black px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-md tracking-wider uppercase font-anek">
                শিক্ষক নিবন্ধন পরীক্ষার্থী
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-tiro text-amber-300 tracking-wide truncate leading-tight drop-shadow-md">
                {name || 'জোবায়ের আহমদ'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-emerald-100/90 truncate">
                {phone ? `${phone} • tamreen.app` : 'jobayer.tamreen@gmail.com'}
              </p>
              <button
                onClick={() => setActiveTab('edit_profile')}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                <span>প্রোফাইল সংশোধন করুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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
                  <span className="text-base font-black block">পারফরম্যান্স ড্যাশবোর্ড</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">পরীক্ষার ফলাফল, পয়েন্ট ও নির্ভুলতা</span>
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

            {/* 7. Leaderboard */}
            <button
              onClick={onOpenLeaderboard}
              className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center justify-between cursor-pointer transition-all active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-[#0B132B] flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy className="w-5 h-5 fill-[#0B132B]" />
                </div>
                <span className="text-base font-black">জাতীয় মেধা তালিকা</span>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </button>

            {/* 8. Premium Membership */}
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

      </div>
    </div>
  );
};
