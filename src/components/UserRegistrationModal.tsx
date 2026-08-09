import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { saveUserProfile, UserProfile } from '../lib/utils';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (profile: UserProfile) => void;
  title?: string;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  title = 'পরীক্ষায় অংশগ্রহণ করতে তথ্য দিন',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMsg('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন');
      return;
    }

    const saved = saveUserProfile(name, phone);
    setErrorMsg('');
    onSaveSuccess(saved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-[#0b705c]/10 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner border border-[#0b705c]/20">
          <User className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="text-center space-y-1.5">
          <h3 className="text-xl font-black text-[#0B132B] dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            পরীক্ষার ফলাফল ও মেধা তালিকায় আপনার নাম প্রদর্শনের জন্য নাম ও নম্বর সেভ করুন।
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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

          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-[#0b705c] dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>আপনার তথ্য ১০০% সুরক্ষিত থাকবে।</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>সেভ করুন ও পরীক্ষা দিন</span>
          </button>
        </form>
      </div>
    </div>
  );
};
