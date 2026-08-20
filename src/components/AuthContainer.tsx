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

export type AuthMode = 'login' | 'register' | 'forgot_password';

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

  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Feedback & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    
    // Auto-generate synthesized email if user registered with phone only
    if (!cleanEmail && cleanPhone) {
      const sanitizedPhone = cleanPhone.replace(/[^0-9]/g, '');
      cleanEmail = `${sanitizedPhone || 'student'}@attamreen.academy`;
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
      const res = await supabaseSignUp(cleanName, cleanEmail, cleanPhone || '', registerPassword);

      if (!res.success) {
        setErrorMessage(res.error || 'অ্যাকাউন্ট তৈরি সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
        setIsLoading(false);
        return;
      }

      const saved = saveUserProfile(cleanName, cleanPhone, '', true, cleanEmail);
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
      className={`w-full max-w-[440px] bg-[#F8FAF9] dark:bg-[#070D1E] rounded-[32px] shadow-2xl border border-emerald-900/10 dark:border-emerald-500/20 overflow-hidden relative text-slate-800 dark:text-slate-100 transition-all ${className}`}
    >
      {/* Top Islamic Geometric / Subtle Accent Ribbon */}
      <div className="h-2 bg-gradient-to-r from-[#07532B] via-[#EAB308] to-[#046A38] w-full" />

      <div className="p-6 sm:p-8 space-y-6">

        {/* Top Header Row with Navigation */}
        <div className="flex items-center justify-between">
          {mode !== 'login' ? (
            <button
              id="auth-container-back-to-login"
              type="button"
              onClick={() => switchMode('login')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#07532B] dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 p-2 -ml-2 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>লগইনে ফিরুন</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#07532B] dark:bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                নিরাপদ অথেনটিকেশন
              </span>
            </div>
          )}

          {/* Optional Cancel/Close Button */}
          {onCancel && (
            <button
              id="auth-container-cancel-btn"
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>
          )}
        </div>

        {/* Brand Logo & Hero Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2.5 rounded-[22px] bg-gradient-to-br from-[#07532B] to-[#046A38] shadow-md ring-2 ring-[#EAB308]/40 inline-flex items-center justify-center">
              <AtTamreenLogo className="w-12 h-12" />
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#07532B] dark:text-emerald-400 font-tiro tracking-wide">
              আত-তামরীন একাডেমি
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
              <span>প্রস্তুতি হোক আরও স্মার্ট</span>
            </p>
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div 
            id="auth-container-error-banner"
            className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div 
            id="auth-container-success-banner"
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-[#07532B] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 1: ISLAMIC STYLE LOGIN                                      */}
        {/* ================================================================== */}
        {mode === 'login' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>স্বাগতম!</span>
                <span className="text-base">👋</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                আপনার অ্যাকাউন্টে প্রবেশ করতে লগইন করুন
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Mobile / Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর / ইমেইল <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="container-login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="017XXXXXXXX বা user@email.com"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <button
                    id="container-forgot-link"
                    type="button"
                    onClick={() => switchMode('forgot_password')}
                    className="text-[11px] font-bold text-[#07532B] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="container-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
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
                className="w-full py-3.5 px-4 rounded-2xl bg-[#07532B] hover:bg-[#064423] dark:bg-[#046A38] dark:hover:bg-[#05572e] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

            {/* Switch to Register */}
            <div className="pt-2 text-center border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                অ্যাকাউন্ট নেই?{' '}
                <button
                  id="container-switch-to-register"
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-black text-[#07532B] dark:text-[#EAB308] hover:underline cursor-pointer ml-1"
                >
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: ISLAMIC STYLE CREATE ACCOUNT                              */}
        {/* ================================================================== */}
        {mode === 'register' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                নতুন অ্যাকাউন্ট তৈরি করুন
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                সঠিক তথ্য প্রদান করে অ্যাকাউন্ট তৈরি সম্পন্ন করুন
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="container-register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="মোঃ আব্দুর রহমান"
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">অথবা ইমেইল</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="container-register-phone"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    ইমেইল ঠিকানা <span className="text-slate-400 text-[10px] font-bold">(ঐচ্ছিক)</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="container-register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="student@example.com"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="container-register-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="গোপন পাসওয়ার্ড দিন"
                    disabled={isLoading}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                  <button
                    id="container-register-toggle-eye"
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="container-register-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    disabled={isLoading}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                  />
                  <button
                    id="container-confirm-toggle-eye"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="container-terms-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#07532B] rounded-md border-slate-300 dark:border-slate-700 focus:ring-[#07532B] cursor-pointer"
                />
                <label htmlFor="container-terms-checkbox" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                  আমি আত-তামরীন একাডেমির <span className="text-[#07532B] dark:text-emerald-400 underline">শর্তাবলী</span> ও <span className="text-[#07532B] dark:text-emerald-400 underline">গোপনীয়তা নীতি</span> মেনে নিচ্ছি।
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="container-register-submit-btn"
                type="submit"
                disabled={isLoading || !agreeTerms}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#07532B] hover:bg-[#064423] dark:bg-[#046A38] dark:hover:bg-[#05572e] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <span>অ্যাকাউন্ট তৈরি করুন</span>
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="pt-2 text-center border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                আগেই অ্যাকাউন্ট আছে?{' '}
                <button
                  id="container-switch-to-login"
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-black text-[#07532B] dark:text-[#EAB308] hover:underline cursor-pointer ml-1"
                >
                  লগইন করুন
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 3: PASSWORD RECOVERY                                          */}
        {/* ================================================================== */}
        {mode === 'forgot_password' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                পাসওয়ার্ড পুনরুদ্ধার
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                আপনার নিবন্ধিত ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাবো
              </p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    ইমেইল ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="container-forgot-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      disabled={isLoading}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#07532B] dark:focus:ring-emerald-500 transition-all shadow-xs disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  id="container-forgot-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#07532B] hover:bg-[#064423] dark:bg-[#046A38] text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-900/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>লিংক পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <span>রিসেট লিংক পাঠান</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#07532B] dark:text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                  ইমেইল সফলভাবে পাঠানো হয়েছে!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {resetEmail} ঠিকানায় রিসেট লিংক পাঠানো হয়েছে। লিংকটিতে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
                </p>
              </div>
            )}

            <div className="pt-2 text-center border-t border-slate-200/80 dark:border-slate-800">
              <button
                id="container-forgot-back-btn"
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-black text-[#07532B] dark:text-[#EAB308] hover:underline cursor-pointer"
              >
                ← লগইন পেজে ফিরুন
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
