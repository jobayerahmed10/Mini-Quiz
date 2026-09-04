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
  Shield
} from 'lucide-react';
import { Question, TabRoute, BlogPost } from '../types';
import { toBengaliNumeral, getUserProfile, UserProfile, isExamCompleted, getCompletedExamIds } from '../lib/utils';
import { ExamItem, fetchExamsFromSupabase, getDistinctExamParticipantCounts, fetchBlogPosts, getCachedBlogs, toggleBlogBookmark, getLocalBookmarkedBlogIds, getTamreenLeaderboard, TamreenLeaderboardUser } from '../lib/supabase';
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
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<'iron' | 'bronze' | 'silver' | 'gold'>('iron');
  const [pendingExamOpts, setPendingExamOpts] = useState<{
    examId?: string;
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  } | null>(null);

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

  // Dynamic Leaderboard Data per League
  const [liveLeaderboard, setLiveLeaderboard] = useState<TamreenLeaderboardUser[]>([]);
  const [liveCurrentUserRank, setLiveCurrentUserRank] = useState<TamreenLeaderboardUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboard() {
      try {
        const profile = getUserProfile();
        const res = await getTamreenLeaderboard({
          periodType: 'this_week',
          pageNumber: 1,
          pageSize: 50,
          currentUserId: profile?.id || undefined,
        });
        if (isMounted && res) {
          setLiveLeaderboard(res.items || []);
          setLiveCurrentUserRank(res.currentUser || null);
        }
      } catch {
        if (isMounted) setLiveLeaderboard([]);
      }
    }
    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentUserProfile = getUserProfile();
  const currentUserName = currentUserProfile?.name && currentUserProfile.name !== 'Jobayer Ahmed' ? currentUserProfile.name : 'পরীক্ষার্থী';
  const currentUserPoints = liveCurrentUserRank?.total_points || 0;

  // Filter leaderboard based on active league
  const activeLeagueUsers = liveLeaderboard.filter((item) => {
    const pts = Number(item.total_points || 0);
    if (selectedLeague === 'iron') return pts <= 50;
    if (selectedLeague === 'bronze') return pts > 50 && pts <= 200;
    if (selectedLeague === 'silver') return pts > 200 && pts <= 500;
    if (selectedLeague === 'gold') return pts > 500;
    return true;
  });

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
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Archive className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                আর্কাইভ
              </span>
            </button>

            {/* 2. দ্রুত প্র্যাকটিস */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-100/70 dark:bg-yellow-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                দ্রুত প্র্যাকটিস
              </span>
            </button>

            {/* 3. মক পরীক্ষা */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('exam')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-100/70 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Pencil className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                মক পরীক্ষা
              </span>
            </button>

            {/* 4. চর্চা AI */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('ustad_ai')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                চর্চা AI
              </span>
            </button>

            {/* 5. আমার প্রস্তুতি */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                আমার প্রস্তুতি
              </span>
            </button>

            {/* 6. প্রশ্নব্যাংক */}
            <button
              onClick={() => onTabNavigate && onTabNavigate('subjects')}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-400/80 hover:shadow-sm active:scale-95 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-hind">
                প্রশ্নব্যাংক
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
          {/* 5. LEADERBOARD / LEAGUE SECTION (Exact Match to Screenshots 2, 3, 4) */}
          {/* ========================================================================= */}
          <section className="bg-slate-100/80 dark:bg-slate-800/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div 
                onClick={() => onOpenLeaderboard && onOpenLeaderboard()}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind group-hover:text-emerald-600 transition-colors">
                  লিডারবোর্ড | {selectedLeague === 'iron' ? 'আয়রন লীগ' : selectedLeague === 'bronze' ? 'ব্রোঞ্জ লীগ' : selectedLeague === 'silver' ? 'সিলভার লীগ' : 'গোল্ড লীগ'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {onOpenLeaderboard && (
                  <button
                    onClick={() => onOpenLeaderboard()}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>সম্পূর্ণ দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-2xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>১০</span>
                </div>
              </div>
            </div>

            {/* League Tabs Selector (Iron, Bronze, Silver, Gold) */}
            <div className="flex items-center justify-around gap-1 pt-1 pb-2">
              <button
                onClick={() => setSelectedLeague('iron')}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                  selectedLeague === 'iron' ? 'bg-slate-200 dark:bg-slate-700 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-400 text-slate-900 flex items-center justify-center shadow-2xs font-black text-xs">
                  🛡️
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">আয়রন</span>
              </button>

              <button
                onClick={() => setSelectedLeague('bronze')}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                  selectedLeague === 'bronze' ? 'bg-amber-100 dark:bg-amber-950/60 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs font-black text-xs">
                  🛡️
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">ব্রোঞ্জ</span>
              </button>

              <button
                onClick={() => setSelectedLeague('silver')}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                  selectedLeague === 'silver' ? 'bg-slate-200 dark:bg-slate-700 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-300 text-slate-900 flex items-center justify-center shadow-2xs font-black text-xs">
                  🛡️
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">সিলভার</span>
              </button>

              <button
                onClick={() => setSelectedLeague('gold')}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                  selectedLeague === 'gold' ? 'bg-yellow-100 dark:bg-yellow-950/60 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xs font-black text-xs">
                  👑
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">গোল্ড</span>
              </button>
            </div>

            {/* League Progress Bar */}
            <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>০</span>
                <span className="text-amber-500 flex items-center gap-0.5">⭐ {toBengaliNumeral(currentUserPoints)}</span>
                <span>১০০</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, (currentUserPoints / 100) * 100))}%` }} 
                />
              </div>
            </div>

            {/* Leaderboard List */}
            {activeLeagueUsers.length > 0 ? (
              <div className="space-y-2 bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3.5 border border-slate-200 dark:border-slate-800">
                {activeLeagueUsers.slice(0, 5).map((item) => (
                  <div
                    key={`${item.user_id}_${item.rank}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt={item.user_name}
                          className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                          {item.user_name ? item.user_name.charAt(0) : 'প'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-hind">
                          {item.user_name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {toBengaliNumeral(item.rank)}
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        {toBengaliNumeral(item.total_points)} পয়েন্ট
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-7 px-4 text-center space-y-1 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 font-hind">
                  এখনো কোনো মেধা তালিকা রেকর্ড নেই
                </p>
                <p className="text-[11px] text-slate-500">
                  পরীক্ষায় অংশগ্রহণ করে প্রথম স্থান অধিকার করুন!
                </p>
              </div>
            )}

            {/* Pinned Current User Rank Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {currentUserName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-hind">
                    {currentUserName} (আপনি)
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  {liveCurrentUserRank ? `${toBengaliNumeral(liveCurrentUserRank.rank)} তম` : '-'}
                </span>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {toBengaliNumeral(currentUserPoints)} পয়েন্ট
                </p>
              </div>
            </div>
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
        </>
      )}
    </div>
  );
};

