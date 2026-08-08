import React from 'react';
import { Play, HelpCircle, Flame, Trophy, RefreshCw, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { Question } from '../types';
import { toBengaliNumeral, StudentStats } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';

interface HomePageProps {
  questions: Question[];
  isLoading: boolean;
  isFromSupabase: boolean;
  fetchError: string | null;
  studentStats: StudentStats;
  onStartPractice: () => void;
  onRefreshQuestions: () => void;
  onOpenSupabaseModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  questions,
  isLoading,
  isFromSupabase,
  fetchError,
  studentStats,
  onStartPractice,
  onRefreshQuestions,
  onOpenSupabaseModal,
}) => {
  const totalQuestionsCount = questions.length;
  const latestQuestion = questions[0] || null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-5 bg-white p-8 sm:p-12 rounded-[36px] border border-[#E6E2D3] shadow-xs relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8AA682]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#2D4B3E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F2EA] text-[#2D4B3E] border border-[#E6E2D3] text-xs font-bold tracking-wide">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#8AA682]" />
          <span>এমসিকিউ অনুশীলন স্টুডেন্ট অ্যাপ</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2D4B3E] tracking-tight">
          MiniQuiz
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl font-medium text-[#2D4B3E]/80 max-w-lg mx-auto leading-relaxed">
          &ldquo;প্রতিদিন অনুশীলন করুন, পরীক্ষার প্রস্তুতি নিন&rdquo;
        </p>

        {/* Main Action Button */}
        <div className="pt-4">
          <button
            onClick={onStartPractice}
            disabled={isLoading || totalQuestionsCount === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4.5 bg-[#2D4B3E] hover:bg-[#233B31] text-white font-bold text-lg sm:text-xl rounded-2xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
            <span>MCQ অনুশীলন শুরু করুন</span>
          </button>
        </div>

        {/* Database Source Subtext */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#8AA682] font-semibold">
          <Database className="w-3.5 h-3.5 text-[#8AA682]" />
          {isFromSupabase ? (
            <span className="text-[#2D4B3E]">Supabase টেবিল &apos;questions&apos; থেকে লোড করা হয়েছে</span>
          ) : (
            <span>ডেমো মোড (Supabase সংযোগ করতে গাইড দেখুন)</span>
          )}
        </div>
      </div>

      {/* Error / Notice Banner */}
      {fetchError && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 text-sm">{fetchError}</p>
              <p className="opacity-90 mt-1 text-xs leading-relaxed">
                Vercel এর Settings &gt; Environment Variables এ <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_URL</code> এবং <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> যোগ করে প্রজেক্ট রি-ডিপ্লয় (Redeploy) করুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={onOpenSupabaseModal}
              className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>গাইড দেখুন</span>
            </button>
            <button
              onClick={onRefreshQuestions}
              className="px-3 py-1.5 bg-[#2D4B3E] hover:bg-[#233B31] text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      )}

      {totalQuestionsCount === 0 && !isLoading && (
        <div className="p-8 bg-white border border-dashed border-[#E6E2D3] rounded-[32px] text-center space-y-3">
          <div className="w-12 h-12 bg-[#F5F2EA] rounded-2xl flex items-center justify-center mx-auto text-[#8AA682]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-[#2D4B3E] font-bold text-lg">
            এখনও কোনো প্রশ্ন প্রকাশ করা হয়নি।
          </p>
          <p className="text-[#2D4B3E]/70 text-xs sm:text-sm max-w-md mx-auto">
            Supabase এর <code className="text-rose-600 font-mono">questions</code> টেবিলে <code className="text-[#2D4B3E] font-mono">status = &apos;published&apos;</code> সহ প্রশ্ন যোগ করলে এখানে প্রদর্শিত হবে।
          </p>
          <button
            onClick={onOpenSupabaseModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5F2EA] text-[#2D4B3E] hover:bg-[#E6E2D3] border border-[#E6E2D3] rounded-xl text-xs font-semibold transition-colors mt-2"
          >
            <Database className="w-4 h-4 text-[#8AA682]" />
            <span>Supabase সেটআপ গাইড ও SQL দেখুন</span>
          </button>
        </div>
      )}

      {/* 3 Required Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: মোট প্রশ্ন */}
        <div className="bg-white p-6 rounded-[28px] border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-[#8AA682] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8AA682] tracking-wider uppercase">
              মোট প্রশ্ন
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F5F2EA] text-[#2D4B3E] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
              {isLoading ? '...' : `${toBengaliNumeral(totalQuestionsCount)} টি`}
            </div>
            <p className="text-xs text-[#8AA682] mt-1 font-semibold">
              {isFromSupabase ? 'প্রকাশিত প্রশ্নাবলি' : 'প্রস্তুতকৃত নমুনা প্রশ্ন'}
            </p>
          </div>
        </div>

        {/* Card 2: আজকের অনুশীলন */}
        <div className="bg-white p-6 rounded-[28px] border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-[#8AA682] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8AA682] tracking-wider uppercase">
              আজকের অনুশীলন
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F5F2EA] text-[#2D4B3E] flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
              {toBengaliNumeral(studentStats.todayPracticeCount)} টি
            </div>
            <p className="text-xs text-[#8AA682] mt-1 font-semibold">
              আজ সম্পন্ন করা প্রশ্ন
            </p>
          </div>
        </div>

        {/* Card 3: সর্বশেষ প্রশ্ন */}
        <div className="bg-white p-6 rounded-[28px] border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-[#8AA682] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8AA682] tracking-wider uppercase">
              সর্বশেষ প্রশ্ন
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F5F2EA] text-[#2D4B3E] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#8AA682]" />
            </div>
          </div>
          <div>
            {studentStats.lastQuizScore ? (
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
                  {toBengaliNumeral(studentStats.lastQuizScore.percentage)}%
                </div>
                <p className="text-xs text-[#8AA682] mt-1 font-semibold">
                  সর্বশেষ স্কোর ({toBengaliNumeral(studentStats.lastQuizScore.correct)}/{toBengaliNumeral(studentStats.lastQuizScore.total)})
                </p>
              </div>
            ) : latestQuestion ? (
              <div>
                <p className="text-sm font-semibold text-[#2D4B3E] line-clamp-1">
                  &ldquo;{latestQuestion.question}&rdquo;
                </p>
                <p className="text-xs text-[#8AA682] mt-1 font-semibold">
                  নতুন যুক্ত করা হয়েছে
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-[#2D4B3E]/60">কোনো তথ্য নেই</p>
                <p className="text-xs text-[#8AA682] mt-1 font-semibold">অনুশীলন শুরু করুন</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Information Banner */}
      <div className="bg-[#8AA682] text-white p-6 sm:p-8 rounded-[32px] space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D4B3E] flex items-center justify-center text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              সহজ ও দ্রুত MCQ অনুশীলনের নিয়ম
            </h3>
            <p className="text-xs sm:text-sm text-white/80">
              পরীক্ষার আমেজে প্রতিটি প্রশ্ন সমাধান করুন
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white/95 pt-3 border-t border-white/20">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <span>প্রতিটি প্রশ্নে ৪টি বিকল্পের যেকোনো ১টি নির্বাচন করুন</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <span>উত্তর দেওয়ার সাথে সাথে সঠিক/ভুল এবং ব্যাখ্যা জানতে পারবেন</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <span>সম্পূর্ণ পরীক্ষা শেষে শতকরা নম্বর ও বিস্তারিত উত্তরপত্র পাবেন</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <span>বারবার চেষ্টা করে আপনার প্রস্তুতি নিখুঁত করতে পারবেন</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
