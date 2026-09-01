import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft,
  Share2,
  Trophy,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Award
} from 'lucide-react';
import { QuizResult, UserAnswer, Question } from '../types';
import { toBengaliNumeral, getUserProfile, getUserUniqueId, isUserRegistered, OPTION_BENGLI_LABEL, formatArabicText, isFullyArabic } from '../lib/utils';
import { 
  fetchLeaderboardEntriesFromSupabase, 
  LeaderboardEntry,
  getExamLeaderboard,
  ExamLeaderboardItem
} from '../lib/supabase';
import { QuestionActionFooter } from './QuestionActionFooter';

interface ResultPageProps {
  result: QuizResult;
  onRetry: () => void;
  onNavigateHome: () => void;
  onOpenLeaderboard?: () => void;
  showHarakat?: boolean;
  initialViewMode?: 'summary' | 'explanation' | 'leaderboard';
}

interface ParticipantLeaderboardItem {
  id: string;
  rank: number;
  userName: string;
  userAvatar?: string;
  isCurrentUser: boolean;
  isGuest?: boolean;
  rollNumber?: string;
  correctCount: number;
  wrongCount: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  letterAvatar: string;
  rankBadgeBg: string;
  rankBadgeText: string;
  borderTheme: string;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetry,
  onNavigateHome,
  onOpenLeaderboard,
  showHarakat = true,
  initialViewMode = 'summary',
}) => {
  // Bottom Tab Mode: 'summary' (which contains statistics), 'leaderboard' (মেধাতালিকা), 'explanation' (ব্যাখ্যাসহ উত্তর)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'explanation'>('explanation');
  
  // Leaderboard data state
  const [leaderboardList, setLeaderboardList] = useState<ParticipantLeaderboardItem[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(1);
  const [totalParticipants, setTotalParticipants] = useState<number>(11);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(true);

  // User Profile
  const userProfile = getUserProfile();
  const currentUserName = userProfile?.name?.trim() || (result as any)?.userName || 'গেস্ট পরীক্ষার্থী';
  const currentUserAvatar = userProfile?.avatar;
  const examTitle = result.examTitle || result.selectedSubject || 'বাংলা মডেল টেস্ট';

  // Format Elapsed Time: 00:00:29
  const formatElapsedTime = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formattedTimeBengali = formatElapsedTime(result.timeTakenSeconds || 29);

  // Negative Marking Calculation: wrongCount * 0.25
  const negativeMarkVal = result.negativeMarks !== undefined 
    ? result.negativeMarks 
    : Number((result.wrongCount * 0.25).toFixed(2));
  
  const obtainedMarksVal = Math.max(0, Number((result.correctCount - negativeMarkVal).toFixed(2)));
  const isPassed = result.percentage >= 40;

  // Calculate score percentage (supporting both result.percentage and raw questions score)
  const scorePercentage = result.percentage !== undefined && result.percentage > 0
    ? result.percentage
    : (result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0);

  // Check if user achieved a score higher than 80%
  const isHighScore = scorePercentage > 80;
  const hasTriggeredConfetti = useRef(false);

  // Confetti celebration trigger with multi-stage burst effect
  const triggerCelebrationConfetti = () => {
    try {
      // Stage 1: Big center explosion
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#046A38', '#EAB308', '#0288D1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
        disableForReducedMotion: true,
      });

      // Stage 2: Left & Right side cannon streams
      const duration = 2400;
      const animationEnd = Date.now() + duration;
      const celebrationColors = ['#046A38', '#EAB308', '#0288D1', '#10B981', '#F59E0B'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.7 },
          colors: celebrationColors,
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.7 },
          colors: celebrationColors,
          disableForReducedMotion: true,
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      requestAnimationFrame(frame);
    } catch (err) {
      console.warn('Celebration confetti effect notice:', err);
    }
  };

  // Trigger confetti automatically when user achieves score higher than 80%
  useEffect(() => {
    if (isHighScore && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      const timer = setTimeout(() => {
        triggerCelebrationConfetti();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isHighScore]);

  // Load Leaderboard from Supabase / Server without default mock data
  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboardData() {
      setIsLoadingLeaderboard(true);
      try {
        const currentUserId = getUserUniqueId();
        const examIdToFetch = result.examId || result.selectedSubject || 'general';

        // 1. Fetch real leaderboard entries from RPC
        const rpcEntries = await getExamLeaderboard(examIdToFetch);

        // Map real participants by unique user ID or distinct guest key
        const candidatesMap = new Map<string, any>();

        const currentUserProfile = getUserProfile();
        const currentRoll = currentUserProfile?.roll_number || currentUserProfile?.student_id;
        const currentName = (currentUserProfile?.name || currentUserName || '').trim().toLowerCase();
        const isRegisteredUser = isUserRegistered();

        // Helper to check if an item belongs to the current user (registered or guest)
        const checkIsUser = (item: any, rawName: string) => {
          const itemIsGuest = Boolean(
            item.is_guest !== undefined
              ? item.is_guest
              : (!item.user_id || item.user_id.startsWith('guest_') || item.user_id.startsWith('anon_') || Boolean(item.guest_name))
          );
          if (isRegisteredUser) {
            // Strictly match registered user ID and ensure it is not a guest record
            if (!itemIsGuest && currentUserId && item.user_id && item.user_id === currentUserId) return true;
            return false;
          } else {
            // For Guest users: match by guest_id or active guest session
            if (itemIsGuest && currentUserId && (item.guest_id === currentUserId || item.user_id === currentUserId)) return true;
            if (itemIsGuest && currentName && ((item.user_name || '').trim().toLowerCase() === currentName || (item.guest_name || '').trim().toLowerCase() === currentName || rawName.toLowerCase() === currentName)) return true;
            return false;
          }
        };

        // Add from RPC
        for (const item of rpcEntries) {
          const rawName = (item.full_name || item.user_name || item.guest_name || '').trim();
          if (!rawName) continue;

          const isUser = checkIsUser(item, rawName);
          const isGuest = item.is_guest !== undefined
            ? item.is_guest
            : (!isRegisteredUser || !item.user_id || item.user_id.startsWith('guest_') || item.user_id.startsWith('anon_') || Boolean(item.guest_name));

          // Compute a stable distinct key for deduplicating participants
          let key: string;
          if (isUser) {
            key = '__CURRENT_USER__';
          } else if (!isGuest && item.user_id) {
            key = item.user_id.toLowerCase().trim();
          } else {
            // Guest participant key: use guest_id or name
            key = (item.guest_id || rawName || item.roll_number || item.student_id || 'anon').toLowerCase().trim();
          }

          const existingCandidate = candidatesMap.get(key);
          const itemScore = Number(item.score ?? (item as any).obtained_marks ?? item.correct_answers ?? 0);
          const itemTime = Number(item.time_taken_seconds ?? (item as any).time_taken ?? 999999);

          if (!existingCandidate) {
            candidatesMap.set(key, {
              name: rawName,
              avatar: isUser ? (currentUserAvatar || item.avatar_url) : item.avatar_url,
              isUser,
              isGuest,
              rollNumber: item.roll_number || item.student_id,
              correct: Number(item.correct_answers ?? item.score ?? 0),
              wrong: Number(item.wrong_answers ?? 0),
              score: itemScore,
              timeTakenSeconds: itemTime,
              submittedAt: item.submitted_at || new Date().toISOString(),
              userId: item.user_id,
            });
          } else {
            // Keep the best score / lowest time entry
            if (itemScore > existingCandidate.score || (itemScore === existingCandidate.score && itemTime < existingCandidate.timeTakenSeconds)) {
              candidatesMap.set(key, {
                ...existingCandidate,
                name: rawName,
                isUser: isUser || existingCandidate.isUser,
                correct: Number(item.correct_answers ?? item.score ?? 0),
                wrong: Number(item.wrong_answers ?? 0),
                score: itemScore,
                timeTakenSeconds: itemTime,
                submittedAt: item.submitted_at || existingCandidate.submittedAt,
              });
            }
          }
        }

        // Always ensure current user's latest submission is included
        const isCurrentSubmissionGuest = !isRegisteredUser;
        const effectiveCurrentUserName = currentUserName || (isCurrentSubmissionGuest ? 'গেস্ট পরীক্ষার্থী' : 'শিক্ষার্থী');
        const userKey = '__CURRENT_USER__';
        const timeTakenSeconds = result.timeTakenSeconds || 0;
        
        const existingUser = candidatesMap.get(userKey);
        if (!existingUser) {
          candidatesMap.set(userKey, {
            name: effectiveCurrentUserName,
            avatar: currentUserAvatar,
            isUser: true,
            isGuest: isCurrentSubmissionGuest,
            correct: result.correctCount,
            wrong: result.wrongCount,
            score: obtainedMarksVal,
            timeTakenSeconds: timeTakenSeconds,
            submittedAt: new Date().toISOString(),
            userId: currentUserId,
          });
        } else {
          // If local score is higher or equal, update the user entry
          if (obtainedMarksVal >= existingUser.score) {
            candidatesMap.set(userKey, {
              ...existingUser,
              name: effectiveCurrentUserName || existingUser.name,
              avatar: currentUserAvatar || existingUser.avatar,
              isUser: true,
              score: obtainedMarksVal,
              correct: result.correctCount,
              wrong: result.wrongCount,
              timeTakenSeconds: timeTakenSeconds || existingUser.timeTakenSeconds,
            });
          }
        }

        const allCandidates = Array.from(candidatesMap.values());

        // Sort: 1. Higher score first, 2. Lower timeTakenSeconds first, 3. Earlier submittedAt
        allCandidates.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.timeTakenSeconds !== b.timeTakenSeconds) return a.timeTakenSeconds - b.timeTakenSeconds;
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        });

        // Theme colors for cards matching Screenshot 3
        const getCardStyles = (rank: number) => {
          if (rank === 1) {
            return {
              borderTheme: 'border-amber-400 dark:border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs',
              rankBadgeBg: 'bg-amber-400 text-slate-950',
              rankBadgeText: '১ম স্থান',
              badgeColor: 'bg-amber-400 text-slate-950',
              numBadge: 'bg-amber-400 text-slate-950',
              avatarLetterBg: 'bg-[#00897B] text-white',
            };
          }
          if (rank === 2) {
            return {
              borderTheme: 'border-sky-400 dark:border-sky-500/80 bg-sky-50/20 dark:bg-sky-950/10 shadow-xs',
              rankBadgeBg: 'bg-sky-500 text-white',
              rankBadgeText: '২য় স্থান',
              badgeColor: 'bg-sky-500 text-white',
              numBadge: 'bg-sky-400 text-white',
              avatarLetterBg: 'bg-[#00897B] text-white',
            };
          }
          if (rank === 3) {
            return {
              borderTheme: 'border-amber-700/60 dark:border-amber-600/70 bg-amber-900/5 dark:bg-amber-950/20 shadow-xs',
              rankBadgeBg: 'bg-amber-700 text-white',
              rankBadgeText: '৩য় স্থান',
              badgeColor: 'bg-amber-700 text-white',
              numBadge: 'bg-amber-700 text-white',
              avatarLetterBg: 'bg-[#00695C] text-white',
            };
          }
          if (rank === 4) {
            return {
              borderTheme: 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs',
              rankBadgeBg: 'bg-emerald-600 text-white',
              rankBadgeText: `${toBengaliNumeral(rank)}র্থ স্থান`,
              badgeColor: 'bg-emerald-600 text-white',
              numBadge: 'bg-[#00897B] text-white',
              avatarLetterBg: 'bg-[#00695C] text-white',
            };
          }
          return {
            borderTheme: 'border-emerald-400 dark:border-emerald-700/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs',
            rankBadgeBg: 'bg-emerald-600 text-white',
            rankBadgeText: `${toBengaliNumeral(rank)}ম স্থান`,
            badgeColor: 'bg-emerald-600 text-white',
            numBadge: 'bg-[#00897B] text-white',
            avatarLetterBg: 'bg-[#00695C] text-white',
          };
        };

        let userFoundRank = allCandidates.length;

        const mapped: ParticipantLeaderboardItem[] = allCandidates.map((c, idx) => {
          const rank = idx + 1;
          if (c.isUser) {
            userFoundRank = rank;
          }
          const styles = getCardStyles(rank);
          const firstChar = c.name.charAt(0) || 'ম';

          const accuracy = result.totalQuestions > 0 
            ? Math.round((c.correct / result.totalQuestions) * 100) 
            : 100;

          return {
            id: `cand_${rank}_${idx}`,
            rank,
            userName: c.name,
            userAvatar: c.avatar,
            isCurrentUser: c.isUser,
            isGuest: c.isGuest,
            rollNumber: c.rollNumber,
            correctCount: c.correct,
            wrongCount: c.wrong,
            score: c.score,
            totalQuestions: result.totalQuestions,
            accuracy,
            letterAvatar: firstChar,
            rankBadgeBg: styles.rankBadgeBg,
            rankBadgeText: styles.rankBadgeText,
            borderTheme: styles.borderTheme,
          };
        });

        if (isMounted) {
          setLeaderboardList(mapped);
          setCurrentUserRank(userFoundRank);
          setTotalParticipants(mapped.length);
        }
      } catch (e) {
        console.error('Error fetching leaderboard in ResultPage:', e);
      } finally {
        if (isMounted) {
          setIsLoadingLeaderboard(false);
        }
      }
    }

    loadLeaderboardData();
    return () => { isMounted = false; };
  }, [result, currentUserName, currentUserAvatar, obtainedMarksVal]);

  const handleShareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: `${examTitle} - পরীক্ষার ফলাফল`,
        text: `তামরীন একাডেমিতে ${examTitle} পরীক্ষায় আমার প্রাপ্ত নম্বর: ${toBengaliNumeral(obtainedMarksVal)}/${toBengaliNumeral(result.totalQuestions)} (পজিশন: ${toBengaliNumeral(currentUserRank)}/${toBengaliNumeral(totalParticipants)})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const shareText = `তামরীন একাডেমি: ${examTitle} পরীক্ষায় আমার প্রাপ্ত নম্বর: ${toBengaliNumeral(obtainedMarksVal)}/${toBengaliNumeral(result.totalQuestions)}`;
      navigator.clipboard.writeText(shareText);
      alert('ফলাফল কপি করা হয়েছে!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#070D1E] pb-28 animate-fade-in font-hind">
      
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4">
        
        {/* 1. TOP DUAL ACTION BUTTONS (EXACT SCREENSHOT 1) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: পরীক্ষার তালিকায় ফিরে যান */}
          <button
            onClick={onNavigateHome}
            className="neu-card !rounded-2xl py-3 px-3 sm:px-4 flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-xs bg-white dark:bg-[#0D172A] border border-slate-200/80 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="truncate">পরীক্ষার তালিকায় ফিরে যান</span>
          </button>

          {/* Right: ফলাফল শেয়ার করুন */}
          <button
            onClick={handleShareResult}
            className="neu-card !rounded-2xl py-3 px-3 sm:px-4 flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs sm:text-sm hover:border-sky-400 active:scale-95 transition-all cursor-pointer shadow-xs bg-white dark:bg-[#0D172A] border border-sky-200 dark:border-sky-900/60"
          >
            <Share2 className="w-4 h-4 text-sky-500" />
            <span className="truncate">ফলাফল শেয়ার করুন</span>
          </button>
        </div>

        {/* 1.1 HIGH SCORE CELEBRATION BADGE (> 80%) */}
        {isHighScore && (
          <div 
            id="high-score-celebration-banner"
            className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 dark:from-amber-950/40 dark:via-emerald-950/40 dark:to-amber-950/40 border border-amber-400/50 dark:border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs animate-fade-in"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                    🎉 অসাধারণ ফলাফল! ({toBengaliNumeral(Math.round(scorePercentage))}%)
                  </span>
                  <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-black rounded-md bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                    ৮০%+ স্কোর
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  আপনি ৮০% এর বেশি নম্বর পেয়ে বিশেষ কৃতিত্ব অর্জন করেছেন!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerCelebrationConfetti}
              title="কনফেটি আবার দেখুন"
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">কনফেটি</span>
            </button>
          </div>
        )}

        {/* 2. USER PROFILE HERO BANNER (EXACT CYAN/BLUE BANNER IN SCREENSHOT 1) */}
        <div className="rounded-[28px] p-4 sm:p-5 bg-gradient-to-r from-[#0288D1] via-[#039BE5] to-[#29B6F6] text-white shadow-md flex items-center gap-4 relative overflow-hidden">
          {/* Avatar with rounded squircle */}
          <div className="relative shrink-0">
            {currentUserAvatar ? (
              <img
                src={currentUserAvatar}
                alt={currentUserName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 border-2 border-white/80 flex items-center justify-center text-white font-black text-xl shadow-md">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Name & Exam Title */}
          <div className="min-w-0 space-y-1 text-white">
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-white/90 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-white truncate drop-shadow-xs">
                {currentUserName}
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white/95 truncate">
              পরীক্ষা: {examTitle}
            </p>
          </div>
        </div>

        {/* 3. PERFORMANCE METRICS LIST (EXACT SCREENSHOTS 1 & 2) */}
        <div className="bg-white dark:bg-[#0D172A] rounded-[28px] divide-y divide-slate-100 dark:divide-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          
          {/* Row 1: মোট প্রশ্ন */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">মোট প্রশ্ন</span>
            <span className="text-slate-900 dark:text-white font-black text-sm sm:text-base">
              {toBengaliNumeral(result.totalQuestions)}
            </span>
          </div>

          {/* Row 2: অংশ গ্রহণকারী */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">অংশ গ্রহণকারী</span>
            <span className="text-slate-900 dark:text-white font-black text-sm sm:text-base">
              {toBengaliNumeral(totalParticipants)}
            </span>
          </div>

          {/* Row 3: সঠিক উত্তর */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">সঠিক উত্তর</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(result.correctCount)}
            </span>
          </div>

          {/* Row 4: ভুল উত্তর */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">ভুল উত্তর</span>
            <span className="text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(result.wrongCount)}
            </span>
          </div>

          {/* Row 5: নেগেটিভ মার্ক */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">নেগেটিভ মার্ক</span>
            <span className="text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(negativeMarkVal.toFixed(2))}
            </span>
          </div>

          {/* Row 6: বর্তমান পজিশন */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-sky-600 dark:text-sky-400 font-extrabold">বর্তমান পজিশন</span>
            <span className="text-sky-700 dark:text-sky-400 font-black text-sm sm:text-base">
              {currentUserRank}th of {totalParticipants}
            </span>
          </div>

          {/* Row 7: প্রাপ্ত নম্বর */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">প্রাপ্ত নম্বর</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(obtainedMarksVal)}
            </span>
          </div>

          {/* Row 8: রেজাল্ট */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">রেজাল্ট</span>
            <span className={`font-black text-sm sm:text-base ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>

          {/* Row 9: সময় গ্রহণ */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">সময় গ্রহণ</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono font-black text-sm sm:text-base tracking-wider">
              {formattedTimeBengali}
            </span>
          </div>

        </div>

        {/* 4. DUAL SWITCH TABS (মেধাতালিকা vs ব্যাখ্যাসহ উত্তর - EXACT SCREENSHOT 2 & 3) */}
        <div className="bg-slate-200/80 dark:bg-[#0B132B] p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 shadow-inner">
          
          {/* Tab 1: মেধাতালিকা */}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 fill-current" />
            <span>মেধাতালিকা</span>
          </button>

          {/* Tab 2: ব্যাখ্যাসহ উত্তর */}
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
              activeTab === 'explanation'
                ? 'bg-white dark:bg-[#0D172A] text-slate-900 dark:text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ব্যাখ্যাসহ উত্তর</span>
          </button>
        </div>

        {/* 5. TAB 1 CONTENT: LEADERBOARD LIST (EXACT SCREENSHOT 3) */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Header: অংশগ্রহণকারীদের মেধা তালিকা & আপনার অবস্থান */}
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-sm sm:text-base font-black">
                  অংশগ্রহণকারীদের মেধা তালিকা
                </h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  ({toBengaliNumeral(totalParticipants)} জন)
                </span>
              </div>

              {/* Your Rank Capsule */}
              <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-black shrink-0">
                আপনার অবস্থান: {toBengaliNumeral(currentUserRank)}তম
              </div>
            </div>

            {/* List of Leaderboard Cards */}
            <div className="space-y-3">
              {leaderboardList.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl p-3.5 sm:p-4 bg-white dark:bg-[#0D172A] border-2 transition-all flex items-center justify-between gap-3 ${item.borderTheme}`}
                  >
                    {/* Left: Number circle + Letter circle + Name & Accuracy */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Rank Number Circle Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                        item.rank === 1 
                          ? 'bg-amber-400 text-slate-950' 
                          : item.rank === 2 
                          ? 'bg-sky-400 text-white' 
                          : item.rank === 3 
                          ? 'bg-amber-700 text-white' 
                          : 'bg-[#00897B] text-white'
                      }`}>
                        {toBengaliNumeral(item.rank)}
                      </div>

                      {/* User Initial Circle / Avatar */}
                      {item.userAvatar ? (
                        <img
                          src={item.userAvatar}
                          alt={item.userName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#00897B] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          {item.letterAvatar}
                        </div>
                      )}

                      {/* Name & Subtitle Details */}
                      <div className="min-w-0 space-y-1">
                        {/* Name Capsule Badge or text */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="inline-block px-3 py-0.5 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[220px]">
                            {item.userName}
                          </div>
                          {item.isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                              আপনি
                            </span>
                          )}
                          {item.isGuest ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                              গেস্ট
                            </span>
                          ) : (
                            item.rollNumber && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 font-mono">
                                রোল: {item.rollNumber}
                              </span>
                            )
                          )}
                        </div>

                        {/* Rank Badge + Question & Accuracy */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.rank <= 3 && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                              item.rank === 1 ? 'bg-amber-400 text-slate-950' : item.rank === 2 ? 'bg-sky-500 text-white' : 'bg-amber-700 text-white'
                            }`}>
                              👑 {item.rankBadgeText}
                            </span>
                          )}

                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            পরীক্ষা • প্রশ্ন: {toBengaliNumeral(item.totalQuestions)}টি • একুরেসি: {toBengaliNumeral(item.accuracy)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores breakdown (সঠিক, ভুল, নাম্বার) */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                      {/* Correct */}
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">সঠিক</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {toBengaliNumeral(item.correctCount)}টি
                        </span>
                      </div>

                      {/* Wrong */}
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">ভুল</span>
                        <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                          {toBengaliNumeral(item.wrongCount)}টি
                        </span>
                      </div>

                      {/* Final Score */}
                      <div className="text-center pl-1 border-l border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500 block">নাম্বার</span>
                        <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                          {toBengaliNumeral(item.score)}/{toBengaliNumeral(item.totalQuestions)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TAB 2 CONTENT: DETAILED EXPLANATIONS (EXACT SCREENSHOT 2) */}
        {activeTab === 'explanation' && (
          <div className="space-y-4 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 text-[#046A38] dark:text-emerald-400">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  সকল প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা বিশ্লেষণ
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                মোট প্রশ্ন: {toBengaliNumeral(result.totalQuestions)}টি
              </span>
            </div>

            {/* Questions List */}
            {result.userAnswers.map((answer, index) => {
              const isCorrect = answer.isCorrect;
              const isAnswered = answer.selectedOption !== null;
              const isQuestionRtl = isFullyArabic(answer.questionText);

              return (
                <div
                  key={answer.questionId || index}
                  className={`bg-white dark:bg-[#0D172A] rounded-[28px] p-5 sm:p-6 shadow-xs space-y-4 transition-all border ${
                    !isAnswered
                      ? 'border-slate-200 dark:border-slate-800'
                      : isCorrect
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/10'
                      : 'border-rose-300/80 dark:border-rose-900/60 bg-rose-50/10'
                  }`}
                >
                  {/* Question Number + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {toBengaliNumeral(index + 1)}
                    </div>

                    {!isAnswered ? (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full font-bold text-xs border border-slate-200 dark:border-slate-700">
                        ⚪ অনুত্তরিত
                      </span>
                    ) : isCorrect ? (
                      <span className="px-3.5 py-1 bg-emerald-600 text-white rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                        <span>✓</span>
                        <span>সঠিক হয়েছে</span>
                      </span>
                    ) : (
                      <span className="px-3.5 py-1 bg-rose-600 text-white rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                        <span>✕</span>
                        <span>ভুল হয়েছে</span>
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <h4
                    dir={isQuestionRtl ? 'rtl' : 'ltr'}
                    className={`text-base sm:text-lg font-black text-[#0B132B] dark:text-white leading-relaxed ${
                      isQuestionRtl ? 'text-right font-arabic' : 'text-left'
                    }`}
                  >
                    {formatArabicText(answer.questionText, showHarakat)}
                  </h4>

                  {/* Options List */}
                  {(() => {
                    const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'] as const;
                    return (
                      <div className="space-y-2.5 pt-1">
                        {optionKeys.map((optionKey) => {
                          const optionText = answer.options[optionKey];
                          if (!optionText) return null;

                          const isSelected = answer.selectedOption === optionKey;
                          const isCorrectOption = answer.correctOption === optionKey;

                          let optionStyles = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                          let badgeStyles = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';

                          if (isCorrectOption) {
                            optionStyles = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-bold';
                            badgeStyles = 'bg-emerald-600 text-white';
                          } else if (isSelected && !isCorrect) {
                            optionStyles = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 font-bold';
                            badgeStyles = 'bg-rose-600 text-white';
                          }

                          return (
                            <div
                              key={optionKey}
                              className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${optionStyles}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${badgeStyles}`}>
                                  {OPTION_BENGLI_LABEL[optionKey]}
                                </span>
                                <span className="font-medium truncate">{optionText}</span>
                              </div>

                              {isCorrectOption && (
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                  সঠিক উত্তর
                                </span>
                              )}
                              {isSelected && !isCorrect && (
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
                                  আপনার উত্তর
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Question Actions Footer (Likes, Bookmarks, Reports, Explanations) */}
                  {(() => {
                    const questionObj: Question = {
                      id: answer.questionId,
                      question: answer.questionText,
                      option_a: answer.options.option_a,
                      option_b: answer.options.option_b,
                      option_c: answer.options.option_c,
                      option_d: answer.options.option_d,
                      correct_answer: answer.correctOption,
                      explanation: answer.explanation,
                    };
                    return (
                      <QuestionActionFooter
                        question={questionObj}
                        defaultExpanded={false}
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
