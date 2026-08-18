import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  CheckCircle, 
  Scale, 
  Compass, 
  Feather, 
  ShieldCheck, 
  Languages, 
  FileText, 
  Calculator, 
  Landmark, 
  Globe, 
  Cpu, 
  Search, 
  Play, 
  Sparkles,
  Clock,
  ListOrdered,
  X,
  Check,
  ArrowLeft,
  Crown,
  Lock,
  Unlock,
  ChevronRight,
  ShieldAlert,
  Zap,
  CreditCard,
  AlertCircle,
  FileCheck2,
  Settings
} from 'lucide-react';
import { SUBJECT_CATEGORIES } from '../lib/subjects';
import { isUserPremium, setUserPremium, toBengaliNumeral, getUserProfile } from '../lib/utils';
import { fetchEnrollmentsFromSupabase } from '../lib/supabase';
import { PremiumEnrollmentModal } from './PremiumEnrollmentModal';
import { CourseEnrollmentRecord } from '../types';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; questionCount?: number; timeMinutes?: number }) => void;
  onOpenCourses?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Bookmark,
  FileText,
  CheckCircle,
  Scale,
  Compass,
  Feather,
  ShieldCheck,
  Languages,
  Calculator,
  Landmark,
  Globe,
  Cpu,
  Sparkles
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onSelectSubject, onOpenCourses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);
  
  // Premium status state: 'approved' | 'pending' | 'none' | 'rejected'
  const [premiumStatus, setPremiumStatus] = useState<'approved' | 'pending' | 'none' | 'rejected'>(() => {
    if (isUserPremium()) return 'approved';
    const cachedStatus = localStorage.getItem('tamreen_premium_status');
    if (cachedStatus === 'pending') return 'pending';
    if (cachedStatus === 'rejected') return 'rejected';
    return 'none';
  });

  const isPremium = premiumStatus === 'approved';
  const isPending = premiumStatus === 'pending';

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [attemptedSubject, setAttemptedSubject] = useState<string>('');
  const [pendingTrxId, setPendingTrxId] = useState<string>(() => localStorage.getItem('tamreen_premium_trx') || '');

  // Check enrollment from Supabase & LocalStorage
  const checkRemotePremiumStatus = useCallback(async () => {
    try {
      const res = await fetchEnrollmentsFromSupabase();
      const user = getUserProfile();
      const userPhone = user?.phone?.trim();

      const allEnrollments: CourseEnrollmentRecord[] = res.enrollments || [];
      
      // Also check local
      try {
        const local = JSON.parse(localStorage.getItem('tamreen_enrollments') || '[]');
        if (Array.isArray(local)) {
          local.forEach(l => {
            if (!allEnrollments.some(e => e.transaction_id === l.transaction_id)) {
              allEnrollments.push(l);
            }
          });
        }
      } catch {}

      // Find premium application
      const premiumApp = allEnrollments.find(e => 
        e.course_id.startsWith('tamreen_premium') || 
        e.course_id === 'tamreen_premium_package' || 
        e.course_title.includes('১৫টি বিষয়ভিত্তিক') ||
        (userPhone && e.phone_number === userPhone && e.course_id.startsWith('tamreen_premium'))
      );

      if (premiumApp) {
        if (premiumApp.status === 'approved') {
          setPremiumStatus('approved');
          setUserPremium(true);
          localStorage.setItem('tamreen_premium_status', 'approved');
        } else if (premiumApp.status === 'pending') {
          setPremiumStatus('pending');
          setUserPremium(false);
          localStorage.setItem('tamreen_premium_status', 'pending');
          if (premiumApp.transaction_id) {
            setPendingTrxId(premiumApp.transaction_id);
            localStorage.setItem('tamreen_premium_trx', premiumApp.transaction_id);
          }
        } else if (premiumApp.status === 'rejected') {
          setPremiumStatus('rejected');
          setUserPremium(false);
          localStorage.setItem('tamreen_premium_status', 'rejected');
        }
      } else {
        // Fallback to local isUserPremium
        if (isUserPremium()) {
          setPremiumStatus('approved');
        } else {
          const localStatus = localStorage.getItem('tamreen_premium_status');
          if (localStatus === 'pending') setPremiumStatus('pending');
          else setPremiumStatus('none');
        }
      }
    } catch (err) {
      console.error('Error verifying premium status:', err);
    }
  }, []);

  useEffect(() => {
    checkRemotePremiumStatus();

    const handlePremiumUpdate = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setPremiumStatus(e.detail ? 'approved' : 'none');
      } else if (typeof e.detail === 'string') {
        setPremiumStatus(e.detail as any);
      } else {
        checkRemotePremiumStatus();
      }
    };

    window.addEventListener('tamreen_premium_updated', handlePremiumUpdate);
    window.addEventListener('tamreen_premium_status_changed', handlePremiumUpdate);
    window.addEventListener('tamreen_enrollments_updated', checkRemotePremiumStatus);

    return () => {
      window.removeEventListener('tamreen_premium_updated', handlePremiumUpdate);
      window.removeEventListener('tamreen_premium_status_changed', handlePremiumUpdate);
      window.removeEventListener('tamreen_enrollments_updated', checkRemotePremiumStatus);
    };
  }, [checkRemotePremiumStatus]);

  const fifteenSubjects = SUBJECT_CATEGORIES.filter(s => s.id !== 'all');

  const filteredSubjects = fifteenSubjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubjectClick = (subjectName: string) => {
    if (isPending) {
      setAttemptedSubject(subjectName);
      setShowPaymentModal(false);
      alert('আপনার বিকাশ/নগদ TrxID পেমেন্ট আবেদনটি বর্তমানে যাচাইাধীন (Pending) রয়েছে। এডমিন প্যানেল থেকে অনুমোদন করলেই এই বিষয়টি স্বয়ংক্রিয়ভাবে খুলে যাবে।');
      return;
    }

    if (!isPremium) {
      setAttemptedSubject(subjectName);
      setShowPaymentModal(true);
      return;
    }

    setSelectedSubject(subjectName);
  };

  const handleStartExamFromModal = () => {
    if (!selectedSubject) return;
    onSelectSubject({
      subject: selectedSubject,
      questionCount,
      timeMinutes,
    });
  };

  const handlePaymentSuccess = (record: CourseEnrollmentRecord) => {
    setPremiumStatus('pending');
    setPendingTrxId(record.transaction_id);
    localStorage.setItem('tamreen_premium_status', 'pending');
    localStorage.setItem('tamreen_premium_trx', record.transaction_id);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 mb-24 space-y-5">
      
      {/* 1. TOP GREEN THEMED CARD */}
      <div className="neu-card !rounded-3xl p-5 sm:p-7 relative overflow-hidden border border-emerald-300/70 dark:border-emerald-700/50 bg-gradient-to-b from-[#F0FDF4]/90 via-[#F8FAFC]/90 to-white dark:from-[#06291C]/60 dark:via-[#0A1A2F]/80 dark:to-[#0B132B]">
        
        {/* Pills Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill 1: Status Pill (Clickable) */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className={`text-xs font-black px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs border cursor-pointer hover:scale-[1.03] active:scale-95 transition-all ${
                isPremium
                  ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-[#064E3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                  : isPending
                  ? 'bg-amber-100/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-700 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>সক্রিয় প্যাকেজ: বাৎসরিক প্যাকেজ (সক্রিয়)</span>
                </>
              ) : isPending ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>পেমেন্ট যাচাইাধীন (Pending)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ফ্রি একাউন্ট (প্যাকেজ আনলক করুন)</span>
                </>
              )}
            </button>

            {/* Pill 2: 15 Subjects Special Preparation */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="text-xs font-black px-3.5 py-1.5 bg-emerald-100/90 dark:bg-emerald-950/80 text-[#064E3B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-full inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.03] active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>১৫টি বিষয়ভিত্তিক বিশেষ প্যাকেজ</span>
            </button>
          </div>
        </div>

        {/* Heading in Bold Green */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#064E3B] dark:text-emerald-400 font-hind tracking-tight leading-snug">
          বিষয়ভিত্তিক প্রস্তুতি ও অনুশীলন
        </h1>

        {/* Description Text */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
          {isPremium ? (
            'আপনার প্রিমিয়াম মেম্বারশিপের আওতায় সকল বিষয়ের ৫,০০০+ প্রশ্নব্যাংক সম্পূর্ণ আনলক রয়েছে। নিচের যেকোনো বিষয়ে ক্লিক করে কাস্টম প্রশ্ন সংখ্যা ও মোড অনুযায়ী অনুশীলন শুরু করুন।'
          ) : isPending ? (
            `আপনার বিকাশ/নগদ TrxID (${pendingTrxId || 'যাচাইাধীন'}) ডাটাবেসে সফলভাবে জমা হয়েছে। এডমিন প্যানেল থেকে অনুমোদন করলেই ১৫টি বিষয়ের সম্পূর্ণ প্রশ্নব্যাংক সক্রিয় হয়ে যাবে।`
          ) : (
            'আপনার অ্যাকাউন্টে বর্তমানে বিষয়ভিত্তিক প্রশ্নব্যাংক লক রয়েছে। মাসিক, ত্রৈমাসিক, ষান্মাসিক বা বাৎসরিক প্রিমিয়াম প্যাকেজ বেছে নিয়ে বিকাশ/নগদে ফি পাঠিয়ে TrxID প্রদান করুন। এডমিন অনুমোদন করলেই সকল বিষয়ের প্রশ্নব্যাংক আনলক হয়ে যাবে।'
          )}
        </p>

        {/* Divider & Bottom Status Strip */}
        <div className="mt-4 pt-3.5 border-t border-emerald-200/70 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] dark:text-emerald-300">
            {isPremium ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>১৫টি বিষয়ের সকল প্রশ্ন ও ব্যাখ্যা সম্পূর্ণ আনলকড</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">(প্রিমিয়াম মেম্বারশিপ সক্রিয়)</span>
              </>
            ) : isPending ? (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 animate-spin">
                  <Clock className="w-2.5 h-2.5" />
                </div>
                <span className="text-amber-800 dark:text-amber-300">
                  আবেদন স্ট্যাটাস: পেন্ডিং (এডমিন যাচাই চলছে)
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span className="text-amber-800 dark:text-amber-300">১৫টি বিষয়ের প্রশ্নব্যাংক বর্তমানে লক করা</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="neu-pill !rounded-2xl px-4 py-2 text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-xs border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {isPremium
                  ? 'প্যাকেজ বিবরণ'
                  : isPending
                  ? 'পেমেন্ট তথ্য দেখুন'
                  : 'প্যাকেজসমূহ দেখুন ও আনলক করুন'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NEUMORPHIC INSET SEARCH BAR */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="বিষয় খুঁজুন (যেমন: ফিকহ, আরবি ব্যাকরণ, গণিত, কুরআন)..."
          className="neu-inset w-full !rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
        />
      </div>

      {/* 3. LIST OF 15 SUBJECT CARDS */}
      <div className="space-y-3 sm:space-y-3.5">
        {filteredSubjects.map((sub) => {
          const IconComponent = ICON_MAP[sub.iconName] || BookOpen;

          return (
            <div
              key={sub.id}
              onClick={() => handleSubjectClick(sub.name)}
              className={`neu-card !rounded-3xl p-3.5 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group border ${
                isPremium 
                  ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400/60' 
                  : isPending
                  ? 'border-amber-300/80 dark:border-amber-800/80 hover:border-amber-400'
                  : 'border-slate-200/70 dark:border-slate-800/70 hover:border-amber-400/60'
              }`}
            >
              {/* Left: Green Squircle Icon Container */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="neu-icon-box w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 text-[#046A38] dark:text-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/60 group-hover:scale-105 transition-transform">
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#064E3B] dark:text-emerald-400 font-hind leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {sub.description}
                  </p>
                </div>
              </div>

              {/* Right: Green Practice Button / Locked Button / Pending Button */}
              <div className="shrink-0">
                {isPremium ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubjectClick(sub.name);
                    }}
                    className="neu-pill !rounded-2xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-[#046A38] dark:text-emerald-400 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer border border-emerald-300/80 dark:border-emerald-700/60 bg-white/90 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95 transition-all shadow-xs"
                  >
                    <span>অনুশীলন শুরু</span>
                    <ChevronRight className="w-4 h-4 text-[#046A38] dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : isPending ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubjectClick(sub.name);
                    }}
                    className="neu-pill !rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-amber-800 dark:text-amber-300 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer border border-amber-400/80 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/50 hover:scale-105 active:scale-95 transition-all shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>যাচাইাধীন</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubjectClick(sub.name);
                    }}
                    className="neu-pill !rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-amber-700 dark:text-amber-400 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 hover:scale-105 active:scale-95 transition-all shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>লক করা</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. QUESTION COUNT & TIME LIMIT CONFIG MODAL (Unlocked State) */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="neu-card max-w-md w-full p-6 relative shadow-2xl space-y-5 bg-white dark:bg-[#121E36] border border-emerald-200/80 dark:border-emerald-800/60">
            {/* Header with Top-Left Back Button and Right Close Button */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>পিছনে</span>
              </button>
              <button
                onClick={() => setSelectedSubject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Title */}
            <div>
              <span className="text-[11px] font-bold text-[#064E3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                নির্বাচিত বিষয়
              </span>
              <h3 className="text-xl font-black text-[#064E3B] dark:text-emerald-400 mt-1 font-hind">
                {selectedSubject}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                অনুশীলন শুরু করার আগে আপনার পছন্দমতো সময় ও প্রশ্ন নির্ধারণ করুন
              </p>
            </div>

            {/* Option 1: Question Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-[#064E3B] dark:text-emerald-400" />
                <span>প্রশ্ন সংখ্যা নির্ধারণ করুন:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((num) => {
                  const isCountSelected = questionCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isCountSelected
                          ? 'bg-[#046A38] border-[#046A38] text-white shadow-xs'
                          : 'neu-btn text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {toBengaliNumeral(num)}টি
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option 2: Time Limit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#064E3B] dark:text-emerald-400" />
                <span>সময় সীমা নির্ধারণ করুন (মিনিট):</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((mins) => {
                  const isTimeSelected = timeMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeMinutes(mins)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isTimeSelected
                          ? 'bg-[#046A38] border-[#046A38] text-white shadow-xs'
                          : 'neu-btn text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {toBengaliNumeral(mins)}মি.
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Exam Button in Green */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleStartExamFromModal}
                className="w-full py-3.5 bg-gradient-to-r from-[#046A38] to-[#064E3B] hover:from-[#057A42] hover:to-[#046A38] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>পরীক্ষা শুরু করুন ({toBengaliNumeral(questionCount)}টি প্রশ্ন, {toBengaliNumeral(timeMinutes)} মিনিট)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MULTI-STEP PAYMENT ENROLLMENT MODAL */}
      {showPaymentModal && (
        <PremiumEnrollmentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  );
};

