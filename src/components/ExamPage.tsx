import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Target, 
  Play, 
  Sparkles, 
  Search,
  Share2,
  GraduationCap,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Users,
  Flame,
  Layers,
  ChevronDown,
  RefreshCw,
  Copy,
  Crown,
  FileText,
  Trophy,
  X,
  ExternalLink,
  MessageSquare,
  Check,
  Send
} from 'lucide-react';
import { Question } from '../types';
import { 
  ExamItem, 
  fetchExamsFromSupabase, 
  fetchLeaderboardEntriesFromSupabase, 
  getDistinctExamParticipantCounts,
  fetchUserCompletedExamsFromSupabase,
  subscribeToExamsAndQuestionsTable 
} from '../lib/supabase';
import { SUBJECT_CATEGORIES, detectQuestionSubject } from '../lib/subjects';
import { toBengaliNumeral, formatBengaliDateWithDay, isExamCompleted, getUserProfile, UserProfile } from '../lib/utils';
import { UserRegistrationModal } from './UserRegistrationModal';
import { SharedExamEntranceCard } from './SharedExamEntranceCard';

interface ExamStartOptions {
  examId?: string;
  subject: string;
  questionCount: number;
  timeMinutes: number;
  examType: string;
}

interface ExamPageProps {
  questions?: Question[];
  onStartExam: (options: ExamStartOptions) => void;
  onOpenLeaderboard?: (examId?: string) => void;
  onReviewAnswers?: (options: ExamStartOptions) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({
  questions = [],
  onStartExam,
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
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'free' | 'weekly' | 'live'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const raw = localStorage.getItem('miniquiz_exams_cache');
      return !raw || JSON.parse(raw).length === 0;
    } catch {
      return true;
    }
  });
  const [examineeCounts, setExamineeCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Share Modal state
  const [activeShareExam, setActiveShareExam] = useState<ExamItem | null>(null);
  const [shareToast, setShareToast] = useState(false);

  // Shared Exam Big Entrance Card state
  const [previewEntranceExam, setPreviewEntranceExam] = useState<ExamItem | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [pendingStartOpts, setPendingStartOpts] = useState<ExamStartOptions | null>(null);

  const handleAttemptStartExam = (opts: ExamStartOptions) => {
    const isDone = isExamCompleted(opts.examId, opts.examType) ||
      serverCompletedIds.some(id => {
        const cleanId = String(id).trim().toLowerCase();
        const targetId = String(opts.examId || '').trim().toLowerCase();
        const targetTitle = String(opts.examType || '').trim().toLowerCase();
        return (targetId && cleanId === targetId) || (targetTitle && cleanId === targetTitle);
      });

    if (isDone) {
      if (onReviewAnswers) {
        onReviewAnswers({
          examId: opts.examId,
          subject: opts.subject,
          questionCount: opts.questionCount,
          timeMinutes: opts.timeMinutes,
          examType: opts.examType,
        });
      }
      return;
    }

    const profile = getUserProfile();
    if (profile && profile.name) {
      onStartExam(opts);
    } else {
      // Find matching exam item to display the rich entrance card
      const foundExam = exams.find(e => e.id === opts.examId || e.title === opts.examType);
      if (foundExam) {
        setPreviewEntranceExam(foundExam);
      } else {
        setPendingStartOpts(opts);
        setShowRegModal(true);
      }
    }
  };

  const handleRegSaved = (profile: UserProfile) => {
    setShowRegModal(false);
    if (pendingStartOpts) {
      onStartExam(pendingStartOpts);
      setPendingStartOpts(null);
    }
  };

  const [serverCompletedIds, setServerCompletedIds] = useState<string[]>([]);

  const loadExams = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const [res, distinctCounts, completedList] = await Promise.all([
        fetchExamsFromSupabase(forceRefresh),
        getDistinctExamParticipantCounts(),
        fetchUserCompletedExamsFromSupabase().catch(() => []),
      ]);

      if (res.exams) {
        setExams(res.exams);
      } else {
        setExams([]);
      }

      setExamineeCounts(distinctCounts || {});
      setServerCompletedIds(completedList.map(String));
    } catch (err) {
      console.warn('loadExams error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams(false);
  }, [loadExams]);

  useEffect(() => {
    const handleExamCompleted = () => {
      loadExams(true);
    };
    window.addEventListener('tamreen_exam_completed', handleExamCompleted);
    window.addEventListener('tamreen_profile_updated', handleExamCompleted);
    window.addEventListener('tamreen_auth_status_changed', handleExamCompleted);
    window.addEventListener('storage', handleExamCompleted);
    window.addEventListener('focus', handleExamCompleted);
    return () => {
      window.removeEventListener('tamreen_exam_completed', handleExamCompleted);
      window.removeEventListener('tamreen_profile_updated', handleExamCompleted);
      window.removeEventListener('tamreen_auth_status_changed', handleExamCompleted);
      window.removeEventListener('storage', handleExamCompleted);
      window.removeEventListener('focus', handleExamCompleted);
    };
  }, [loadExams]);

  useEffect(() => {
    const unsubscribe = subscribeToExamsAndQuestionsTable(() => {
      loadExams(true);
    });
    return () => {
      unsubscribe();
    };
  }, [loadExams]);

  const handleShare = (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveShareExam(exam);
  };

  const getExamShareUrl = (exam: ExamItem) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?exam=${encodeURIComponent(exam.id)}`;
  };

  const getExamShareText = (exam: ExamItem) => {
    return `📝 ${exam.title}\nবিষয়: ${exam.subject}\n⏱️ সময়: ${exam.time_minutes} মিনিট | ❓ প্রশ্ন: ${exam.question_count}টি\n\nআত-তামরীন একাডেমিতে বিনামূল্যে এই পরীক্ষা দিন!`;
  };

  const handleCopyLink = (exam: ExamItem) => {
    const text = `${getExamShareText(exam)}\n🔗 ${getExamShareUrl(exam)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleFacebookShare = (exam: ExamItem) => {
    const shareUrl = getExamShareUrl(exam);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500');
  };

  const handleWhatsAppShare = (exam: ExamItem) => {
    const text = `${getExamShareText(exam)}\n\nলিংক: ${getExamShareUrl(exam)}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async (exam: ExamItem) => {
    const shareData = {
      title: exam.title,
      text: getExamShareText(exam),
      url: getExamShareUrl(exam),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share error:', err);
      }
    } else {
      handleCopyLink(exam);
    }
  };

  // Filtered exams logic
  const filteredExams = exams.filter((e) => {
    // Category filter
    if (filterType !== 'all') {
      if (filterType === 'daily' && e.badge_type !== 'daily') return false;
      if (filterType === 'free' && e.badge_type !== 'free') return false;
      if (filterType === 'weekly' && e.badge_type !== 'weekly') return false;
      if (filterType === 'live' && e.badge_type !== 'live') return false;
    }

    // Subject filter
    if (selectedSubject !== 'all' && e.subject !== selectedSubject) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchSubject = e.subject.toLowerCase().includes(q);
      const matchBadge = e.badge.toLowerCase().includes(q);
      return matchTitle || matchSubject || matchBadge;
    }

    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 mb-24 space-y-5">
      
      {/* 1. Top Navy Blue Header Banner Card */}
      <div className="bg-[#0B132B] dark:bg-[#070D1E] text-white p-6 sm:p-8 rounded-[28px] shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-black px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              লাইভ কুইজ ও প্রিলিমিনারি মডেল টেস্ট
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              পরীক্ষা দিন
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-300/90">
              ফ্রিতে পরীক্ষার প্রস্তুতি নিন
            </p>
          </div>

          <button
            onClick={() => onOpenLeaderboard && onOpenLeaderboard()}
            className="px-5 py-2.5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            <Trophy className="w-4 h-4 text-[#0B132B]" />
            <span>লিডারবোর্ড</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filters Container (Styled like Tamreen Academy UI) */}
      <div className="neu-card p-4 sm:p-5 rounded-[24px] space-y-3.5">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পরীক্ষার নাম, বিষয় বা প্রশ্নপত্র দিয়ে খুঁজুন (যেমন: আরবি ব্যাকরণ)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0D172A] border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              filterType === 'all'
                ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>সবগুলো</span>
          </button>

          <button
            onClick={() => setFilterType('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              filterType === 'daily'
                ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>দৈনিক মডেল টেস্ট</span>
          </button>

          <button
            onClick={() => setFilterType('free')}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              filterType === 'free'
                ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>ফ্রি এক্সাম</span>
          </button>

          <button
            onClick={() => setFilterType('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              filterType === 'weekly'
                ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>সাপ্তাহিক মেগা</span>
          </button>
        </div>

        {/* Dropdown Filters (Subject & Sort) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Subject Dropdown */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-[#0D172A] border border-slate-200 dark:border-slate-700/80 rounded-2xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📖 সকল বিষয়</option>
              {SUBJECT_CATEGORIES.filter(s => s.id !== 'all').map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
              className="w-full appearance-none bg-slate-50 dark:bg-[#0D172A] border border-slate-200 dark:border-slate-700/80 rounded-2xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="latest">⚡ সর্বশেষ প্রকাশিত</option>
              <option value="popular">🔥 সর্বাধিক জনপ্রিয়</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Copy Notification Toast */}
      {copiedId && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>পরীক্ষার লিংক ও তথ্য কপি করা হয়েছে!</span>
        </div>
      )}

      {/* 4. Exam Cards List (Matches Screenshots 1, 2, 3) */}
      <div className="space-y-4">
        {isLoading && exams.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="neu-card p-5 sm:p-6 rounded-[28px] border-2 border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                </div>
                <div className="h-12 bg-slate-200 dark:bg-slate-700/80 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="neu-card p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              কোনো পরীক্ষা খুঁজে পাওয়া যায়নি।
            </p>
            <p className="text-xs text-slate-400">
              অন্য বিষয় সিলেক্ট করুন অথবা এডমিন প্যানেল থেকে নতুন টেস্ট যুক্ত করুন।
            </p>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isVip = exam.is_premium || exam.badge_type === 'weekly';
            const isLive = exam.badge_type === 'live';

            // Calculate actual available questions for this exam/subject from database
            const getMatchingQuestionCount = (subjName: string) => {
              if (!questions || questions.length === 0) return 0;
              if (!subjName || subjName === 'all' || subjName === 'সকল বিষয়' || subjName.includes('সকল')) {
                return questions.length;
              }
              return questions.filter((q) => {
                if (q.subject && (q.subject.toLowerCase().includes(subjName.toLowerCase()) || subjName.toLowerCase().includes(q.subject.toLowerCase()))) {
                  return true;
                }
                const detected = detectQuestionSubject(q);
                return detected === subjName || subjName.includes(detected) || detected.includes(subjName);
              }).length;
            };

            const availableCount = getMatchingQuestionCount(exam.subject);

            const explicitCodesCount = exam.selected_question_codes?.length || exam.question_ids?.length;
            const displayQuestionCount = explicitCodesCount && explicitCodesCount > 0
              ? explicitCodesCount
              : (exam.question_count && Number(exam.question_count) > 0
                ? Number(exam.question_count)
                : (availableCount > 0 ? availableCount : 20));
            const displayTotalMarks = exam.total_marks || displayQuestionCount;
            
            const displayTimeMinutes = exam.time_minutes || Math.max(5, Math.round(displayQuestionCount * 0.7));

            return (
              <div
                key={exam.id}
                className={`neu-card p-5 sm:p-6 rounded-[28px] border-2 transition-all relative overflow-hidden ${
                  isVip
                    ? 'border-amber-400/80 dark:border-amber-500/60 bg-gradient-to-br from-amber-50/40 to-white dark:from-[#111A2E] dark:to-[#0D172A]'
                    : isLive
                    ? 'border-rose-400/80 dark:border-rose-500/60 bg-gradient-to-br from-rose-50/40 to-white dark:from-[#111A2E] dark:to-[#0D172A]'
                    : 'border-emerald-500/60 dark:border-emerald-600/50'
                }`}
              >
                {/* Top Row: Icon + Badge Pills + Share Button */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Left Icon Badge */}
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b705c] dark:text-emerald-400">
                      {isVip ? (
                        <Crown className="w-4 h-4 text-amber-500" />
                      ) : isLive ? (
                        <Zap className="w-4 h-4 text-rose-500" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>

                    {/* Badge Pill */}
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                      isVip
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : isLive
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    }`}>
                      {exam.badge || 'দৈনিক মডেল টেস্ট'}
                    </span>
                  </div>

                  {/* Right Actions: Free Badge + Share Button (Share hidden for premium/VIP exams) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-[#0b705c] dark:text-emerald-400 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span>{isVip ? 'ভিআইপি' : 'ফ্রি'}</span>
                    </span>

                    {/* Hide share button on premium exams */}
                    {!isVip && (
                      <button
                        onClick={(e) => handleShare(exam, e)}
                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-[#0b705c] dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-[11px] font-extrabold rounded-full flex items-center gap-1 cursor-pointer transition-colors border border-emerald-300/80 dark:border-emerald-800"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>শেয়ার</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Exam Title */}
                <h2 className="text-lg sm:text-xl font-black text-[#0B132B] dark:text-white leading-snug mb-1">
                  {exam.title}
                </h2>

                {/* Subject Name */}
                <p className="text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 mb-4">
                  বিষয়: <span className="text-[#0B132B] dark:text-amber-300">{exam.subject}</span>
                </p>

                {/* 3 Stat Badges (Time, Questions, Marks) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  <div className="bg-slate-100 dark:bg-slate-800/80 py-2 px-3 rounded-2xl text-center flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0b705c] dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {toBengaliNumeral(displayTimeMinutes)} মি.
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800/80 py-2 px-3 rounded-2xl text-center flex items-center justify-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0b705c] dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {toBengaliNumeral(displayQuestionCount)} প্রশ্ন
                    </span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800/80 py-2 px-3 rounded-2xl text-center flex items-center justify-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {toBengaliNumeral(displayTotalMarks)} নম্বর
                    </span>
                  </div>
                </div>

                {/* Bottom Examinee Count & Publication Date/Day */}
                {(() => {
                  const cleanId = String(exam.id || '').trim().toLowerCase();
                  const actualCount = examineeCounts[cleanId] ?? (examineeCounts[String(exam.id || '')] ?? 0);
                  return (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 px-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{toBengaliNumeral(actualCount)} জন পরীক্ষার্থী</span>
                      </div>

                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] sm:text-xs">
                        {formatBengaliDateWithDay(exam.created_at)}
                      </span>
                    </div>
                  );
                })()}

                {/* Action Buttons: Before exam -> Only 'পরীক্ষা দিন' full width. After exam -> 'ব্যাখ্যা সহ উত্তর' + 'মেধাতালিকা' */}
                {isExamCompleted(exam.id, exam.title) || serverCompletedIds.some(id => {
                  const cleanId = String(id).trim().toLowerCase();
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
                            subject: exam.subject,
                            questionCount: displayQuestionCount,
                            timeMinutes: displayTimeMinutes,
                            examType: exam.title,
                          });
                        }
                      }}
                      className="py-3 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800 text-[#0b705c] dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-emerald-100 transition-all active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#0b705c] dark:text-emerald-400 shrink-0" />
                      <span>ব্যাখ্যা সহ উত্তর</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenLeaderboard) {
                          onOpenLeaderboard(exam.id);
                        }
                      }}
                      className="py-3 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-amber-100 transition-all active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>মেধাতালিকা</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => handleAttemptStartExam({
                        examId: exam.id,
                        subject: exam.subject,
                        questionCount: displayQuestionCount,
                        timeMinutes: displayTimeMinutes,
                        examType: exam.title,
                      })}
                      className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 ${
                        isVip
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0B132B]'
                          : 'bg-[#0B132B] hover:bg-slate-900 text-white border border-slate-800'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{isVip ? 'প্রিমিয়াম পরীক্ষা দিন' : 'পরীক্ষা দিন'}</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Big Card Landing Modal for Exam Entrance */}
      {previewEntranceExam && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
          onClick={() => setPreviewEntranceExam(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
            <SharedExamEntranceCard
              examId={previewEntranceExam.id}
              title={previewEntranceExam.title}
              subject={previewEntranceExam.subject}
              category={previewEntranceExam.subject.includes('বাংলা') ? 'BENGALI LESSON' : 'EXAM LESSON'}
              instructor="প্রভাষক আরবি"
              institution="আত-তামরীন একাডেমি"
              timeMinutes={previewEntranceExam.time_minutes || 5}
              questionCount={previewEntranceExam.question_count || 20}
              negativeMark="-০.২৫"
              onClose={() => setPreviewEntranceExam(null)}
              onReviewAnswers={() => {
                const targetExam = previewEntranceExam;
                setPreviewEntranceExam(null);
                if (onReviewAnswers) {
                  onReviewAnswers({
                    examId: targetExam.id,
                    subject: targetExam.subject,
                    questionCount: targetExam.question_count,
                    timeMinutes: targetExam.time_minutes,
                    examType: targetExam.title,
                  });
                }
              }}
              onOpenLeaderboard={() => {
                const targetExam = previewEntranceExam;
                setPreviewEntranceExam(null);
                if (onOpenLeaderboard) {
                  onOpenLeaderboard(targetExam.id);
                }
              }}
              onStartExam={(studentName) => {
                const targetExam = previewEntranceExam;
                setPreviewEntranceExam(null);
                onStartExam({
                  examId: targetExam.id,
                  subject: targetExam.subject,
                  questionCount: targetExam.question_count,
                  timeMinutes: targetExam.time_minutes,
                  examType: targetExam.title,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* User Registration Modal before starting exam */}
      <UserRegistrationModal
        isOpen={showRegModal}
        onClose={() => {
          setShowRegModal(false);
          setPendingStartOpts(null);
        }}
        onSaveSuccess={handleRegSaved}
      />

      {/* Social Share Modal */}
      {activeShareExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] max-w-md w-full rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
            <button
              onClick={() => setActiveShareExam(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 rounded-2xl text-[#0b705c] dark:text-emerald-400">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#0B132B] dark:text-white">
                  পরীক্ষা শেয়ার করুন
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  বন্ধুদের সাথে শেয়ার করে মেধা তালিকায় প্রতিযোগিতা করুন!
                </p>
              </div>
            </div>

            {/* Exam Card Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <p className="font-black text-sm text-[#0B132B] dark:text-white">
                {activeShareExam.title}
              </p>
              <p className="text-xs font-extrabold text-[#0b705c] dark:text-amber-300">
                বিষয়: {activeShareExam.subject}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs font-bold text-slate-500">
                <span>⏱️ {toBengaliNumeral(activeShareExam.time_minutes)} মিনিট</span>
                <span>•</span>
                <span>❓ {toBengaliNumeral(activeShareExam.question_count)}টি প্রশ্ন</span>
              </div>
            </div>

            {/* Share Options Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Facebook Share */}
              <button
                onClick={() => handleFacebookShare(activeShareExam)}
                className="py-3 px-4 rounded-2xl bg-[#1877F2] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ফেসবুকে শেয়ার</span>
              </button>

              {/* WhatsApp Share */}
              <button
                onClick={() => handleWhatsAppShare(activeShareExam)}
                className="py-3 px-4 rounded-2xl bg-[#25D366] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#22bf5b] transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>হোয়াটসঅ্যাপ</span>
              </button>

              {/* Native Mobile Share */}
              <button
                onClick={() => handleNativeShare(activeShareExam)}
                className="py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>অন্যান্য অ্যাপস</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => handleCopyLink(activeShareExam)}
                className="py-3 px-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#0b705c] dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition-all cursor-pointer col-span-2 sm:col-span-1"
              >
                {shareToast ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>লিংক কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            {shareToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-center text-xs font-black animate-fade-in shadow-md">
                ✓ শেয়ারিং বিবরণ ও লিংক ক্লিপবোর্ডে কপি হয়েছে!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
