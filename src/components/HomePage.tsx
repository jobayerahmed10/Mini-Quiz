import React, { useState, useMemo } from 'react';
import { AtTamreenLogo } from './AtTamreenLogo';
import { 
  Play, 
  HelpCircle, 
  Flame, 
  Trophy, 
  RefreshCw, 
  AlertCircle, 
  Database, 
  Sparkles,
  BookOpen,
  Languages,
  Landmark,
  Globe,
  Cpu,
  Calculator,
  Search,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Bot,
  Briefcase,
  Layers,
  FileCheck2,
  BookMarked
} from 'lucide-react';
import { Question, TabRoute } from '../types';
import { toBengaliNumeral, StudentStats } from '../lib/utils';
import { SUBJECT_CATEGORIES, detectQuestionSubject } from '../lib/subjects';

interface HomePageProps {
  questions: Question[];
  isLoading: boolean;
  isFromSupabase: boolean;
  fetchError: string | null;
  studentStats: StudentStats;
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  onStartPractice: (subject?: string) => void;
  onRefreshQuestions: () => void;
  onOpenSupabaseModal: () => void;
  onTabNavigate?: (tab: TabRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  questions,
  isLoading,
  fetchError,
  studentStats,
  onStartPractice,
  onRefreshQuestions,
  onOpenSupabaseModal,
  onTabNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

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
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  const totalQuestionsCount = questions.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-fade-in mb-24">
      {/* Hero Banner Section */}
      <div className="neu-card p-6 sm:p-10 relative overflow-hidden border border-amber-400/40 bg-gradient-to-r from-[#121E36] via-[#1A2C4E] to-[#0E172A]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>১৯তম NTRCA & মাদ্রাসা শিক্ষক নিবন্ধনের সেরা প্ল্যাটফর্ম</span>
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-tight font-tiro tracking-wide py-1">
                <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">আত-তামরীন</span>{' '}
                <span className="typo-gradient-gold drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">একাডেমি</span>
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            মাদ্রাসা (কুরআন, হাদিস, ফিকহ, আরবি), স্কুল ও কলেজের জন্য পূর্ণাঙ্গ প্রিলিমিনারি মডেল টেস্ট, ১৫টি বিষয়ভিত্তিক প্রস্তুতি, জব সার্কুলার এবং উস্তাদ এআই টিউটর।
          </p>

          {/* 5 Quick Feature Shortcuts */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => onTabNavigate ? onTabNavigate('exam') : onStartPractice('সকল বিষয়')}
              className="neu-btn p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 group"
            >
              <FileCheck2 className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">পরিক্ষা দিন</span>
              <span className="text-[10px] text-amber-300/80">১০০ মার্কস</span>
            </button>

            <button
              onClick={() => onTabNavigate && onTabNavigate('courses')}
              className="neu-btn p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 group"
            >
              <BookOpen className="w-5 h-5 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">কোর্স</span>
              <span className="text-[10px] text-sky-300/80">হ্যান্ডনোটস</span>
            </button>

            <button
              onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
              className="neu-btn p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 group"
            >
              <Bot className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">উস্তাদ এআই</span>
              <span className="text-[10px] text-emerald-300/80">স্মার্ট টিউটর</span>
            </button>

            <button
              onClick={() => onTabNavigate && onTabNavigate('circulars')}
              className="neu-btn p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 group"
            >
              <Briefcase className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">সার্কুলার</span>
              <span className="text-[10px] text-rose-300/80">নিয়োগ বিজ্ঞপ্তি</span>
            </button>

            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects')}
              className="neu-btn p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 group col-span-2 sm:col-span-1"
            >
              <Layers className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">বিষয়ভিত্তিক</span>
              <span className="text-[10px] text-purple-300/80">১৫টি বিষয়</span>
            </button>
          </div>
        </div>
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
          <div className="text-2xl sm:text-3xl font-black text-white">
            {isLoading ? '...' : `${toBengaliNumeral(totalQuestionsCount)}টি`}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">সব বিষয় মিলিয়ে</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">অনুশীলিত</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {toBengaliNumeral(studentStats.totalAttempted)}টি
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">সর্বমোট উত্তর দেয়া</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">সঠিকতার হার</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {toBengaliNumeral(studentStats.accuracyRate)}%
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">গড় নির্ভুল স্কোর</p>
        </div>

        <div className="neu-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">বিষয়সমূহ</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ১৫টি
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">বিষয়ভিত্তিক ক্যাটাগরি</p>
        </div>
      </div>

      {/* 15 Subjects Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              ১৫টি বিষয়ভিত্তিক প্রস্তুতি
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              ক্লিক করে সরাসরি ওই বিষয়ের স্পেশাল প্রশ্ন উত্তর অনুশীলন করুন
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিষয় খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0D172A] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 shadow-[inset_2px_2px_4px_#060a17]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      বিষয় #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {toBengaliNumeral(count)}টি প্রশ্ন
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>অনুশীলন শুরু করুন</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

