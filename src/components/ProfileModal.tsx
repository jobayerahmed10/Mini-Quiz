import React, { useState, useRef } from 'react';
import { User, Phone, Camera, Check, X, ShieldCheck, Sparkles, Trophy, Award, BarChart3, Settings, Upload } from 'lucide-react';
import { saveUserProfile, UserProfile, getUserProfile, getStudentStats, toBengaliNumeral } from '../lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
  onOpenFontSettings?: () => void;
  onOpenDashboard?: () => void;
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
  onOpenFontSettings,
  onOpenDashboard,
}) => {
  const currentProfile = getUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentProfile?.name || '');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentStats = getStudentStats();

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে নাম প্রদান করুন');
      return;
    }
    saveUserProfile(name, phone, avatar);
    setErrorMsg('');
    setSuccessMsg('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    setIsEditing(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header Title */}
        <div className="text-center">
          <h3 className="text-xl font-black text-[#0B132B] dark:text-white flex items-center justify-center gap-2">
            <span>ব্যবহারকারীর প্রোফাইল</span>
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
            শিক্ষক নিবন্ধন প্রস্তুতি প্রোফাইল ড্যাশবোর্ড
          </p>
        </div>

        {/* Feedback Alert Messages */}
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

        {/* User Photo / Avatar Box */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            {avatar ? (
              <img
                src={avatar}
                alt={name || 'User Avatar'}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mx-auto ring-4 ring-[#0b705c]/30 shadow-lg border-2 border-white dark:border-slate-800"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#0b705c] to-[#0B132B] text-amber-300 flex items-center justify-center mx-auto ring-4 ring-[#0b705c]/30 shadow-lg font-black text-3xl">
                <User className="w-12 h-12" />
              </div>
            )}

            {/* Camera Edit Badge */}
            <button
              onClick={() => {
                setIsEditing(true);
                fileInputRef.current?.click();
              }}
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

          {/* Quick Preset Avatar Chooser if editing */}
          {isEditing && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">
                অথবা অবয়ব ছবি নির্বাচন করুন:
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
          )}
        </div>

        {/* Profile Info Details or Edit Form */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-center sm:text-left">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">নাম:</span>
                <span className="text-sm font-black text-[#0B132B] dark:text-white">
                  {name || 'নাম যোগ করা হয়নি'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">মোবাইল নম্বর:</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {phone || 'মোবাইল নম্বর যোগ হয়নি'}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-2xl">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400 block">
                  {toBengaliNumeral(studentStats.totalQuizzesTaken || 0)}টি
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">পরীক্ষা সম্পন্ন</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-2xl">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">
                  {toBengaliNumeral(studentStats.accuracy || 0)}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">নির্ভুলতা</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-2.5 rounded-2xl">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 block">
                  {toBengaliNumeral(studentStats.totalScore || 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">মোট পয়েন্ট</span>
              </div>
            </div>

            {/* Quick Navigation Menu List */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-[#0b705c]" />
                <span>প্রোফাইল তথ্য এডিট করুন</span>
              </button>

              {onOpenLeaderboard && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLeaderboard();
                  }}
                  className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>জাতীয় মেধা তালিকা (Leaderboard)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-1">
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
                মোবাইল নম্বর <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 01700000000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0b705c]"
                  required
                />
              </div>
            </div>

            {/* Upload image button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#0b705c] dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>মোবাইল/কম্পিউটার থেকে ছবি গ্যালারি খুলুন</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                বাতিল করুন
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
        )}

      </div>
    </div>
  );
};
