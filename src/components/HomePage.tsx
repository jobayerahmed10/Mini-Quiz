import React, { useState, useMemo } from 'react';
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
  Atom,
  Cpu,
  Calculator,
  LayoutGrid,
  Search,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Question } from '../types';
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
}

export const HomePage: React.FC<HomePageProps> = ({
  questions,
  isLoading,
  isFromSupabase,
  fetchError,
  studentStats,
  selectedSubject,
  onSelectSubject,
  onStartPractice,
  onRefreshQuestions,
  onOpenSupabaseModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Calculate questions count per subject
  const subjectQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const subj = detectQuestionSubject(q);
      counts[subj] = (counts[subj] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Icon map for subject rendering
  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Languages': return <Languages className="w-5 h-5" />;
      case 'Landmark': return <Landmark className="w-5 h-5" />;
      case 'Globe': return <Globe className="w-5 h-5" />;
      case 'Atom': return <Atom className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Calculator': return <Calculator className="w-5 h-5" />;
      default: return <LayoutGrid className="w-5 h-5" />;
    }
  };

  // Filtered subject list based on search and tabs
  const filteredCategories = useMemo(() => {
    return SUBJECT_CATEGORIES.filter((cat) => {
      if (cat.id === 'all') return false; // Handled separately
      const count = subjectQuestionCounts[cat.name] || 0;
      
      const matchesSearch = 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' || cat.id === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, subjectQuestionCounts]);

  const totalQuestionsCount = questions.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8 animate-fade-in">
      
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-br from-[#1E332A] via-[#2D4B3E] to-[#182B23] text-white p-7 sm:p-12 rounded-[36px] shadow-xl overflow-hidden border border-emerald-800/40">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-2xl">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>বিষয় ভিত্তিক মডেল টেস্ট ও অনুশীলন</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            বিষয় ভিত্তিক <span className="text-emerald-300 underline decoration-emerald-400/50 underline-offset-8">এমসিকিউ</span> পোর্টাল
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            বিসিএস, ব্যাংক, শিক্ষক নিবন্ধন ও যেকোনো প্রতিযোগিতামূলক পরীক্ষার জন্য পছন্দসই বিষয় নির্বাচন করে সঠিক সমাধান ও ব্যাখ্যাসহ অনুশীলন করুন।
          </p>

          {/* Quick Hero Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartPractice('all')}
              disabled={isLoading || totalQuestionsCount === 0}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-emerald-400/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>সকল বিষয়ের প্রশ্ন অনুশীলন ({toBengaliNumeral(totalQuestionsCount)})</span>
            </button>
          </div>
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
              className="px-3.5 py-1.5 bg-[#2D4B3E] hover:bg-[#233B31] text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Student Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Questions */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-[#8AA682] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">মোট প্রশ্ন</span>
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D4B3E]">
            {isLoading ? '...' : `${toBengaliNumeral(totalQuestionsCount)}টি`}
          </div>
          <p className="text-[11px] text-[#8AA682] font-semibold mt-1">সব ক্যাটাগরি মিলিয়ে</p>
        </div>

        {/* Practiced Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-[#8AA682] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">অনুশীলিত</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D4B3E]">
            {toBengaliNumeral(studentStats.totalAttempted)}টি
          </div>
          <p className="text-[11px] text-[#8AA682] font-semibold mt-1">সর্বমোট উত্তর দেয়া</p>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-[#8AA682] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">সঠিকতা</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D4B3E]">
            {toBengaliNumeral(studentStats.accuracyRate)}%
          </div>
          <p className="text-[11px] text-[#8AA682] font-semibold mt-1">গড় নির্ভুলতার হার</p>
        </div>

        {/* Categories Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D3] shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-[#8AA682] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">বিষয়সমূহ</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D4B3E]">
            {toBengaliNumeral(SUBJECT_CATEGORIES.length - 1)}টি
          </div>
          <p className="text-[11px] text-[#8AA682] font-semibold mt-1">শ্রেণিভুক্ত ক্যাটাগরি</p>
        </div>
      </div>

      {/* Main Subjects Section Header */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] tracking-tight">
              বিষয় ভিত্তিক ক্যাটাগরি
            </h2>
            <p className="text-xs sm:text-sm text-[#2D4B3E]/70 font-medium mt-0.5">
              যেকোনো নির্দিষ্ট বিষয়ের ওপর ক্লিক করে সরাসরি অনুশীলন শুরু করুন
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8AA682] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিষয় খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E6E2D3] rounded-xl text-xs text-[#2D4B3E] focus:outline-none focus:border-[#2D4B3E] transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#2D4B3E] text-white shadow-xs'
                : 'bg-white text-[#2D4B3E] border border-[#E6E2D3] hover:bg-[#F5F2EA]'
            }`}
          >
            সব বিষয়
          </button>
          {SUBJECT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-[#2D4B3E] text-white shadow-xs'
                  : 'bg-white text-[#2D4B3E] border border-[#E6E2D3] hover:bg-[#F5F2EA]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subjects Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredCategories.map((cat) => {
            const count = subjectQuestionCounts[cat.name] || 0;
            const hasQuestions = count > 0;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#E6E2D3] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all group flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Subject Icon & Tag */}
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl border ${cat.bgColor}`}>
                        {getSubjectIcon(cat.iconName)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-[#2D4B3E] group-hover:text-emerald-700 transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] font-mono text-[#8AA682] uppercase tracking-wider font-bold">
                          {cat.code}
                        </span>
                      </div>
                    </div>

                    {/* Question Count Badge */}
                    <div className="px-3 py-1 rounded-full bg-[#F5F2EA] border border-[#E6E2D3] text-xs font-bold text-[#2D4B3E]">
                      {isLoading ? '...' : `${toBengaliNumeral(count)}টি প্রশ্ন`}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#2D4B3E]/80 leading-relaxed font-normal">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E6E2D3]/60">
                  <span className="text-xs text-[#8AA682] font-semibold">
                    {hasQuestions ? 'অনুশীলনের জন্য প্রস্তুত' : 'প্রশ্ন লোড হচ্ছে...'}
                  </span>

                  <button
                    onClick={() => onStartPractice(cat.name)}
                    disabled={!hasQuestions || isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D4B3E] hover:bg-[#1E332A] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group-hover:translate-x-0.5"
                  >
                    <span>অনুশীলন শুরু</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if search finds nothing */}
        {filteredCategories.length === 0 && (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-[#E6E2D3] text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-[#8AA682] mx-auto" />
            <p className="text-[#2D4B3E] font-bold text-sm">কোনো বিষয় খুঁজে পাওয়া যায়নি</p>
            <p className="text-xs text-[#8AA682]">অন্য কোনো শব্দ লিখে অনুসন্ধান করুন</p>
          </div>
        )}
      </div>

    </div>
  );
};
