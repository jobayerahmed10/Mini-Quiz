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
  Trophy
} from 'lucide-react';
import { Question } from '../types';
import { ExamItem, fetchExamsFromSupabase, DEFAULT_EXAM_PRESETS } from '../lib/supabase';
import { SUBJECT_CATEGORIES, detectQuestionSubject } from '../lib/subjects';
import { toBengaliNumeral, isExamCompleted, getUserProfile, UserProfile } from '../lib/utils';
import { UserRegistrationModal } from './UserRegistrationModal';

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
  onOpenLeaderboard?: () => void;
  onReviewAnswers?: (options: ExamStartOptions) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({
  questions = [],
  onStartExam,
  onOpenLeaderboard,
  onReviewAnswers,
}) => {
  const [exams, setExams] = useState<ExamItem[]>(DEFAULT_EXAM_PRESETS);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'free' | 'weekly' | 'live'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Registration modal for users entering exam
  const [showRegModal, setShowRegModal] = useState(false);
  const [pendingStartOpts, setPendingStartOpts] = useState<ExamStartOptions | null>(null);

  const handleAttemptStartExam = (opts: ExamStartOptions) => {
    const profile = getUserProfile();
    if (profile && profile.name) {
      onStartExam(opts);
    } else {
      setPendingStartOpts(opts);
      setShowRegModal(true);
    }
  };

  const handleRegSaved = (profile: UserProfile) => {
    setShowRegModal(false);
    if (pendingStartOpts) {
      onStartExam(pendingStartOpts);
      setPendingStartOpts(null);
    }
  };

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchExamsFromSupabase();
    if (res.exams && res.exams.length > 0) {
      setExams(res.exams);
    } else {
      setExams(DEFAULT_EXAM_PRESETS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleShare = (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${exam.title}\nবিষয়: ${exam.subject}\nপ্রশ্ন: ${exam.question_count}টি, সময়: ${exam.time_minutes} মিনিট।\nতামরীন একাডেমিতে এখনই অংশগ্রহণ করুন!`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedId(exam.id);
      setTimeout(() => setCopiedId(null), 2500);
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
            onClick={() => setShowLeaderboardModal(true)}
            className="px-5 py-2.5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            <Trophy className="w-4 h-4 text-[#0B132B]" />
            <span>লাইভ মেধা তালিকা</span>
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
        {filteredExams.length === 0 ? (
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

            // Display question count matching specified exam.question_count if set, else availableCount
            const displayQuestionCount = exam.question_count && Number(exam.question_count) > 0
              ? (availableCount > 0 ? Math.min(Number(exam.question_count), availableCount) : Number(exam.question_count))
              : (availableCount > 0 ? availableCount : 15);
            const displayTotalMarks = displayQuestionCount;
            
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

                {/* Bottom Examinee Count & Status Tag */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 px-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.examinee_count || '২,৫০০+'} পরীক্ষার্থী</span>
                  </div>

                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {exam.examinee_tag || (isVip ? 'বিশেষ ভিআইপি' : 'আজকের টেস্ট')}
                  </span>
                </div>

                {/* Action Buttons: 2 buttons if completed, 1 button if not taken */}
                {isExamCompleted(exam.id, exam.title) ? (
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
                        } else {
                          handleAttemptStartExam({
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
                          onOpenLeaderboard();
                        }
                      }}
                      className="py-3 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-amber-100 transition-all active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>লিডারবোর্ড</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAttemptStartExam({
                      examId: exam.id,
                      subject: exam.subject,
                      questionCount: displayQuestionCount,
                      timeMinutes: displayTimeMinutes,
                      examType: exam.title,
                    })}
                    className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 ${
                      isVip
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0B132B]'
                        : 'bg-[#0B132B] hover:bg-slate-900 text-white border border-slate-800'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{isVip ? 'প্রিমিয়াম পরীক্ষা দিন' : 'ফ্রি পরীক্ষা দিন'}</span>
                  </button>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* User Registration Modal before starting exam */}
      <UserRegistrationModal
        isOpen={showRegModal}
        onClose={() => {
          setShowRegModal(false);
          setPendingStartOpts(null);
        }}
        onSaveSuccess={handleRegSaved}
      />
    </div>
  );
};
