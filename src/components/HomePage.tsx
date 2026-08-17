import React, { useState, useMemo } from 'react';
import { 
  Play, 
  HelpCircle, 
  Flame, 
  Trophy, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  Search,
  ChevronRight,
  Bot,
  Briefcase,
  Layers,
  FileCheck2,
  Video,
  FileText,
  Calendar,
  Bookmark,
  Bell,
  Award
} from 'lucide-react';
import { Question, TabRoute } from '../types';
import { toBengaliNumeral, StudentStats } from '../lib/utils';
import { SUBJECT_CATEGORIES, detectQuestionSubject } from '../lib/subjects';

interface HomePageProps {
  questions: Question[];
  isLoading: boolean;
  isFromSupabase?: boolean;
  fetchError: string | null;
  studentStats: StudentStats;
  selectedSubject?: string;
  onSelectSubject?: (subject: string) => void;
  onStartPractice: (subject?: string) => void;
  onRefreshQuestions: () => void;
  onOpenSupabaseModal?: () => void;
  onTabNavigate?: (tab: TabRoute) => void;
  searchQuery?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  questions,
  isLoading,
  fetchError,
  studentStats,
  onStartPractice,
  onRefreshQuestions,
  onTabNavigate,
  searchQuery: externalSearchQuery,
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const subjectQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const subj = detectQuestionSubject(q);
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const filteredCategories = useMemo(() => {
    return SUBJECT_CATEGORIES.filter((cat) => {
      if (cat.id === 'all') return false;
      return (
        cat.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
        cat.description.toLowerCase().includes(activeSearch.toLowerCase())
      );
    });
  }, [activeSearch]);

  const totalQuestionsCount = questions.length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in mb-24">
      
      {/* 1. EMERALD GREEN HERO BANNER CARD (Exact match to Screenshot 1) */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#046A38] via-[#05572E] to-[#064E3B] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-[#EAB308]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5 max-w-2xl">
          {/* Top Badge Pill */}
          <div className="flex items-center gap-2">
            <span className="bg-[#EAB308] text-[#064E3B] font-black text-[11px] sm:text-xs px-3 py-0.5 rounded-full shadow-xs">
              ভর্তি চলছে
            </span>
            <span className="text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1">
              🔥 আত-তামরীন একাডেমি
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight font-hind tracking-wide">
            ১৯তম NTRCA শিক্ষক নিবন্ধন
          </h1>

          {/* Subtitle in Golden Accent */}
          <div className="text-[#EAB308] font-bold text-sm sm:text-base">
            মাদ্রাসা ও জেনারেল পূর্ণাঙ্গ প্রস্তুতি
          </div>

          {/* Specific Course Target Info */}
          <p className="text-emerald-100/90 text-xs sm:text-sm font-medium leading-relaxed">
            প্রভাষক আরবি • সহকারী মৌলভী • ইবতেদায়ী প্রধান • লাইভ ক্লাস ও পূর্ণাঙ্গ হ্যান্ডনোট
          </p>

          {/* Action Button + Slider Dots */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              onClick={() => onTabNavigate && onTabNavigate('courses')}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#064E3B] font-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_14px_rgba(234,179,8,0.4)] cursor-pointer active:scale-95 transition-all text-xs sm:text-sm"
            >
              <span>কোর্সগুলো দেখুন</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Visual Carousel Indicators */}
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="w-6 h-1.5 bg-[#EAB308] rounded-full" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. NOTICE BAR STRIP (Pure Neumorphic exact match to Screenshot) */}
      <div 
        onClick={() => onTabNavigate && onTabNavigate('circulars')}
        className="neu-card !rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] transition-transform group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="bg-[#F59E0B] text-[#0B132B] font-black text-xs px-3 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-xs">
            <Bell className="w-3.5 h-3.5 text-[#0B132B]" />
            বিজ্ঞপ্তি
          </span>
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
            ১৯তম শিক্ষক নিবন্ধন (NTRCA) সার্কুলার ও আবেদন আপডেট...
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform shrink-0" />
      </div>

      {/* 3. SIX NEUMORPHIC ACTION CARDS GRID (Exact match to Screenshot 1) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. লাইভ ক্লাস */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="neu-icon-box w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-[#EF4444] group-hover:scale-110 transition-transform">
            <Video className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">লাইভ ক্লাস</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#EF4444] mt-0.5">চলমান</span>
        </button>

        {/* 2. মডেল টেস্ট */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('exam')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="neu-icon-box w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-[#F59E0B] group-hover:scale-110 transition-transform">
            <FileCheck2 className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">মডেল টেস্ট</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">৫০+ সেট</span>
        </button>

        {/* 3. তামরীন AI */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">তামরীন AI</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#D97706] dark:text-amber-400 mt-0.5">ডাউট সলভ</span>
        </button>

        {/* 4. ক্লাস রুটিন */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="neu-icon-box w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-[#3B82F6] group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">ক্লাস রুটিন</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">সাপ্তাহিক</span>
        </button>

        {/* 5. বিগত প্রশ্ন */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="neu-icon-box w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-[#8B5CF6] group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">বিগত প্রশ্ন</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">ব্যাখ্যাসহ</span>
        </button>

        {/* 6. সব কোর্স */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="neu-icon-box w-12 h-12 rounded-2xl flex items-center justify-center mb-2 text-[#10B981] group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">সব কোর্স</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#059669] dark:text-emerald-400 mt-0.5">স্পেশাল ছাড়</span>
        </button>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/50 text-rose-200 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100 text-sm">{fetchError}</p>
              <p className="opacity-90 mt-1 text-xs">
                প্রয়োজনে ডাটাবেজ নির্দেশিকা দেখুন অথবা লোকেল ডাটা দিয়ে প্র্যাকটিস চালু রাখুন।
              </p>
            </div>
          </div>
          <button
            onClick={onRefreshQuestions}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">মোট প্রশ্ন</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : `${toBengaliNumeral(totalQuestionsCount)}টি`}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">সব বিষয় মিলিয়ে</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">অনুশীলিত</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {toBengaliNumeral(studentStats.totalAttempted)}টি
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">সর্বমোট উত্তর দেয়া</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">সঠিকতার হার</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-300">
            {toBengaliNumeral(studentStats.accuracyRate)}%
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">গড় নির্ভুল স্কোর</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">বিষয়সমূহ</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ১৫টি
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">বিষয়ভিত্তিক ক্যাটাগরি</p>
        </div>
      </div>

      {/* 15 Subjects Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              ১৫টি বিষয়ভিত্তিক প্রস্তুতি
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-0.5">
              ক্লিক করে সরাসরি ওই বিষয়ের স্পেশাল প্রশ্ন উত্তর অনুশীলন করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCategories.map((cat, idx) => {
            const count = subjectQuestionCounts[cat.name] || 15;

            return (
              <div
                key={cat.id}
                onClick={() => onStartPractice(cat.name)}
                className="neu-card p-5 cursor-pointer hover:border-amber-400/60 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-full">
                      বিষয় #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      {toBengaliNumeral(count)}টি প্রশ্ন
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-300">
                  <span>অনুশীলন শুরু করুন</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
