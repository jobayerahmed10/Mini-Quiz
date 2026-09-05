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
  Trophy,
  Archive,
  Pencil,
  CheckSquare,
  Newspaper,
  Plus,
  Radio,
  Star,
  Shield,
  Lock
} from 'lucide-react';
import { Question, TabRoute, BlogPost } from '../types';
import { toBengaliNumeral, getUserProfile, UserProfile, isExamCompleted, getCompletedExamIds, isUserPremium } from '../lib/utils';
import { ExamItem, fetchExamsFromSupabase, getDistinctExamParticipantCounts, fetchBlogPosts, getCachedBlogs, toggleBlogBookmark, getLocalBookmarkedBlogIds, getTamreenLeaderboard, TamreenLeaderboardUser } from '../lib/supabase';
import { UserRegistrationModal } from './UserRegistrationModal';
import { BlogDetailView } from './BlogDetailView';
import { LeaderboardView } from './LeaderboardView';
import { PremiumEnrollmentModal } from './PremiumEnrollmentModal';

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
  onTabNavigate?: (tab: TabRoute, subTab?: 'mock' | 'quick') => void;
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
  const [showRegModal, setShowRegModal] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(() => isUserPremium());
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [pendingExamOpts, setPendingExamOpts] = useState<{
    examId?: string;
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  } | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setIsPremium(isUserPremium());
    };
    window.addEventListener('tamreen_premium_updated', handleSync);
    window.addEventListener('tamreen_premium_status_changed', handleSync);
    window.addEventListener('tamreen_unlocked_posts_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tamreen_premium_updated', handleSync);
      window.removeEventListener('tamreen_premium_status_changed', handleSync);
      window.removeEventListener('tamreen_unlocked_posts_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Listen for exam completed events
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

  // Load latest exams & blog posts
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

  // Weekly exams list fallback
  const fallbackWeeklyExams = [
    {
      id: 'weekly-1',
      subtitle: 'Daily Exam-167',
      title: '51st BCS PRELIMINARY ROADMAP',
      timeLeft: '৬ ঘন্টা বাকি',
      isLive: true,
      questionCount: 10,
      timeMinutes: 5,
      subject: 'সাধারণ জ্ঞান ও বিসিএস'
    },
    {
      id: 'weekly-2',
      subtitle: 'ডেইলি এক্সাম-১৬৮',
      title: '19th NTRCA PRELI EXAM',
      timeLeft: '৬ ঘন্টা বাকি',
      isLive: true,
      questionCount: 10,
      timeMinutes: 5,
      subject: 'শিক্ষক নিবন্ধন'
    },
    {
      id: 'weekly-3',
      subtitle: 'স্পেশাল মক-০৩',
      title: 'প্রাথমিক শিক্ষক নিয়োগ মডেল টেস্ট',
      timeLeft: '১২ ঘন্টা বাকি',
      isLive: true,
      questionCount: 15,
      timeMinutes: 10,
      subject: 'প্রাথমিক সহকারী শিক্ষক'
    },
    {
      id: 'weekly-4',
      subtitle: 'ডেইলি এক্সাম-১৬৯',
      title: 'সমাজসেবা অধিদপ্তর সমাজকর্মী পরীক্ষা',
      timeLeft: '১ দিন বাকি',
      isLive: true,
      questionCount: 10,
      timeMinutes: 5,
      subject: 'সমাজসেবা অধিদপ্তর'
    }
  ];

  const displayWeeklyExams = exams.length > 0 ? exams.map(e => ({
    id: e.id,
    subtitle: `Daily Exam-${e.id.slice(-3)}`,
    title: e.title,
    timeLeft: '৬ ঘন্টা বাকি',
    isLive: true,
    questionCount: e.question_count || 10,
    timeMinutes: e.time_minutes || 5,
    subject: e.subject || 'সাধারণ ও মাদ্রাসা কারিকুলাম'
  })) : fallbackWeeklyExams;

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

  // Preparation items
  const prepItems = [
    { name: '19th NTRCA Road...', percent: 8 },
    { name: 'BCS Preli Question...', percent: 5 },
    { name: 'সমাজসেবা অধিদপ্তর...', percent: 6 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-5 sm:space-y-6 animate-fade-in mb-24 font-hind">
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
          {/* 1. "এই সপ্তাহের পরীক্ষাসমূহ" SLIDER SECTION */}
          {/* ========================================================================= */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind">
                এই সপ্তাহের পরীক্ষাসমূহ
              </h2>
              <button
                onClick={() => onTabNavigate && onTabNavigate('exam')}
                className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#046A38] transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>রুটিন দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Horizontal Exam Cards Scroll */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-0.5">
              {displayWeeklyExams.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleAttemptExam({
                    examId: ex.id,
                    subject: ex.subject,
                    questionCount: ex.questionCount,
                    timeMinutes: ex.timeMinutes,
                    examType: ex.title
                  })}
                  className="min-w-[260px] sm:min-w-[300px] bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between shrink-0 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {ex.subtitle}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center animate-pulse">
                        <Radio className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind leading-snug group-hover:text-[#046A38] transition-colors line-clamp-2">
                      {ex.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 mt-3 pt-2 border-t border-amber-200/50 dark:border-slate-700/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ex.timeLeft}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. 8 QUICK ACTION GRID BUTTONS (2 Rows x 4 Columns - App Exact) */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. আর্কাইভ */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('circulars')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group relative"
            >
              {!isPremium && (
                <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Lock className="w-3 h-3" />
                </span>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                আর্কাইভ
              </span>
            </button>

            {/* 2. দ্রুত প্র্যাকটিস */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects', 'quick')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group relative"
            >
              {!isPremium && (
                <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Lock className="w-3 h-3" />
                </span>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-100/70 dark:bg-yellow-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                দ্রুত প্র্যাকটিস
              </span>
            </button>

            {/* 3. মক পরীক্ষা */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects', 'mock')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group relative"
            >
              {!isPremium && (
                <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Lock className="w-3 h-3" />
                </span>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-100/70 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Pencil className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                মক পরীক্ষা
              </span>
            </button>

            {/* 4. তামরীন AI */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                তামরীন AI
              </span>
            </button>

            {/* 5. আমার প্রস্তুতি */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects', 'mock')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                আমার প্রস্তুতি
              </span>
            </button>

            {/* 6. পরীক্ষা (পূর্ববর্তী প্রশ্নব্যাংকের পরিবর্তে) */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('exam')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                পরীক্ষা
              </span>
            </button>

            {/* 7. লিডারবোর্ড */}
            <button
              onClick={() => onOpenLeaderboard ? onOpenLeaderboard() : (onTabNavigate && onTabNavigate('exam'))}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                লিডারবোর্ড
              </span>
            </button>

            {/* 8. ব্লগপোস্ট (Replaces Flash News) */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('blogs')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100/70 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Newspaper className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                ব্লগপোস্ট
              </span>
            </button>
          </section>

          {/* ========================================================================= */}
          {/* 3. "আমার প্রস্তুতি" PROGRESS GAUGES SECTION */}
          {/* ========================================================================= */}
          <section className="bg-white dark:bg-slate-800/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind">
                আমার প্রস্তুতি
              </h2>
              <button
                onClick={() => onTabNavigate && onTabNavigate('subjects')}
                className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#046A38] transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>সবগুলো দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gauges Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
              {prepItems.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-1.5">
                  <div className="relative w-20 h-11 flex items-end justify-center overflow-hidden">
                    <svg className="w-20 h-20 -rotate-180" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200 dark:text-slate-700"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray="50, 100"
                      />
                      <path
                        className="text-emerald-500"
                        strokeWidth="3.5"
                        strokeDasharray={`${item.percent * 2.5}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute bottom-0 text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                      {toBengaliNumeral(item.percent)}%
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Add New Preparation Button */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100 transition-colors cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>নতুন প্রস্তুতি যোগ করুন</span>
            </button>
          </section>

          {/* ========================================================================= */}
          {/* 4. "আজকের ব্লগপোস্ট" SECTION (Replacing Flash News) */}
          {/* ========================================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind">
                আজকের ব্লগপোস্ট
              </h2>
              <button
                onClick={() => onTabNavigate && onTabNavigate('blogs')}
                className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#046A38] transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span>সবগুলো দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {blogPosts.length > 0 ? (
              <div className="space-y-2.5">
                {blogPosts.slice(0, 3).map((blog, idx) => (
                  <div
                    key={blog.id || `home-blog-${idx}`}
                    onClick={() => setSelectedBlogPost(blog)}
                    className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={blog.thumbnail || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-block">
                        {blog.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-hind truncate group-hover:text-[#046A38] transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {blog.excerpt}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500 font-bold">
                কোনো সাম্প্রতিক ব্লগ পোস্ট পাওয়া যায়নি
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 5. APP'S REAL LEADERBOARD SECTION */}
          {/* ========================================================================= */}
          <section className="pt-2">
            <LeaderboardView
              initialExamId="all"
              isModal={false}
              onReviewAnswers={onReviewAnswers}
            />
          </section>

          {/* User Registration Modal */}
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
          {/* Premium Enrollment Modal */}
          <PremiumEnrollmentModal
            isOpen={showPremiumModal}
            onClose={() => setShowPremiumModal(false)}
          />
        </>
      )}
    </div>
  );
};

