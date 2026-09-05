import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  HelpCircle, 
  XCircle, 
  CheckCircle2, 
  RotateCcw, 
  Bot, 
  User, 
  Rocket, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Award,
  Trophy,
  FileText
} from 'lucide-react';
import { toBengaliNumeral, getUserProfile, saveUserProfile, isExamCompleted } from '../lib/utils';
import { fetchUserCompletedExamsFromSupabase } from '../lib/supabase';

export interface SharedExamEntranceCardProps {
  examId?: string;
  title: string;
  subject?: string;
  topic?: string;
  category?: string;
  instructor?: string;
  institution?: string;
  timeMinutes?: number;
  questionCount?: number;
  negativeMark?: string | number;
  onStartExam: (studentName: string) => void;
  onClose?: () => void;
  onReviewAnswers?: () => void;
  onOpenLeaderboard?: () => void;
  isStandalone?: boolean;
}

export const SharedExamEntranceCard: React.FC<SharedExamEntranceCardProps> = ({
  examId,
  title,
  subject = 'সাধারণ ও মাদ্রাসা কারিকুলাম',
  topic,
  category = 'BENGALI LESSON',
  instructor = 'প্রভাষক আরবি',
  institution = 'আত-তামরীন একাডেমি',
  timeMinutes = 5,
  questionCount = 20,
  negativeMark = '-০.২৫',
  onStartExam,
  onClose,
  onReviewAnswers,
  onOpenLeaderboard,
  isStandalone = false,
}) => {
  const existingProfile = getUserProfile();
  const [studentName, setStudentName] = useState<string>(existingProfile?.name || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(() => isExamCompleted(examId, title));

  // Sync completed exam status from Supabase and Server API
  useEffect(() => {
    let isMounted = true;
    const checkCompletion = () => {
      setHasCompleted(isExamCompleted(examId, title));

      fetchUserCompletedExamsFromSupabase().then((completedList) => {
        if (!isMounted) return;
        const targetId = (examId || '').trim().toLowerCase();
        const targetTitle = (title || '').trim().toLowerCase();
        const isDone = completedList.some((id) => {
          const cleanId = String(id || '').trim().toLowerCase();
          return cleanId === targetId || cleanId === targetTitle || (targetId && cleanId.includes(targetId));
        });
        if (isDone) {
          setHasCompleted(true);
        }
      });
    };

    checkCompletion();

    window.addEventListener('tamreen_exam_completed', checkCompletion);
    window.addEventListener('tamreen_profile_updated', checkCompletion);
    window.addEventListener('tamreen_auth_status_changed', checkCompletion);
    window.addEventListener('storage', checkCompletion);
    window.addEventListener('focus', checkCompletion);

    return () => {
      isMounted = false;
      window.removeEventListener('tamreen_exam_completed', checkCompletion);
      window.removeEventListener('tamreen_profile_updated', checkCompletion);
      window.removeEventListener('tamreen_auth_status_changed', checkCompletion);
      window.removeEventListener('storage', checkCompletion);
      window.removeEventListener('focus', checkCompletion);
    };
  }, [examId, title]);

  // Sync existing profile name if available
  useEffect(() => {
    if (existingProfile?.name && !studentName) {
      setStudentName(existingProfile.name);
    }
  }, [existingProfile?.name]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCompleted) {
      if (onReviewAnswers) {
        onReviewAnswers();
      }
      return;
    }
    const cleanName = studentName.trim();
    if (!cleanName) {
      setErrorMessage('পরীক্ষা শুরু করতে অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    setErrorMessage(null);
    // Save student name so it automatically appears on the Leaderboard and Result page
    saveUserProfile(
      cleanName, 
      existingProfile?.phone || '', 
      existingProfile?.avatar || '', 
      existingProfile?.isRegistered || false,
      existingProfile?.email || ''
    );

    onStartExam(cleanName);
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.origin + window.location.pathname);
    if (examId) {
      url.searchParams.set('examId', examId);
    } else if (title) {
      url.searchParams.set('exam', title);
    }
    const shareText = `📝 ${title}\n⏱️ সময়: ${toBengaliNumeral(timeMinutes)} মিনিট | ❓ প্রশ্ন: ${toBengaliNumeral(questionCount)}টি\n🔗 পরীক্ষা লিংক: ${url.toString()}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareNative = async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.origin + window.location.pathname);
    if (examId) {
      url.searchParams.set('examId', examId);
    } else if (title) {
      url.searchParams.set('exam', title);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `📝 ${title} - আত-তামরীন একাডেমিতে লাইভ পরীক্ষা দিন!`,
          url: url.toString(),
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const displayCategory = category || (subject.includes('বাংলা') ? 'BENGALI LESSON' : 'EXAM LESSON');

  return (
    <div className={`w-full max-w-xl mx-auto ${isStandalone ? 'p-2 sm:p-4' : ''}`}>
      {/* Outer Main Container with Modern Shadow & Smooth Corners */}
      <div className="bg-white dark:bg-[#111C38] rounded-3xl sm:rounded-[32px] overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all animate-fade-in relative">
        
        {/* ========================================================================= */}
        {/* 1. TOP ROYAL GRADIENT HERO BANNER                                         */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#312E81] dark:from-[#3730A3] dark:via-[#312E81] dark:to-[#1E1B4B] text-white p-6 sm:p-7 text-center relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close/Back Button if applicable */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 active:scale-95 transition-all cursor-pointer backdrop-blur-xs z-20"
              title="ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Top Share Button */}
          <button
            onClick={handleShareNative}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 active:scale-95 transition-all cursor-pointer backdrop-blur-xs z-20 flex items-center gap-1 text-xs font-bold"
            title="লিংক শেয়ার করুন"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
          </button>

          <div className="relative z-10 space-y-3 pt-1">
            {/* Title with Book Icon */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl">📖</span>
              <h1 className="text-lg sm:text-2xl font-black font-hind tracking-tight text-white drop-shadow-xs">
                {title}
              </h1>
            </div>

            {/* Category Pill Tag & Topic */}
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md text-white font-black text-[10px] sm:text-[11px] tracking-wider uppercase px-3.5 py-1 rounded-full border border-white/25 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{displayCategory}</span>
              </span>
              {topic && (
                <span className="bg-emerald-500/80 backdrop-blur-md text-white font-black text-[10px] sm:text-[11px] px-3.5 py-1 rounded-full border border-emerald-300/40 flex items-center gap-1 shadow-xs">
                  <span>টপিক: {topic}</span>
                </span>
              )}
            </div>

            {/* Instructor & Institution Badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <div className="bg-white/15 backdrop-blur-md text-white/95 text-xs font-bold px-3 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-2xs">
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>{instructor}</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md text-white/95 text-xs font-bold px-3 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>{institution}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY CONTENT: 3 STATS CARDS, INSTRUCTIONS, AND NAME INPUT             */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-7 space-y-6">

          {/* 3 Top Stat Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* 1. Time Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-center space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                সময় (TIME)
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind leading-none">
                {toBengaliNumeral(timeMinutes)} <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">মিনিট</span>
              </div>
            </div>

            {/* 2. Question Count Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-center space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                <HelpCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                প্রশ্ন (QUESTIONS)
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind leading-none">
                {toBengaliNumeral(questionCount)} <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">টি</span>
              </div>
            </div>

            {/* 3. Negative Marking Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 text-center space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                নেগেটিভ (NEGATIVE)
              </div>
              <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 font-hind leading-none">
                {typeof negativeMark === 'number' ? toBengaliNumeral(negativeMark) : negativeMark}
              </div>
            </div>
          </div>

          {/* Exam Instructions Box */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm sm:text-base font-hind">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span>পরীক্ষার নির্দেশনাবলী (Instructions)</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>প্রতিটি সঠিক উত্তরের জন্য <strong className="font-bold text-blue-600 dark:text-blue-400">১ নম্বর</strong> পাবেন।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>প্রতিটি ভুল উত্তরের জন্য <strong className="font-bold text-rose-600 dark:text-rose-400">{typeof negativeMark === 'number' ? toBengaliNumeral(negativeMark) : negativeMark} নম্বর</strong> কাটা যাবে।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>পরীক্ষা শুরু হওয়ার পর পেজ <strong className="font-bold text-slate-900 dark:text-white">রিফ্রেশ (Refresh)</strong> করবেন না।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>নির্ধারিত সময় শেষ হলে পরীক্ষা <strong className="font-bold text-emerald-600 dark:text-emerald-400">স্বয়ংক্রিয়ভাবে জমা (Auto-submit)</strong> হবে।</span>
              </div>
            </div>
          </div>

          {/* If Exam is Already Completed -> Show Retest Prevention State with Solutions & Leaderboard */}
          {hasCompleted ? (
            <div className="space-y-3.5 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-center space-y-1.5 shadow-xs">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white mx-auto shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-300 font-hind">
                  আপনি এই পরীক্ষাটি ইতোমধ্যে সম্পন্ন করেছেন
                </h3>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  পরীক্ষার উত্তরমালা, বিস্তারিত ব্যাখ্যা এবং জাতীয় মেধাতালিকা নিচে দেখুন।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onReviewAnswers && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      onReviewAnswers();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#0b705c] hover:bg-[#085a49] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>ব্যাখ্যা সহ উত্তর</span>
                  </button>
                )}

                {onOpenLeaderboard && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenLeaderboard();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>জাতীয় মেধাতালিকা</span>
                  </button>
                )}
              </div>

              {/* Quick Share Link Box */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'লিংক কপি হয়েছে!' : 'বন্ধুদের সাথে পরীক্ষা লিংক শেয়ার করুন'}</span>
                </button>

                <span className="text-[11px] font-semibold text-slate-400">
                  আত-তামরীন একাডেমি
                </span>
              </div>
            </div>
          ) : (
            /* Student Name Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 font-hind">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>আপনার নাম (Your Name)</span>
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="আপনার পূর্ণ নাম লিখুন (যেমন: আব্দুল্লাহ)"
                    className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-400 transition-all outline-hidden shadow-inner"
                    autoFocus
                  />
                </div>

                {errorMessage ? (
                  <p className="text-xs font-bold text-rose-500 dark:text-rose-400 animate-shake">
                    {errorMessage}
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    💡 এই নামটি পরীক্ষার জাতীয় মেধা তালিকায় (Leaderboard) প্রদর্শিত হবে।
                  </p>
                )}
              </div>

              {/* Big Vibrant START EXAM Action Button */}
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#4338CA] to-[#312E81] hover:from-[#4338CA] hover:to-[#232066] active:scale-98 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-[0_8px_25px_rgba(79,70,229,0.35)] transition-all cursor-pointer border border-indigo-400/30"
              >
                <Rocket className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>🚀 পরীক্ষা শুরু করুন</span>
              </button>

              {/* Quick Share Link Box */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'লিংক কপি হয়েছে!' : 'বন্ধুদের সাথে পরীক্ষা লিংক শেয়ার করুন'}</span>
                </button>

                <span className="text-[11px] font-semibold text-slate-400">
                  আত-তামরীন একাডেমি
                </span>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
