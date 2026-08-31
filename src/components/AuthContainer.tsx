import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  BookOpen,
  X
} from 'lucide-react';
import { AtTamreenLogo } from './AtTamreenLogo';
import { customPhoneLogin, customPhoneRegister } from '../lib/supabase';
import { saveUserProfile, UserProfile } from '../lib/utils';

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'password-reset' | 'password_reset';

export interface AuthContainerProps {
  initialMode?: AuthMode;
  onSuccess?: (profile: UserProfile) => void;
  onCancel?: () => void;
  isStandalone?: boolean;
  className?: string;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialMode = 'login',
  onSuccess,
  onCancel,
  isStandalone = false,
  className = '',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Unified Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial mode
  useEffect(() => {
    setMode(initialMode === 'register' ? 'register' : 'login');
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    // Reset password on switch
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      setErrorMessage('সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!password) {
      setErrorMessage('পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await customPhoneLogin(cleanPhone, password);
      } else {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim();
        if (!cleanName) {
          setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
          setIsLoading(false);
          return;
        }
        res = await customPhoneRegister(cleanName, cleanPhone, cleanEmail, password);
      }
      
      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'একটি ত্রুটি ঘটেছে। দয়া করে পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
        return;
      }

      // Success
      const u = res.user;
      const saved = saveUserProfile(
        u.full_name || fullName || 'শিক্ষার্থী',
        u.phone || cleanPhone,
        u.avatar_url || '',
        true,
        u.email || email
      );
      
      // Update local storage with roll number if available
      if (u.roll_number || u.student_id) {
         try {
           const existingRaw = localStorage.getItem('tamreen_user_profile');
           let parsed = existingRaw ? JSON.parse(existingRaw) : {};
           parsed = { ...parsed, roll_number: u.roll_number || u.student_id };
           localStorage.setItem('tamreen_user_profile', JSON.stringify(parsed));
         } catch(e) {}
      }

      window.dispatchEvent(new Event('tamreen_profile_updated'));
      window.dispatchEvent(new Event('tamreen_auth_status_changed'));
      
      if (mode === 'login') {
        setSuccessMessage('স্বাগতম! আপনি সফলভাবে লগইন করেছেন।');
      } else {
        setSuccessMessage('অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।');
      }
      
      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) {
          onSuccess(saved);
        }
      }, 800);
      
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'একটি ত্রুটি ঘটেছে। দয়া করে পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-3xl relative ${className}`}>
      {/* Close Button */}
      {onCancel && !isStandalone && (
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Left Banner Section */}
      <div className="hidden md:flex md:w-5/12 bg-emerald-900 p-8 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <AtTamreenLogo className="w-10 h-10 text-white mb-6" />
          <h2 className="text-3xl font-black text-white mb-4 leading-snug">
            আপনার প্রস্তুতি <br />
            <span className="text-emerald-300">আরও সহজ ও স্মার্ট</span>
          </h2>
          <p className="text-emerald-100/80 font-medium text-sm leading-relaxed mb-8 max-w-xs">
            সহজেই লগইন করুন এবং আপনার পড়াশোনা ট্র্যাক করুন। আগের একাউন্ট থাকলে সরাসরি লগইন হয়ে যাবে।
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-100/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>
              <span>নিরাপদ ও সহজ লগইন</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-emerald-300" />
              </div>
              <span>পরীক্ষার ফলাফল সংরক্ষণ</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <span>সরাসরি রোল নম্বর তৈরি</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12">
          <p className="text-emerald-400/60 font-medium text-xs">
            © {new Date().getFullYear()} আত-তামরীন. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-10 flex flex-col justify-center relative bg-slate-50 dark:bg-slate-900/50">
        
        {/* Mobile Header / Logo */}
        <div className="md:hidden flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
            <AtTamreenLogo className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Top Toggle Tabs */}
          <div className="flex p-1 mb-8 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl relative">
            <button
              onClick={() => switchMode('login')}
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                mode === 'login' 
                  ? 'bg-white dark:bg-slate-700 text-[#046A38] dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              লগইন
            </button>
            <button
              onClick={() => switchMode('register')}
              type="button"
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                mode === 'register' 
                  ? 'bg-white dark:bg-slate-700 text-[#046A38] dark:text-emerald-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>

          {/* Header Texts */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
              {mode === 'login' ? 'অ্যাকাউন্টে প্রবেশ করুন' : 'নতুন একাউন্ট তৈরি করুন'}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {mode === 'login' 
                ? 'লগইন করতে আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিন।' 
                : 'নতুন একাউন্ট খুলতে সঠিক তথ্য দিয়ে ফর্মটি পূরণ করুন।'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration specific fields */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    disabled={isLoading}
                    required={mode === 'register'}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Common for both) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Email (Registration only) */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>ইমেইল ঠিকানা</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">ঐচ্ছিক</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="আপনার ইমেইল (যদি থাকে)"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Password Field (Common for both) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' : 'আপনার পাসওয়ার্ড দিন'}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold p-3.5 rounded-xl flex gap-2 items-start animate-in fade-in zoom-in-95 duration-200 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold p-3.5 rounded-xl flex gap-2 items-start animate-in fade-in zoom-in-95 duration-200 mt-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative mt-4 bg-[#046A38] hover:bg-[#03552d] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>অপেক্ষা করুন...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
            
          </form>

        </div>
      </div>
    </div>
  );
};
