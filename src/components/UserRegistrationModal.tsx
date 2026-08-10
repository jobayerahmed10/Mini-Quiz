import React, { useState, useRef } from 'react';
import { User, Phone, CheckCircle2, ShieldCheck, X, Camera, Upload } from 'lucide-react';
import { saveUserProfile, UserProfile } from '../lib/utils';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (profile: UserProfile) => void;
  title?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
];

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  title = 'পরীক্ষায় অংশগ্রহণ করতে তথ্য দিন',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const saved = saveUserProfile(name, phone, avatar);
    setErrorMsg('');
    onSaveSuccess(saved);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Avatar Upload / Circle */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile Preview"
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-[#0B132B]/30 shadow-md border-2 border-white dark:border-slate-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#0B132B]/10 dark:bg-slate-800 text-[#0B132B] dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner border border-[#0B132B]/20">
                <User className="w-9 h-9" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[#0B132B] text-white rounded-full shadow-md cursor-pointer hover:bg-[#121E36] transition-transform active:scale-95 border-2 border-white dark:border-slate-800"
              title="ছবি নির্বাচন করুন"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500">ছবি বা অবয়ব পছন্দ করুন:</span>
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(url)}
                className={`w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer ${
                  avatar === url ? 'border-[#0B132B] scale-110 ring-2 ring-[#0B132B]/40' : 'border-transparent'
                }`}
              >
                <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-[#0B132B] dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            পরীক্ষার ফলাফল ও মেধা তালিকায় আপনার ছবি ও নাম প্রদর্শন করার জন্য তথ্য প্রদান করুন।
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0B132B]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-slate-700 text-[11px] font-bold text-[#0B132B] dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>আপনার তথ্য ১০০% সুরক্ষিত থাকবে।</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#0B132B] hover:bg-[#121E36] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>সেভ করুন ও পরীক্ষা দিন</span>
          </button>
        </form>
      </div>
    </div>
  );
};

