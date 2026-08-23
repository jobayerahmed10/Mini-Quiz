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
  BookOpen
} from 'lucide-react';
import { AtTamreenLogo } from './AtTamreenLogo';
import { 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseResetPassword, 
} from '../lib/supabase';
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
  
  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [fullName, setFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password / Password Reset States
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Feedback & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPasswordResetMode = mode === 'password-reset' || mode === 'forgot_password' || mode === 'password_reset';

  // Sync initial mode
  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetSent(false);
  }, [initialMode]);

  // Clear messages on mode switch
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetSent(false);
  };

  // --------------------------------------------------------------------------
  // LOGIN SUBMISSION
  // --------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('মোবাইল নম্বর বা ইমেইল প্রদান করুন।');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsLoading(true);

    try {
      const res = await supabaseSignIn(cleanIdentifier, loginPassword);

      if (!res.success) {
        setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
        return;
      }

      // Success
      const user = res.user;
      const userMeta = user?.user_metadata || {};
      const profile = user?.profile || {};

      const name = profile.full_name || userMeta.full_name || 'শিক্ষার্থী';
      const phone = profile.phone || userMeta.phone || (cleanIdentifier.includes('@') ? '' : cleanIdentifier);
      const avatar = profile.avatar_url || userMeta.avatar_url || '';
      const email = profile.email || userMeta.email || (cleanIdentifier.includes('@') ? cleanIdentifier : '');

      const saved = saveUserProfile(name, phone, avatar, true, email);
      window.dispatchEvent(new Event('tamreen_profile_updated'));
      window.dispatchEvent(new Event('tamreen_auth_status_changed'));
      setSuccessMessage('স্বাগতম! আপনি সফলভাবে লগইন করেছেন।');

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

  // --------------------------------------------------------------------------
  // REGISTER SUBMISSION
  // --------------------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = fullName.trim();
    const cleanPhone = registerPhone.trim();
    let cleanEmail = registerEmail.trim().toLowerCase();

    // Validations
    if (!cleanName) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }
    if (!cleanPhone && !cleanEmail) {
      setErrorMessage('অনুগ্রহ করে মোবাইল নম্বর অথবা ইমেইল ঠিকানা দিন।');
      return;
    }
    if (cleanPhone && cleanPhone.length < 6) {
      setErrorMessage('সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।');
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('সঠিক ইমেইল ঠিকানা প্রদান করুন (যেমন: example@gmail.com)।');
      return;
    }
    
    if (!registerPassword || registerPassword.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (confirmPassword && registerPassword !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('অ্যাকাউন্ট তৈরি করতে শর্তাবলীতে সম্মতি দিন।');
      return;
    }

    setIsLoading(true);

    try {
      const res = await supabaseSignUp(cleanName, cleanEmail || cleanPhone, cleanPhone || '', registerPassword);

      if (!res.success) {
        setErrorMessage(res.error || 'অ্যাকাউন্ট তৈরি সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
        return;
      }

      const saved = saveUserProfile(cleanName, cleanPhone, '', true, cleanEmail || (res.user?.email ?? ''));
      window.dispatchEvent(new Event('tamreen_profile_updated'));
      window.dispatchEvent(new Event('tamreen_auth_status_changed'));

      if (res.needsEmailConfirmation) {
        setSuccessMessage('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে।');
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

  // --------------------------------------------------------------------------
  // PASSWORD RESET SUBMISSION
  // --------------------------------------------------------------------------
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('সঠিক ইমেইল ঠিকানা প্রদান করুন।');
      return;
    }

    setIsLoading(true);

    try {
      const res = await supabaseResetPassword(cleanEmail);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'পাসওয়ার্ড রিসেট লিংক পাঠানো সম্ভব হয়নি।');
        return;
      }

      setResetSent(true);
      setSuccessMessage('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'একটি ত্রুটি ঘটেছে।');
    }
  };

  return (
    <div 
      id="auth-container-card"
      className={`w-full max-w-[460px] bg-[#FAFBF9] dark:bg-[#091224] rounded-[32px] shadow-2xl border border-emerald-900/15 dark:border-emerald-500/25 overflow-hidden relative text-slate-800 dark:text-slate-100 transition-all ${className}`}
    >
      {/* Top Islamic Geometric Accent Ribbon */}
      <div className="h-2.5 bg-gradient-to-r from-[#046A38] via-[#EAB308] to-[#07532B] w-full" />

      <div className="p-5 sm:p-7 space-y-5">

        {/* Top Header Row with Logo & Close Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-[#046A38] to-[#064e29] shadow-md ring-2 ring-[#EAB308]/40 inline-flex items-center justify-center">
              <AtTamreenLogo className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#046A38] dark:text-emerald-400 font-tiro leading-tight">
                আত-তামরীন একাডেমি
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#EAB308]" />
                <span>প্রস্তুতি হোক আরও স্মার্ট</span>
              </p>
            </div>
          </div>

          {/* Optional Cancel/Close Button */}
          {onCancel && (
            <button
              id="auth-container-cancel-btn"
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer text-sm font-black"
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>
          )}
        </div>

        {/* ================================================================== */}
        {/* TWO PROMINENT TOP TOGGLE BUTTONS: LOGIN & REGISTRATION             */}
        {/* ================================================================== */}
        {!isPasswordResetMode && (
          <div 
            id="auth-mode-segmented-control"
            className="grid grid-cols-2 p-1.5 bg-emerald-950/10 dark:bg-emerald-950/40 rounded-2xl border border-emerald-800/20 dark:border-emerald-600/30 gap-1.5 shadow-inner"
          >
            {/* Button 1: Login */}
            <button
              id="auth-tab-login-btn"
              type="button"
              onClick={() => switchMode('login')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#046A38] text-white shadow-md shadow-emerald-950/20 scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Lock className={`w-4 h-4 ${mode === 'login' ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>লগইন</span>
            </button>

            {/* Button 2: Registration */}
            <button
              id="auth-tab-register-btn"
              type="button"
              onClick={() => switchMode('register')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#046A38] text-white shadow-md shadow-emerald-950/20 scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${mode === 'register' ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>রেজিস্ট্রেশন</span>
            </button>
          </div>
        )}

        {/* Back button if in Password Reset mode */}
        {isPasswordResetMode && (
          <div className="flex items-center justify-between pb-1">
            <button
              id="auth-container-back-to-login"
              type="button"
              onClick={() => switchMode('login')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#046A38] dark:text-emerald-400 hover:underline p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>লগইনে ফিরে যান</span>
            </button>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              পাসওয়ার্ড রিসেট
            </span>
          </div>
        )}

        {/* Feedback Banners */}
        {errorMessage && (
          <div 
            id="auth-container-error-banner"
            className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div 
            id="auth-container-success-banner"
            className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-[#046A38] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 1: ISLAMIC STYLE LOGIN FORM                                  */}
        {/* ================================================================== */}
        {mode === 'login' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>অ্যাকাউন্টে প্রবেশ করুন</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিয়ে সরাসরি লগইন করুন
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Mobile / Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর অথবা ইমেইল <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    id="container-login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX অথবা email@gmail.com"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <button
                    id="container-forgot-link"
                    type="button"
                    onClick={() => switchMode('password-reset')}
                    className="text-[11px] font-bold text-[#046A38] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    id="container-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                  />
                  <button
                    id="container-login-toggle-eye"
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="container-login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#046A38] hover:bg-[#03522b] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <span>লগইন করুন</span>
                )}
              </button>
            </form>

            {/* Quick Switch Helper */}
            <div className="pt-2 text-center border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                নতুন শিক্ষার্থী?{' '}
                <button
                  id="container-switch-to-register"
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-black text-[#046A38] dark:text-[#EAB308] hover:underline cursor-pointer ml-1"
                >
                  এখনই রেজিস্ট্রেশন করুন
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: ISLAMIC STYLE REGISTRATION FORM (NO OTP REQUIRED)         */}
        {/* ================================================================== */}
        {mode === 'register' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>নতুন অ্যাকাউন্ট তৈরি করুন</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                মোবাইল নম্বর ও তথ্য দিন, কোনো কোড ছাড়াই সাথে সাথে আইডি তৈরি হবে
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    id="container-register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="যেমন: মোঃ আব্দুর রহমান"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    id="container-register-phone"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email Address (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  ইমেইল ঠিকানা <span className="text-slate-400 text-[10px] font-normal">(ঐচ্ছিক)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    id="container-register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="student@example.com"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <input
                      id="container-register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      disabled={isLoading}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] transition-all shadow-2xs disabled:opacity-60"
                    />
                    <button
                      id="container-register-toggle-eye"
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    নিশ্চিত করুন <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <input
                      id="container-register-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড পুনরায়"
                      disabled={isLoading}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] transition-all shadow-2xs disabled:opacity-60"
                    />
                    <button
                      id="container-confirm-toggle-eye"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  id="container-terms-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 text-[#046A38] rounded-md border-slate-300 dark:border-slate-700 focus:ring-[#046A38] cursor-pointer"
                />
                <label htmlFor="container-terms-checkbox" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                  আমি আত-তামরীন একাডেমির <span className="text-[#046A38] dark:text-emerald-400 underline">শর্তাবলী</span> মেনে নিচ্ছি।
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="container-register-submit-btn"
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#046A38] hover:bg-[#03522b] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                )}
              </button>
            </form>

            {/* Quick Switch to Login */}
            <div className="pt-2 text-center border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                আগেই অ্যাকাউন্ট আছে?{' '}
                <button
                  id="container-switch-to-login"
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-black text-[#046A38] dark:text-[#EAB308] hover:underline cursor-pointer ml-1"
                >
                  লগইন করুন
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 3: PASSWORD RECOVERY / RESET VIA EMAIL                        */}
        {/* ================================================================== */}
        {isPasswordResetMode && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#046A38] dark:text-emerald-400" />
                <span>পাসওয়ার্ড রিসেট করুন</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                আপনার অ্যাকাউন্টে ব্যবহৃত ইমেইল ঠিকানা দিন। আমরা পাসওয়ার্ড রিসেট করার একটি নিরাপদ লিংক পাঠাবো।
              </p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    নিবন্ধিত ইমেইল ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      id="container-forgot-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="যেমন: student@example.com"
                      disabled={isLoading}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#046A38] dark:focus:ring-emerald-500 transition-all shadow-2xs disabled:opacity-60"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    নিবন্ধিত ইমেইলে রিসেট নির্দেশনা ও ভেরিফিকেশন লিংক পৌঁছে যাবে।
                  </p>
                </div>

                <button
                  id="container-forgot-submit-btn"
                  type="submit"
                  disabled={isLoading || !resetEmail.trim()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#046A38] hover:bg-[#03522b] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>রিসেট লিংক পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-amber-300" />
                      <span>ইমেইলে রিসেট লিংক পাঠান</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2.5 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-[#046A38] dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                  রিসেট লিংক সফলভাবে পাঠানো হয়েছে!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <span className="font-black text-slate-900 dark:text-white underline">{resetEmail}</span> ঠিকানায় পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 underline cursor-pointer"
                  >
                    ভিন্ন ইমেইল দিয়ে চেষ্টা করুন
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 text-xs">
              <button
                id="container-forgot-back-btn"
                type="button"
                onClick={() => switchMode('login')}
                className="font-black text-[#046A38] dark:text-[#EAB308] hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইন করুন</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-bold text-slate-600 dark:text-slate-400 hover:text-[#046A38] dark:hover:text-emerald-400 cursor-pointer"
              >
                নতুন অ্যাকাউন্ট তৈরি করুন →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
