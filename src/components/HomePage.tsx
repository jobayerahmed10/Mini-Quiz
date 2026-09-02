import React, { useState, useEffect } from 'react';
import { 
  Bookmark,
  ChevronRight,
  Landmark,
  Clock,
  FileText,
  CheckCircle2,
  Users,
  Zap,
  Sparkles,
  MessageSquare,
  Play,
  User,
  Video,
  FileCheck,
  Calendar,
  BookOpen,
  Bell,
  HelpCircle,
  Flame,
  Award,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Trophy
} from 'lucide-react';
import { Question, TabRoute, BlogPost } from '../types';
import { toBengaliNumeral, getUserProfile, UserProfile, isExamCompleted, getCompletedExamIds } from '../lib/utils';
import { ExamItem, fetchExamsFromSupabase, getDistinctExamParticipantCounts, fetchBlogPosts, getCachedBlogs, toggleBlogBookmark, getLocalBookmarkedBlogIds } from '../lib/supabase';
import { UserRegistrationModal } from './UserRegistrationModal';
import { BlogDetailView } from './BlogDetailView';

interface HomePageProps {
  questions?: Question[];
  isLoading?: boolean;
  isFromSupabase?: boolean;
  fetchError?: string | null;
  studentStats?: any;
  selectedSubject?: string;
  onSelectSubject?: (subject: string) => void;
  onStartPractice: (subjectOrOpts: string | { subject: string; questionCount?: number; timeMinutes?: number; examId?: string; examType?: string }) => void;
  onRefreshQuestions?: () => void;
  onOpenSupabaseModal?: () => void;
  onTabNavigate?: (tab: TabRoute) => void;
  onOpenLeaderboard?: (examId?: string) => void;
  onReviewAnswers?: (opts: { examId?: string; subject?: string; questionCount?: number; timeMinutes?: number; examType?: string }) => void;
  searchQuery?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  questions = [],
  studentStats,
  onStartPractice,
  onTabNavigate,
  onOpenLeaderboard,
  onReviewAnswers,
}) => {
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const raw = localStorage.getItem('miniquiz_exams_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [completedRevision, setCompletedRevision] = useState(0);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);
  const [pendingExamOpts, setPendingExamOpts] = useState<{
    examId?: string;
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  } | null>(null);

  // Banner slides
  const bannerSlides = [
    {
      badge: 'মাদ্রাসা ও স্কুল নিবন্ধন স্পেশাল প্রোগ্রাম',
      title: 'মাদ্রাসা ও স্কুল নিবন্ধন স্পেশাল প্রোগ্রাম',
      description: 'প্রভাষক আরবি • সহকারী মৌলভী • ইবতেদায়ী প্রধান • লাইভ ক্লাস ও পূর্ণাঙ্গ হ্যান্ডনোট',
      btnText: 'কোর্সগুলো দেখুন',
      action: () => onTabNavigate && onTabNavigate('courses'),
    },
    {
      badge: '১৯তম শিক্ষক নিবন্ধন প্রস্তুতি',
      title: 'স্পেশাল মডেল টেস্ট ও ওএমআর লাইভ এক্সাম',
      description: 'নেগেটিভ মার্কিংসহ রিয়েল এক্সাম এনভায়রনমেন্ট ও জাতীয় মেধাতালিকা',
      btnText: 'পরীক্ষা দিন',
      action: () => onTabNavigate && onTabNavigate('exam'),
    },
    {
      badge: '২৪/৭ তামরীন এআই ওস্তাদ',
      title: 'যেকোনো আরবি ব্যাকরণ ও জটিল প্রশ্নের সমাধান',
      description: 'তাত্ক্ষণিক নির্ভুল তাহকীক, তারকীব ও পূর্ণাঙ্গ রেফারেন্সযুক্ত ব্যাখ্যা',
      btnText: 'প্রশ্ন করুন',
      action: () => onTabNavigate && onTabNavigate('ustad_ai'),
    },
  ];

  // Auto cycle banner slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  // Listen for exam completed events or storage changes to immediately remove completed exams from Home
  useEffect(() => {
    const handleExamCompleted = () => {
      setCompletedRevision((r) => r + 1);
    };

    window.addEventListener('tamreen_exam_completed', handleExamCompleted);
    window.addEventListener('storage', handleExamCompleted);
    window.addEventListener('focus', handleExamCompleted);

    return () => {
      window.removeEventListener('tamreen_exam_completed', handleExamCompleted);
      window.removeEventListener('storage', handleExamCompleted);
      window.removeEventListener('focus', handleExamCompleted);
    };
  }, []);

  // Load latest exams from Supabase or cache
  const [examineeCounts, setExamineeCounts] = useState<Record<string, number>>({});
  const [serverCompletedIds, setServerCompletedIds] = useState<string[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => getCachedBlogs().slice(0, 5));
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const refreshExams = (force: boolean = false) => {
      fetchExamsFromSupabase(force).then((res) => {
        if (res.exams) {
          setExams(res.exams);
        }
      });
      getDistinctExamParticipantCounts().then((counts) => {
        setExamineeCounts(counts || {});
      });
      import('../lib/supabase').then(mod => {
        mod.fetchUserCompletedExamsFromSupabase().then(ids => {
          setServerCompletedIds(ids.map(String));
        }).catch(() => {});
      });
    };

    refreshExams(false);

    fetchBlogPosts().then((posts) => {
      if (Array.isArray(posts)) {
        setBlogPosts(posts.slice(0, 5));
      }
    });

    const handleDataChanged = () => {
      refreshExams(true);
      fetchBlogPosts().then((posts) => {
        if (Array.isArray(posts)) {
          setBlogPosts(posts.slice(0, 5));
        }
      });
    };

    window.addEventListener('tamreen_data_changed', handleDataChanged);
    window.addEventListener('tamreen_exam_completed', handleDataChanged);
    window.addEventListener('tamreen_profile_updated', handleDataChanged);
    window.addEventListener('tamreen_auth_status_changed', handleDataChanged);
    window.addEventListener('tamreen_blog_changed', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);
    window.addEventListener('focus', handleDataChanged);
    return () => {
      window.removeEventListener('tamreen_data_changed', handleDataChanged);
      window.removeEventListener('tamreen_exam_completed', handleDataChanged);
      window.removeEventListener('tamreen_profile_updated', handleDataChanged);
      window.removeEventListener('tamreen_auth_status_changed', handleDataChanged);
      window.removeEventListener('tamreen_blog_changed', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
      window.removeEventListener('focus', handleDataChanged);
    };
  }, []);

  // Preset fallback live exams
  const defaultLiveExams: any[] = [];

  // Display live exams (at most 5 exams)
  const allLiveExams = exams.length > 0 ? exams : defaultLiveExams;
  const displayLiveExams = allLiveExams.slice(0, 5);

  const handleAttemptExam = (opts: {
    examId?: string;
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  }) => {
    const isDone = isExamCompleted(opts.examId, opts.examType) ||
      serverCompletedIds.some(id => {
        const cleanId = String(id).trim().toLowerCase();
        const targetId = String(opts.examId || '').trim().toLowerCase();
        const targetTitle = String(opts.examType || '').trim().toLowerCase();
        return (targetId && cleanId === targetId) || (targetTitle && cleanId === targetTitle);
      });

    if (isDone) {
      if (onReviewAnswers) {
        onReviewAnswers(opts);
      } else if (onTabNavigate) {
        onTabNavigate('exam');
      }
      return;
    }

    const profile = getUserProfile();
    const hasProfile = Boolean(profile && profile.name && profile.name.trim() !== '' && profile.name.trim() !== 'পরীক্ষার্থী');

    if (!hasProfile) {
      setPendingExamOpts(opts);
      setShowRegModal(true);
    } else {
      onStartPractice(opts);
    }
  };

  // Calculate stats
  const totalQuestionsCount = questions.length;
  const practicedCount = studentStats?.totalAnswered || studentStats?.totalAnsweredQuestions || 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-7 animate-fade-in mb-24 font-hind">
      {selectedBlogPost ? (
        <BlogDetailView
          post={selectedBlogPost}
          allPosts={blogPosts}
          onBack={() => setSelectedBlogPost(null)}
          onSelectPost={(post) => setSelectedBlogPost(post)}
        />
      ) : (
        <>
      {/* ========================================================================= */}
      {/* 1. HERO BANNER SLIDER (Exact Match to Screenshot 3) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#034232] via-[#056049] to-[#044a39] text-white p-5 sm:p-7 shadow-lg border border-emerald-800/40">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm font-bold text-emerald-200/90 leading-relaxed max-w-xl">
            {bannerSlides[currentBannerSlide].description}
          </p>

          {/* Action Button & Slider Dots */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={bannerSlides[currentBannerSlide].action}
              className="px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#F59E0B] hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>{bannerSlides[currentBannerSlide].btnText}</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>

            {/* Slider Dots */}
            <div className="flex items-center gap-1.5">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerSlide(idx)}
                  className={`transition-all rounded-full ${
                    currentBannerSlide === idx
                      ? 'w-6 h-2 bg-[#F59E0B]'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NOTICE / ANNOUNCEMENT TICKER BAR (Exact Match to Screenshot 3) */}
      {/* ========================================================================= */}
      <div 
        onClick={() => onTabNavigate && onTabNavigate('circular')}
        className="neu-card !rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Orange Notification Badge */}
          <span className="bg-[#F59E0B] text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shrink-0 shadow-2xs">
            <Bell className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>বিজ্ঞপ্তি</span>
          </span>

          {/* Marquee / Truncated Notice Text */}
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate font-hind">
            ১৯তম শিক্ষক নিবন্ধন (NTRCA) সার্কুলার ও আবেদন সম্পর্কিত সর্বশেষ আপডেট
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* ========================================================================= */}
      {/* 3. SIX QUICK ACTION CARDS (2 Rows x 3 Columns - Exact Match to Screenshot 3) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* 1. লাইভ ক্লাস */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center text-rose-500 shadow-2xs group-hover:scale-105 transition-transform">
            <Video className="w-6 h-6" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            লাইভ ক্লাস
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-500 dark:text-rose-400 leading-none">
            চলমান
          </span>
        </button>

        {/* 2. মডেল টেস্ট */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('exam')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-500 shadow-2xs group-hover:scale-105 transition-transform">
            <FileCheck className="w-6 h-6" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            মডেল টেস্ট
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-none">
            ৫০+ সেট
          </span>
        </button>

        {/* 3. তামরীন AI */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-slate-950 shadow-2xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 fill-slate-950 text-slate-950" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            তামরীন AI
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none">
            ডাউট সলভ
          </span>
        </button>

        {/* 4. ক্লাস রুটিন */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center text-sky-500 shadow-2xs group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            ক্লাস রুটিন
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-none">
            সাপ্তাহিক
          </span>
        </button>

        {/* 5. বিগত প্রশ্ন */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('subjects')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-purple-500 shadow-2xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            বিগত প্রশ্ন
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-none">
            ব্যাখ্যাসহ
          </span>
        </button>

        {/* 6. সব কোর্স */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('courses')}
          className="neu-card !rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/70 dark:border-slate-800 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#0b705c] dark:text-emerald-400 shadow-2xs group-hover:scale-105 transition-transform">
            <Bookmark className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight font-hind">
            সব কোর্স
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0b705c] dark:text-emerald-400 leading-none">
            স্পেশাল ছাড়
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. STATS OVERVIEW CARDS (2 Cards - Exact Match to Screenshot 3) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Left: মোট প্রশ্ন */}
        <div className="neu-card !rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs sm:text-sm font-bold font-hind">মোট প্রশ্ন</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-hind">
            {toBengaliNumeral(totalQuestionsCount)}টি
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
            সব বিষয় মিলিয়ে
          </p>
        </div>

        {/* Right: অনুশীলিত */}
        <div className="neu-card !rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs sm:text-sm font-bold font-hind">অনুশীলিত</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-hind">
            {toBengaliNumeral(practicedCount)}টি
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
            সর্বমোট উত্তর দেয়া
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. জনপ্রিয় শিক্ষক নিবন্ধন ও স্পেশাল ব্যাচ (Exact Match to Screenshot 1) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-[#0b705c] dark:text-emerald-400">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-hind">
                জনপ্রিয় শিক্ষক নিবন্ধন ও স্পেশাল ব্যাচ
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                সিলেবাসভিত্তিক মানসম্মত ক্লাস ও মক টেস্ট
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabNavigate && onTabNavigate('courses')}
            className="neu-pill !rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:scale-105 transition-all cursor-pointer shadow-2xs"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        {/* Course Card - বাংলা মডেল টেস্ট */}
        <div className="neu-card !rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/70 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Left Yellow / Cream Thumbnail Card */}
            <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-2xl bg-[#FEF9C3] dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-[#0B132B] text-amber-400 flex items-center justify-center mb-1 shadow-2xs">
                <Landmark className="w-4.5 h-4.5" />
              </div>
              <span className="bg-slate-950 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs leading-none">
                স্পেশাল ব্যাচ
              </span>
              <span className="text-[9px] font-bold text-slate-700 dark:text-amber-200 mt-1 truncate max-w-full leading-tight">
                বাংলা মডেল ট...
              </span>
            </div>

            {/* Middle Course Information */}
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind leading-snug">
                বাংলা মডেল টেস্ট
              </h3>

              {/* Enrollment Pill Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-[11px] font-bold">
                <User className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>০ জন ভর্তি</span>
              </div>

              {/* Meta Statistics Row */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 text-slate-600 dark:text-slate-400 text-xs font-medium pt-0.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>০ ক্লাস</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>০ শিট</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>০ পরীক্ষা</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Price & Details Action */}
          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-hind">
              ৳৪৯৯
            </div>

            <button
              onClick={() => onTabNavigate && onTabNavigate('courses')}
              className="px-6 py-2 rounded-full bg-[#0B132B] hover:bg-slate-900 text-white font-black text-xs cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <span>বিস্তারিত</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. চলমান লাইভ মডেল টেস্ট (Exact Match to Screenshot 1 & 2) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-[#F59E0B]">
              <Zap className="w-5 h-5 fill-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-hind">
                চলমান লাইভ মডেল টেস্ট
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                রিয়েলটাইম ওএমআর স্কোর ও জাতীয় মেধা তালিকা
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabNavigate && onTabNavigate('exam')}
            className="neu-pill !rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:scale-105 transition-all cursor-pointer shadow-2xs"
          >
            <span>সব পরীক্ষা</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        {/* Live Exam Cards List or All Completed Notice */}
        {displayLiveExams.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {displayLiveExams.map((exam, idx) => {
              const questionCount = exam.question_count || (exam.total_marks ? Number(exam.total_marks) : 10);
              const timeMinutes = exam.time_minutes || 5;
              const cleanId = String(exam.id || '').trim().toLowerCase();
              const countNum = examineeCounts[cleanId] ?? (examineeCounts[String(exam.id || '')] ?? 0);
              const examineeCount = `${toBengaliNumeral(countNum)} জন`;
              const subject = exam.subject || 'সাধারণ ও মাদ্রাসা কারিকুলাম';

              return (
                <div 
                  key={exam.id || `live-exam-${idx}`}
                  className="neu-card !rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5 hover:shadow-md transition-all"
                >
                  {/* Top Info Row */}
                  <div className="flex items-start gap-3.5">
                    {/* Left Squircle Document Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#0b705c] dark:text-emerald-400 shrink-0 shadow-2xs">
                      <FileText className="w-6 h-6" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Badge & Category Line */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full">
                          লাইভ এক্সাম
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                          সাধারণ ও মাদ্রাসা কারিকুলাম
                        </span>
                      </div>

                      {/* Exam Title */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind leading-snug">
                        {exam.title}
                      </h3>

                      {/* Metadata Line */}
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span>পূর্ণমান: <strong className="font-bold text-slate-800 dark:text-slate-200">{toBengaliNumeral(questionCount)}</strong></span>
                        <span>•</span>
                        <span>সময়: <strong className="font-bold text-slate-800 dark:text-slate-200">{toBengaliNumeral(timeMinutes)} মিনিট</strong></span>
                        <span>•</span>
                        <span>অংশগ্রহণকারী: <strong className="font-bold text-slate-800 dark:text-slate-200">{examineeCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Participated -> 'ব্যাখ্যা সহ উত্তর' + 'মেধাতালিকা'. Not Participated -> 'পরীক্ষায় অংশ নিন' */}
                  {isExamCompleted(exam.id, exam.title) || serverCompletedIds.some(id => {
                    const cleanId = String(id || '').trim().toLowerCase();
                    const targetId = String(exam.id || '').trim().toLowerCase();
                    const targetTitle = String(exam.title || '').trim().toLowerCase();
                    return (targetId && cleanId === targetId) || (targetTitle && cleanId === targetTitle);
                  }) ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          if (onReviewAnswers) {
                            onReviewAnswers({
                              examId: exam.id,
                              subject: subject,
                              questionCount: questionCount,
                              timeMinutes: timeMinutes,
                              examType: exam.title,
                            });
                          } else if (onTabNavigate) {
                            onTabNavigate('exam');
                          }
                        }}
                        className="py-3 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800 text-[#0b705c] dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#0b705c] dark:text-emerald-400 shrink-0" />
                        <span>ব্যাখ্যা সহ উত্তর</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenLeaderboard) {
                            onOpenLeaderboard(exam.id);
                          } else if (onTabNavigate) {
                            onTabNavigate('exam');
                          }
                        }}
                        className="py-3 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-95"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>মেধাতালিকা দেখুন</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAttemptExam({
                        examId: exam.id,
                        subject: subject,
                        questionCount: questionCount,
                        timeMinutes: timeMinutes,
                        examType: exam.title
                      })}
                      className="w-full py-3 px-4 rounded-2xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
                      <span>পরীক্ষায় অংশ নিন</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="neu-card !rounded-3xl p-5 sm:p-6 text-center border border-slate-200/70 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind">
                কোনো লাইভ মডেল টেস্ট পাওয়া যায়নি
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                নতুন লাইভ মডেল টেস্ট প্রকাশিত হলে এখানে দেখতে পাবেন। সমস্ত ক্যাটাগরির পরীক্ষা দেখতে 'পরীক্ষা দিন' ট্যাবে যান।
              </p>
            </div>
            <button
              onClick={() => onTabNavigate && onTabNavigate('exam')}
              className="px-5 py-2.5 rounded-full bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>সকল পরীক্ষা দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6.5. ব্লগ পোস্ট (সর্বোচ্চ ৫টি) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-[#0b705c] dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-hind">
                ব্লগ পোস্ট
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                শিক্ষক নিবন্ধন প্রস্তুতি ও শিক্ষামূলক সর্বশেষ প্রবন্ধ
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabNavigate && onTabNavigate('blogs')}
            className="neu-pill !rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:scale-105 transition-all cursor-pointer shadow-2xs"
          >
            <span>সব ব্লগ</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        {/* Blog Posts List */}
        {blogPosts.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {blogPosts.map((blog, idx) => (
              <div
                key={blog.id || `blog-${idx}`}
                onClick={() => {
                  setSelectedBlogPost(blog);
                }}
                className="neu-card !rounded-3xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-28 h-32 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700/60 relative">
                  <img
                    src={blog.thumbnail || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                    {blog.category}
                  </span>
                </div>

                {/* Content info */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {blog.published_date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {toBengaliNumeral(blog.reading_time_minutes || 5)} মিনিট পড়া
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind leading-snug group-hover:text-[#0b705c] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {blog.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                {/* Right Arrow */}
                <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#0b705c] dark:text-emerald-400 shrink-0 group-hover:bg-[#0b705c] group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neu-card !rounded-3xl p-5 sm:p-6 text-center border border-slate-200/70 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#0b705c] dark:text-emerald-400 mx-auto shadow-2xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind">
                কোনো ব্লগ পোস্ট পাওয়া যায়নি
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                অ্যাডমিন প্যানেল থেকে নতুন ব্লগ পোস্ট প্রকাশ করলে তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          </div>
        )}
      </section>
      {/* ========================================================================= */}
      <section className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-amber-50/80 via-yellow-50/40 to-amber-50/70 dark:from-[#131b2e] dark:via-[#162238] dark:to-[#131b2e] border border-amber-200/80 dark:border-amber-800/40 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Amber Squircle Sparkles Icon Box */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F59E0B] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 text-slate-950" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-base sm:text-lg font-black text-amber-500 dark:text-amber-400 font-hind leading-snug">
              আরবি ব্যাকরণ বা যেকোনো বিষয়ে সমস্যা?
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-emerald-300/90 leading-relaxed font-hind">
              তামরীন এআই আপনাকে দেবে শতভাগ সঠিক ও তথ্যবহুল সমাধান ২৪/৭!
            </p>
          </div>
        </div>

        {/* Full Width Golden-Orange Button */}
        <button
          onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#E68A00] hover:bg-[#CC7A00] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
          <span>তামরীন AI কে জিজ্ঞেস করুন</span>
        </button>
      </section>

      {/* User Registration Modal for direct exam attempts */}
      <UserRegistrationModal
        isOpen={showRegModal}
        onClose={() => {
          setShowRegModal(false);
          setPendingExamOpts(null);
        }}
        initialMode="register"
        title="পরীক্ষা শুরু করতে অ্যাকাউন্ট তৈরি করুন"
        onSaveSuccess={(profile: UserProfile) => {
          setShowRegModal(false);
          if (pendingExamOpts) {
            onStartPractice(pendingExamOpts);
            setPendingExamOpts(null);
          }
        }}
      />
        </>
      )}
    </div>
  );
};
