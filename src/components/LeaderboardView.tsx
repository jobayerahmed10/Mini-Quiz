import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trophy, Sparkles, User, RefreshCw, Filter, ChevronDown, X, BookOpen } from 'lucide-react';
import { toBengaliNumeral, getUserProfile, getUserUniqueId, isUserRegistered } from '../lib/utils';
import { 
  LeaderboardEntry, 
  fetchLeaderboardEntriesFromSupabase, 
  fetchExamsFromSupabase, 
  ExamItem,
  getExamLeaderboard,
  getFreeOverallLeaderboard,
  ExamLeaderboardItem,
  FreeOverallLeaderboardItem,
  subscribeToLeaderboard
} from '../lib/supabase';

export type LeaderboardFilterType = 'today' | 'this_week' | 'this_month' | 'all_time' | 'this_exam';

export interface LeaderboardDisplayItem {
  id: string;
  rank: number;
  userName: string;
  userAvatar?: string;
  isCurrentUser: boolean;
  isGuest?: boolean;
  rollNumber?: string;
  
  testCount: number;      // e.g., 1টি পরীক্ষা or ৪টি পরীক্ষা
  avgAccuracy: number;    // e.g., 6% or 1%
  points: number;         // sum of correct answers (1 correct = 1 point)
  
  totalQuestions: number; // total questions in the test (e.g., 30 or 10)
  correctCount: number;
  wrongCount: number;
  score: number;
  examTitle?: string;
  
  createdAt: string;
}

function getLetterAvatar(name: string) {
  if (!name || name.trim() === '') return 'প';
  const clean = name.replace(/^(মাওলানা|মুহাম্মদ|মুহাঃ|মোছাম্মৎ|মোছাঃ|মোঃ|ড\.|হাফেজ)\s+/i, '').trim();
  return clean[0] || name[0] || 'প';
}

function getRankBadgeText(rank: number) {
  if (rank === 1) return '১ম স্থান';
  if (rank === 2) return '২য় স্থান';
  if (rank === 3) return '৩য় স্থান';
  return `${toBengaliNumeral(rank)}তম স্থান`;
}

function getRankTheme(rank: number) {
  if (rank === 1) {
    return {
      border: 'border-amber-400 dark:border-amber-500',
      rankBadge: 'bg-amber-400 text-slate-950',
      rankNumberCircle: 'bg-amber-400 text-slate-950',
      isTop3: true,
    };
  }
  if (rank === 2) {
    return {
      border: 'border-sky-400 dark:border-sky-500',
      rankBadge: 'bg-sky-500 text-white',
      rankNumberCircle: 'bg-sky-400 text-white',
      isTop3: true,
    };
  }
  if (rank === 3) {
    return {
      border: 'border-amber-700/70 sm:border-orange-400 dark:border-amber-600',
      rankBadge: 'bg-amber-700 text-white',
      rankNumberCircle: 'bg-amber-700 text-white',
      isTop3: true,
    };
  }
  return {
    border: 'border-teal-400 dark:border-teal-700',
    rankBadge: 'bg-[#00897B] text-white',
    rankNumberCircle: 'bg-[#00897B] text-white',
    isTop3: false,
  };
}

function formatMarkDisplay(item: LeaderboardDisplayItem) {
  const totalQ = item.totalQuestions > 0 ? item.totalQuestions : ((item.correctCount + item.wrongCount) > 0 ? (item.correctCount + item.wrongCount) : 5);
  let scoreVal = item.score !== undefined && item.score !== null ? item.score : item.correctCount;
  if (item.wrongCount > 0 && scoreVal === item.correctCount) {
    scoreVal = Math.max(0, Number((item.correctCount - item.wrongCount * 0.25).toFixed(2)));
  }
  return `${toBengaliNumeral(scoreVal)}/${toBengaliNumeral(totalQ)}`;
}

export function computeLeaderboard(
  entries: LeaderboardEntry[],
  filterType: LeaderboardFilterType,
  selectedExamId: string,
  currentUserName: string,
  currentUserAvatar?: string,
  examList?: ExamItem[]
): LeaderboardDisplayItem[] {
  const currentUserId = getUserUniqueId();
  const normalizedCurrentUserName = (currentUserName || '').toLowerCase().trim();

  // Filter out invalid/empty entries
  let filtered = entries.filter((e) => {
    const rawName = (e.user_name || '').trim();
    if (!rawName) return false;
    const lower = rawName.toLowerCase();
    const isPlaceholder = lower === 'anonymous' || lower === 'unknown' || lower === 'test_user';
    if (isPlaceholder) {
      const isCurr = Boolean(
        (e.user_id && currentUserId && e.user_id === currentUserId) ||
        (normalizedCurrentUserName && lower === normalizedCurrentUserName)
      );
      return isCurr;
    }
    return true;
  });

  function uKeyMatch(name1?: string, name2?: string) {
    if (!name1 || !name2) return false;
    return name1.toLowerCase().trim() === name2.toLowerCase().trim();
  }

  // Helper set of candidate exam identifiers for flexible matching
  const candidateIds = new Set<string>();
  if (selectedExamId && selectedExamId !== 'all') {
    candidateIds.add(selectedExamId.toLowerCase().trim());
  }
  if (examList && examList.length > 0) {
    for (const ex of examList) {
      const matchFound =
        ex.id?.toLowerCase().trim() === selectedExamId.toLowerCase().trim() ||
        ex.title?.toLowerCase().trim() === selectedExamId.toLowerCase().trim() ||
        ex.subject?.toLowerCase().trim() === selectedExamId.toLowerCase().trim();
      if (matchFound) {
        if (ex.id) candidateIds.add(ex.id.toLowerCase().trim());
        if (ex.title) candidateIds.add(ex.title.toLowerCase().trim());
        if (ex.subject) candidateIds.add(ex.subject.toLowerCase().trim());
      }
    }
  }

  const isExamMatch = (e: LeaderboardEntry) => {
    if (!selectedExamId || selectedExamId === 'all') return true;
    const eId = (e.exam_id || '').toLowerCase().trim();
    const eTitle = (e.exam_title || '').toLowerCase().trim();
    const target = selectedExamId.toLowerCase().trim();

    if (eId === target || eTitle === target) return true;
    if (candidateIds.has(eId) || candidateIds.has(eTitle)) return true;
    if (eId && target && (eId.includes(target) || target.includes(eId))) return true;
    if (eTitle && target && (eTitle.includes(target) || target.includes(eTitle))) return true;
    return false;
  };

  if (filterType === 'this_exam') {
    if (selectedExamId && selectedExamId !== 'all') {
      filtered = filtered.filter(isExamMatch);
    }

    // Select best entry per distinct participant for this exam
    const userBestMap = new Map<string, LeaderboardEntry>();
    for (const item of filtered) {
      // Differentiate participants by registered user_id or unique guest name/id
      const isReg = Boolean(item.user_id && !item.user_id.startsWith('guest_') && !item.user_id.startsWith('anon_'));
      const participantKey = isReg
        ? item.user_id!.trim()
        : (item.guest_name || item.user_name || item.id).trim().toLowerCase();

      const existing = userBestMap.get(participantKey);
      if (!existing) {
        userBestMap.set(participantKey, item);
      } else {
        if (item.score > existing.score) {
          userBestMap.set(participantKey, item);
        } else if (item.score === existing.score) {
          if (item.accuracy > existing.accuracy) {
            userBestMap.set(participantKey, item);
          } else if (new Date(item.created_at).getTime() < new Date(existing.created_at).getTime()) {
            userBestMap.set(participantKey, item);
          }
        }
      }
    }

    const userProf = getUserProfile();
    const isReg = isUserRegistered();
    const userRoll = userProf?.roll_number || userProf?.student_id;

    const itemsList: LeaderboardDisplayItem[] = Array.from(userBestMap.values()).map((e) => {
      const eUserId = (e.user_id || '').trim();
      const isCurr = Boolean(
        currentUserId && (
          (eUserId && (eUserId === currentUserId || (userRoll && eUserId === userRoll))) ||
          (isReg && userProf?.name && (e.user_name || e.full_name || '').trim().toLowerCase() === userProf.name.trim().toLowerCase())
        )
      );

      const rollNumber = e.roll_number || e.student_id || (isCurr && userRoll ? userRoll : undefined);
      const isGuest = Boolean(
        e.is_guest !== undefined
          ? e.is_guest
          : (!isCurr && (!eUserId || eUserId.startsWith('guest_') || eUserId.startsWith('anon_')))
      );

      const rawClean = (e.full_name || e.user_name || e.guest_name || '').trim();
      const displayName = (isCurr && isReg && userProf?.name)
        ? userProf.name
        : ((rawClean && rawClean !== 'আপনি (পরীক্ষার্থী)') ? rawClean : (isGuest ? 'গেস্ট পরীক্ষার্থী' : 'পরীক্ষার্থী'));

      const totalQ = Number(e.total_questions || (e.correct_count + e.wrong_count) || 0);

      return {
        id: e.id,
        rank: 0,
        userName: displayName,
        userAvatar: isCurr ? (currentUserAvatar || e.user_avatar) : e.user_avatar,
        isCurrentUser: isCurr,
        isGuest,
        rollNumber,
        testCount: 1,
        avgAccuracy: Math.round(e.accuracy || 0),
        points: Number(e.score || e.correct_count || 0),
        totalQuestions: totalQ,
        correctCount: Number(e.correct_count || e.score || 0),
        wrongCount: Number(e.wrong_count || 0),
        score: Number(e.score || 0),
        examTitle: e.exam_title || 'মডেল টেস্ট',
        createdAt: e.created_at,
      };
    });

    // Ranking rules for 'this_exam':
    // 1. Points / Score (desc)
    // 2. Avg Accuracy (desc)
    // 3. Submission time (asc)
    itemsList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return itemsList.map((item, idx) => ({ ...item, rank: idx + 1 }));

  } else {
    // For 'today', 'this_week', 'this_month', 'all_time':
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (filterType === 'today') {
      filtered = filtered.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return !isNaN(t) && t >= startOfToday;
      });
    } else if (filterType === 'this_week') {
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return !isNaN(t) && (now.getTime() - t <= oneWeekMs);
      });
    } else if (filterType === 'this_month') {
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return !isNaN(t) && (now.getTime() - t <= oneMonthMs);
      });
    }

    if (selectedExamId && selectedExamId !== 'all') {
      filtered = filtered.filter(isExamMatch);
    }

    // Group entries by distinct participant
    const userGroupMap = new Map<string, LeaderboardEntry[]>();
    for (const item of filtered) {
      const isReg = Boolean(item.user_id && !item.user_id.startsWith('guest_') && !item.user_id.startsWith('anon_'));
      const participantKey = isReg
        ? item.user_id!.trim()
        : (item.guest_name || item.user_name || item.id).trim().toLowerCase();

      if (!userGroupMap.has(participantKey)) {
        userGroupMap.set(participantKey, []);
      }
      userGroupMap.get(participantKey)!.push(item);
    }

    const itemsList: LeaderboardDisplayItem[] = [];
    for (const [pKey, userEntries] of userGroupMap.entries()) {
      const firstEntry = userEntries[0];
      const testCount = userEntries.length;

      const eUserId = (firstEntry.user_id || '').trim();
      const isCurr = Boolean(
        currentUserId && eUserId && eUserId === currentUserId && !eUserId.startsWith('guest_') && !eUserId.startsWith('anon_')
      );

      const isGuest = Boolean(
        firstEntry.is_guest ||
        !eUserId ||
        eUserId.startsWith('guest_') ||
        eUserId.startsWith('anon_') ||
        Boolean(firstEntry.guest_name) ||
        (firstEntry.user_name || '').includes('গেস্ট') ||
        (firstEntry.user_name || '').includes('Guest')
      );

      const rawClean = (firstEntry.guest_name || firstEntry.full_name || firstEntry.user_name || '').trim();
      const displayName = (rawClean && rawClean !== 'আপনি (পরীক্ষার্থী)')
        ? rawClean
        : (isGuest ? 'গেস্ট পরীক্ষার্থী' : 'পরীক্ষার্থী');

      let totalCorrect = 0;
      let totalQuestions = 0;
      let totalScore = 0;
      let earliestCreatedAt = firstEntry.created_at;
      let latestAvatar = firstEntry.user_avatar;

      for (const e of userEntries) {
        totalCorrect += Number(e.correct_count || e.score || 0);
        totalQuestions += Number(e.total_questions || 0);
        totalScore += Number(e.score || e.correct_count || 0);
        if (e.user_avatar) latestAvatar = e.user_avatar;
        if (new Date(e.created_at).getTime() < new Date(earliestCreatedAt).getTime()) {
          earliestCreatedAt = e.created_at;
        }
      }

      const points = totalScore;

      let avgAccuracy = 0;
      if (totalQuestions > 0) {
        avgAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
      } else {
        const sumAcc = userEntries.reduce((acc, e) => acc + (e.accuracy || 0), 0);
        avgAccuracy = Math.round(sumAcc / testCount);
      }

      itemsList.push({
        id: `user_agg_${pKey}`,
        rank: 0,
        userName: displayName,
        userAvatar: isCurr ? (currentUserAvatar || latestAvatar) : latestAvatar,
        isCurrentUser: isCurr,
        isGuest,
        testCount,
        avgAccuracy,
        points,
        totalQuestions,
        correctCount: totalCorrect,
        wrongCount: Math.max(0, totalQuestions - totalCorrect),
        score: totalScore,
        createdAt: earliestCreatedAt,
      });
    }

    // Ranking rules:
    // 1. Points (desc)
    // 2. Average Accuracy (desc)
    // 3. Test Count (desc)
    // 4. Submission time (asc)
    itemsList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.avgAccuracy !== a.avgAccuracy) return b.avgAccuracy - a.avgAccuracy;
      if (b.testCount !== a.testCount) return b.testCount - a.testCount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return itemsList.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }
}

interface LeaderboardViewProps {
  onBack?: () => void;
  onClose?: () => void;
  isModal?: boolean;
  initialExamId?: string;
  isExamOnlyMode?: boolean;
  exams?: ExamItem[];
  onReviewAnswers?: (opts: { examId?: string; subject?: string; examType?: string }) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  onClose,
  isModal = false,
  initialExamId = 'all',
  isExamOnlyMode = false,
  exams: propsExams,
  onReviewAnswers,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (initialExamId && initialExamId !== 'all') return initialExamId;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlExam = urlParams.get('exam') || urlParams.get('examId') || urlParams.get('test');
      if (urlExam) return urlExam;
      const pathname = window.location.pathname;
      const match = pathname.match(/\/exam\/([^/]+)/);
      if (match && match[1]) return match[1];
    }
    return initialExamId;
  });
  
  useEffect(() => {
    if (initialExamId && initialExamId !== 'all') {
      setSelectedExamId(initialExamId);
    }
  }, [initialExamId]);

  const effectiveExamOnlyMode = isExamOnlyMode || (selectedExamId !== 'all');

  const [filterType, setFilterType] = useState<LeaderboardFilterType>(
    effectiveExamOnlyMode ? 'this_exam' : 'today'
  );

  useEffect(() => {
    if (effectiveExamOnlyMode) {
      setFilterType('this_exam');
    }
  }, [effectiveExamOnlyMode, selectedExamId]);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rpcRankedList, setRpcRankedList] = useState<LeaderboardDisplayItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [examList, setExamList] = useState<ExamItem[]>(propsExams || []);

  const currentUserId = getUserUniqueId();
  const userProfile = getUserProfile();
  const userName = userProfile?.name?.trim() || 'পরীক্ষার্থী';
  const userAvatar = userProfile?.avatar || '';
  const normalizedCurrentUserName = (userName || '').toLowerCase().trim();

  // Load Exam List
  useEffect(() => {
    if (propsExams && propsExams.length > 0) {
      setExamList(propsExams);
    } else {
      fetchExamsFromSupabase().then((res) => {
        if (res.exams && res.exams.length > 0) {
          setExamList(res.exams);
        }
      });
    }
  }, [propsExams]);

  const currentFilter = effectiveExamOnlyMode ? 'this_exam' : filterType;
  const currentExamObj = examList.find((e) => e.id === selectedExamId);
  const selectedExamTitle = currentExamObj ? currentExamObj.title : (selectedExamId === 'all' ? 'সকল বিষয় / মডেল টেস্ট' : selectedExamId);

  // Fetch Leaderboard entries via secure database RPCs / fallback
  const loadLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentFilter === 'this_exam' && selectedExamId && selectedExamId !== 'all') {
        // A. Call secure Exam-Specific Leaderboard RPC / Direct Query
        const examRows = await getExamLeaderboard(selectedExamId);
        if (examRows && examRows.length > 0) {
          const userProf = getUserProfile();
          const isReg = isUserRegistered();
          const userRoll = userProf?.roll_number || userProf?.student_id;

          // Global mapping without personal user filtering
          const mapped: LeaderboardDisplayItem[] = examRows.map((row, idx) => {
            const rowUserId = (row.user_id || '').trim();
            const rowRoll = row.roll_number || row.student_id;
            const isCurr = Boolean(
              currentUserId && (
                (rowUserId && (rowUserId === currentUserId || (userRoll && rowUserId === userRoll))) ||
                (isReg && userProf?.name && (row.full_name || '').trim().toLowerCase() === userProf.name.trim().toLowerCase())
              )
            );

            const rollNumber = (isCurr && userRoll) ? userRoll : rowRoll;
            const isGuest = Boolean(
              row.is_guest !== undefined
                ? row.is_guest
                : (!isCurr && (!rowUserId || rowUserId.startsWith('guest_') || rowUserId.startsWith('anon_')))
            );

            const rawClean = (row.full_name || row.guest_name || '').trim();
            const cleanName = (isCurr && isReg && userProf?.name)
              ? userProf.name
              : ((rawClean && rawClean !== 'আপনি (পরীক্ষার্থী)') ? rawClean : (isGuest ? 'গেস্ট পরীক্ষার্থী' : 'পরীক্ষার্থী'));

            const cleanAvatar = isCurr ? (userAvatar || row.avatar_url) : row.avatar_url;
            const totalQ = Number(row.total_marks || (row.correct_answers + row.wrong_answers) || 0);

            return {
              id: `rpc_exam_${row.user_id || idx}_${row.rank || idx + 1}`,
              rank: Number(row.rank || idx + 1),
              userName: cleanName,
              userAvatar: cleanAvatar,
              isCurrentUser: isCurr,
              isGuest,
              rollNumber,
              testCount: 1,
              avgAccuracy: totalQ > 0 ? Math.round((Number(row.correct_answers ?? row.score) / totalQ) * 100) : 100,
              points: Number(row.score ?? row.correct_answers ?? 0),
              totalQuestions: totalQ,
              correctCount: Number(row.correct_answers ?? row.score ?? 0),
              wrongCount: Number(row.wrong_answers ?? 0),
              score: Number(row.score ?? 0),
              timeTakenSeconds: Number(row.time_taken_seconds ?? 0),
              examTitle: selectedExamTitle,
              createdAt: new Date().toISOString(),
            };
          });
          setRpcRankedList(mapped.length > 0 ? mapped : null);
        } else {
          setRpcRankedList(null);
        }
      } else {
        // B. Call secure Free Overall Leaderboard RPC
        const freeRows = await getFreeOverallLeaderboard(currentFilter);
        if (freeRows && freeRows.length > 0) {
          const userProf = getUserProfile();
          const isReg = isUserRegistered();
          const userRoll = userProf?.roll_number || userProf?.student_id;

          const filteredFree = freeRows.filter((r) => {
            const rawName = (r.full_name || '').trim();
            if (!rawName) return false;
            const lower = rawName.toLowerCase();
            const isPlaceholder = lower === 'anonymous' || lower === 'unknown' || lower === 'test_user';
            if (isPlaceholder) {
              const isCurr = Boolean(
                (r.user_id && currentUserId && r.user_id === currentUserId) ||
                (normalizedCurrentUserName && lower === normalizedCurrentUserName)
              );
              return isCurr;
            }
            return true;
          });

          const mapped: LeaderboardDisplayItem[] = filteredFree.map((row, idx) => {
            const rowUserId = (row.user_id || '').trim();
            const rowRoll = row.roll_number || row.student_id;
            const isCurr = Boolean(
              currentUserId && (
                (rowUserId && (rowUserId === currentUserId || (userRoll && rowUserId === userRoll))) ||
                (isReg && userProf?.name && (row.full_name || '').trim().toLowerCase() === userProf.name.trim().toLowerCase())
              )
            );

            const rollNumber = (isCurr && userRoll) ? userRoll : rowRoll;
            const isGuest = Boolean(
              row.is_guest !== undefined
                ? row.is_guest
                : (!isCurr && (!rowUserId || rowUserId.startsWith('guest_') || rowUserId.startsWith('anon_')))
            );

            const rawClean = (row.full_name || row.guest_name || '').trim();
            const cleanName = (isCurr && isReg && userProf?.name)
              ? userProf.name
              : ((rawClean && rawClean !== 'আপনি (পরীক্ষার্থী)') ? rawClean : (isGuest ? 'গেস্ট পরীক্ষার্থী' : 'পরীক্ষার্থী'));
            const cleanAvatar = isCurr ? (userAvatar || row.avatar_url) : row.avatar_url;

            return {
              id: `rpc_free_${row.user_id}_${row.rank || idx + 1}`,
              rank: Number(row.rank || idx + 1),
              userName: cleanName,
              userAvatar: cleanAvatar,
              isCurrentUser: isCurr,
              isGuest,
              rollNumber,
              testCount: Number(row.free_exam_count || 1),
              avgAccuracy: Math.round(Number(row.average_percentage || 0)),
              points: Number(row.total_points || 0),
              totalQuestions: 0,
              correctCount: Number(row.total_points || 0),
              wrongCount: 0,
              score: Number(row.total_points || 0),
              createdAt: new Date().toISOString(),
            };
          });
          setRpcRankedList(mapped.length > 0 ? mapped : null);
        } else {
          setRpcRankedList(null);
        }
      }

      // Also sync fallback entries
      const fallbackEntries = await fetchLeaderboardEntriesFromSupabase('all');
      setEntries(fallbackEntries);
    } catch {
      setEntries([]);
      setRpcRankedList(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentFilter, selectedExamId, selectedExamTitle, currentUserId, userName, userAvatar, normalizedCurrentUserName]);

  useEffect(() => {
    loadLeaderboardData();

    const handleProfileUpdate = () => {
      loadLeaderboardData();
    };
    const handleFocus = () => {
      loadLeaderboardData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tamreen_profile_updated', handleProfileUpdate);
      window.addEventListener('focus', handleFocus);
    }

    const unsubscribeRealtime = subscribeToLeaderboard(() => {
      loadLeaderboardData();
    }, selectedExamId !== 'all' ? selectedExamId : undefined);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('tamreen_leaderboard_channel');
        bc.onmessage = () => {
          loadLeaderboardData();
        };
      } catch {}
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_profile_updated', handleProfileUpdate);
        window.removeEventListener('focus', handleFocus);
      }
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
      }
      if (bc) bc.close();
    };
  }, [loadLeaderboardData]);

  // Compute ranked list based on current filter & selected exam
  const rankedList = (rpcRankedList && rpcRankedList.length > 0)
    ? rpcRankedList
    : computeLeaderboard(entries, currentFilter, selectedExamId, userName, userAvatar, examList);

  const currentUserRankItem = rankedList.find((item) => item.isCurrentUser);
  const topOneItem = rankedList.length > 0 ? rankedList[0] : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Top Header Controls (For Modal / Page Top) */}
      <div className="flex items-center justify-between px-1">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#0B705C] dark:text-emerald-400 font-extrabold text-xs sm:text-sm hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ফিরে যান</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button
            onClick={loadLeaderboardData}
            className="p-2 text-slate-500 hover:text-[#0B705C] dark:hover:text-emerald-400 transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CASE A: SPECIFIC EXAM LEADERBOARD (EXACT SCREENSHOT MATCH) */}
      {/* ======================================================== */}
      {effectiveExamOnlyMode ? (
        <div className="space-y-4">
          
          {/* 1. TOP 2 TABS / PILL BUTTONS */}
          <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-2 max-w-xl mx-auto shadow-xs border border-slate-200/80 dark:border-slate-700/60">
            {/* Active Tab: মেধাতালিকা */}
            <button
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFC107] text-[#05402A] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Trophy className="w-4 h-4 text-[#05402A] fill-[#05402A]" />
              <span>মেধাতালিকা</span>
            </button>

            {/* Inactive Tab: ব্যাখ্যাসহ উত্তর */}
            <button
              onClick={() => {
                if (onReviewAnswers) {
                  onReviewAnswers({
                    examId: selectedExamId,
                    subject: selectedExamTitle,
                    examType: selectedExamTitle,
                  });
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ব্যাখ্যাসহ উত্তর</span>
            </button>
          </div>

          {/* 2. HEADER: অংশগ্রহণকারীদের মেধা তালিকা (১১ জন) & আপনার অবস্থান */}
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h3 className="text-sm sm:text-base font-black">
                অংশগ্রহণকারীদের মেধা তালিকা
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                ({toBengaliNumeral(rankedList.length)} জন)
              </span>
            </div>

            {/* Your Rank Capsule */}
            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-black shrink-0">
              আপনার অবস্থান: {toBengaliNumeral(currentUserRankItem?.rank || (rankedList.length > 0 ? rankedList.length : 1))}তম
            </div>
          </div>

          {/* 3. CONTENT AREA */}
          {isLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#0D172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#0B705C] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">মেধা তালিকা লোড হচ্ছে...</p>
            </div>
          ) : rankedList.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border-2 border-amber-200 dark:border-amber-800/60 shadow-inner">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-black text-[#0B132B] dark:text-white">
                  এখনো কোনো পরীক্ষার্থী অংশ নেয়নি
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  "{selectedExamTitle}" পরীক্ষায় এখনো কোনো রেজাল্ট জমা হয়নি। আপনিই প্রথম পরীক্ষা দিয়ে শীর্ষে মেধা তালিকায় স্থান অর্জন করুন!
                </p>
              </div>
            </div>
          ) : (
            /* 4. EXACT SEQUENTIAL LIST OF PARTICIPANTS */
            <div className="space-y-3">
              {rankedList.map((item) => {
                const theme = getRankTheme(item.rank);
                const letterAvatar = getLetterAvatar(item.userName);
                const markText = formatMarkDisplay(item);
                const totalQ = item.totalQuestions > 0 ? item.totalQuestions : 10;

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl p-3.5 sm:p-4 bg-white dark:bg-[#0D172A] border-2 transition-all flex items-center justify-between gap-3 shadow-2xs ${theme.border}`}
                  >
                    {/* Left: Number circle + Letter circle + Name & Accuracy */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Rank Number Circle Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${theme.rankNumberCircle}`}>
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
                          {letterAvatar}
                        </div>
                      )}

                      {/* Name & Subtitle Details */}
                      <div className="min-w-0 space-y-1">
                        {/* Name Capsule Badge & Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="inline-block px-3 py-0.5 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                            {item.userName}
                          </div>
                          {item.isGuest ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              গেস্ট
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              {item.rollNumber ? `রোল: ${item.rollNumber}` : 'রেজিস্টার্ড'}
                            </span>
                          )}
                          {item.isCurrentUser && (
                            <span className="px-2 py-0.5 bg-[#0B705C] text-white text-[10px] font-black rounded-full">
                              আপনি
                            </span>
                          )}
                        </div>

                        {/* Rank Badge + Question & Accuracy */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {theme.isTop3 && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shrink-0 ${theme.rankBadge}`}>
                              👑 {getRankBadgeText(item.rank)}
                            </span>
                          )}

                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            পরীক্ষা • প্রশ্ন: {toBengaliNumeral(totalQ)}টি • একুরেসি: {toBengaliNumeral(item.avgAccuracy)}%
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
                          {markText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* CASE B: GENERAL OVERALL LEADERBOARD (TODAY, WEEK, MONTH) */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Dark Green Header Card */}
          <div className="bg-gradient-to-b from-[#05402A] to-[#043321] text-white rounded-[32px] p-5 sm:p-7 text-center flex flex-col items-center justify-center space-y-4 shadow-xl border border-emerald-900/60 relative overflow-hidden mx-auto">
            
            {/* Top Badge */}
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-400/40 bg-[#074D33] text-amber-300 font-extrabold text-xs shadow-xs mx-auto text-center">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>লিডারবোর্ড</span>
            </div>

            {/* Title */}
            <div className="space-y-1.5 max-w-xl mx-auto text-center">
              <h1 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight text-center">
                ফ্রি পরীক্ষায় অংশগ্রহণকারীদের লিডারবোর্ড
              </h1>
            </div>

            {/* 4 Filter Tabs */}
            <div className="pt-2 w-full">
              <div className="bg-[#032E1E] p-1.5 rounded-full border border-emerald-900/60 flex items-center justify-between gap-1 max-w-md mx-auto">
                <button
                  onClick={() => setFilterType('today')}
                  className={`flex-1 py-2 px-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                    filterType === 'today'
                      ? 'bg-[#FFC107] text-[#05402A] shadow-md'
                      : 'text-emerald-100/80 hover:text-white font-extrabold'
                  }`}
                >
                  আজকে
                </button>

                <button
                  onClick={() => setFilterType('this_week')}
                  className={`flex-1 py-2 px-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                    filterType === 'this_week'
                      ? 'bg-[#FFC107] text-[#05402A] shadow-md'
                      : 'text-emerald-100/80 hover:text-white font-extrabold'
                  }`}
                >
                  এই সপ্তাহে
                </button>

                <button
                  onClick={() => setFilterType('this_month')}
                  className={`flex-1 py-2 px-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                    filterType === 'this_month'
                      ? 'bg-[#FFC107] text-[#05402A] shadow-md'
                      : 'text-emerald-100/80 hover:text-white font-extrabold'
                  }`}
                >
                  এই মাসে
                </button>

                <button
                  onClick={() => setFilterType('all_time')}
                  className={`flex-1 py-2 px-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                    filterType === 'all_time'
                      ? 'bg-[#FFC107] text-[#05402A] shadow-md'
                      : 'text-emerald-100/80 hover:text-white font-extrabold'
                  }`}
                >
                  সর্বকালে
                </button>
              </div>
            </div>

          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#0D172A] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#0B705C] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">মেধা তালিকা লোড হচ্ছে...</p>
            </div>
          ) : rankedList.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border-2 border-amber-200 dark:border-amber-800/60 shadow-inner">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-black text-[#0B132B] dark:text-white">
                  এখনো কোনো পরীক্ষার্থী অংশ নেয়নি
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  এই সময়ের মধ্যে কোনো রেজাল্ট জমা হয়নি। আপনিই প্রথম পরীক্ষা দিয়ে শীর্ষে মেধা তালিকায় স্থান অর্জন করুন!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Champion Podium Section for General Leaderboard */}
              {topOneItem && (
                <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4 text-center">
                  
                  <div className="flex items-center justify-center gap-1.5 text-base font-black text-[#0B132B] dark:text-white">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>শীর্ষ ৩ বিজয়ী</span>
                  </div>

                  {/* Champion Card */}
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="relative inline-block pt-3">
                      {/* Crown Icon */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                        👑
                      </div>

                      {/* Avatar */}
                      {topOneItem.userAvatar ? (
                        <img
                          src={topOneItem.userAvatar}
                          alt={topOneItem.userName}
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-amber-400 border-2 border-white shadow-md mx-auto"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-[#0B705C] text-white flex items-center justify-center font-black ring-4 ring-amber-400 border-2 border-white shadow-md mx-auto">
                          <User className="w-12 h-12 text-amber-300" />
                        </div>
                      )}

                      {/* Medal Badge */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black ring-2 ring-white shadow-xs">
                        🥇
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-base sm:text-lg text-[#0B132B] dark:text-white">
                          {topOneItem.userName}
                        </h3>
                        {topOneItem.isGuest && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            গেস্ট
                          </span>
                        )}
                        {topOneItem.isCurrentUser && (
                          <span className="px-2 py-0.5 bg-[#0B705C] text-white text-[10px] font-black rounded-full">
                            আপনি
                          </span>
                        )}
                      </div>

                      <div className="inline-block px-3.5 py-0.5 rounded-full bg-[#FFC107] text-[#05402A] text-xs font-black shadow-2xs">
                        👑 ১ম স্থান
                      </div>

                      <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300 pt-0.5">
                        {toBengaliNumeral(topOneItem.testCount)}টি পরীক্ষা • গড় {toBengaliNumeral(topOneItem.avgAccuracy)}%
                      </p>

                      <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {toBengaliNumeral(topOneItem.points)} পয়েন্ট
                      </p>
                    </div>

                    {/* Gold Podium Card */}
                    <div className="bg-gradient-to-b from-amber-100 to-amber-200/80 border border-amber-300 rounded-2xl p-4 text-center shadow-xs space-y-0.5">
                      <div className="text-3xl font-black text-amber-800">
                        ১
                      </div>
                      <div className="text-xs font-black text-amber-900 tracking-wide">
                        চ্যাম্পিয়ন
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Current User Mint Card Banner */}
              {currentUserRankItem && (
                <div className="bg-[#E8F8F5] dark:bg-emerald-950/40 border-2 border-[#10B981] rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base font-black text-[#0B132B] dark:text-white shrink-0">
                      {toBengaliNumeral(currentUserRankItem.rank)}.
                    </span>

                    <div className="relative shrink-0">
                      {currentUserRankItem.userAvatar ? (
                        <img
                          src={currentUserRankItem.userAvatar}
                          alt={currentUserRankItem.userName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0B705C] text-white flex items-center justify-center font-black ring-2 ring-emerald-500">
                          <User className="w-6 h-6 text-amber-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-sm text-[#0B132B] dark:text-white truncate">
                          {currentUserRankItem.userName}
                        </h4>
                        <span className="px-2 py-0.5 bg-[#0B705C] text-white text-[10px] font-black rounded-full">
                          আপনি
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-extrabold rounded-full">
                          টেস্ট: {toBengaliNumeral(currentUserRankItem.testCount)}
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-extrabold rounded-full">
                          গড়: {toBengaliNumeral(currentUserRankItem.avgAccuracy)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Stats */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold block">পয়েন্ট</span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {toBengaliNumeral(currentUserRankItem.points)}
                    </span>
                  </div>
                </div>
              )}

              {/* Other Participants Rankings List */}
              <div className="bg-white dark:bg-[#0D172A] rounded-[28px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-[#0B132B] dark:text-white px-1">
                  <span>অন্যান্য পরীক্ষার্থীদের র‍্যাঙ্কিং</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-bold">
                    মোট পরীক্ষার্থী: {toBengaliNumeral(rankedList.length)} জন
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rankedList.map((item) => (
                    <div
                      key={item.id}
                      className={`py-3 px-2 flex items-center justify-between gap-3 ${
                        item.isCurrentUser ? 'bg-amber-50/70 dark:bg-amber-950/20 rounded-xl' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-black text-xs text-slate-500 shrink-0">
                          {toBengaliNumeral(item.rank)}.
                        </span>

                        {item.userAvatar ? (
                          <img
                            src={item.userAvatar}
                            alt={item.userName}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#0B705C] text-white flex items-center justify-center font-black text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-xs sm:text-sm text-[#0B132B] dark:text-white truncate max-w-[130px] sm:max-w-[200px]">
                              {item.userName}
                            </h4>
                            {item.isGuest ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold">
                                গেস্ট
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">
                                {item.rollNumber ? `রোল: ${item.rollNumber}` : 'রেজিস্টার্ড'}
                              </span>
                            )}
                            {item.isCurrentUser && (
                              <span className="px-2 py-0.2 bg-[#0B705C] text-white text-[9px] font-black rounded-full">
                                আপনি
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.2 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-full">
                              টেস্ট: {toBengaliNumeral(item.testCount)}
                            </span>
                            <span className="px-2 py-0.2 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full">
                              গড়: {toBengaliNumeral(item.avgAccuracy)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 font-bold block">পয়েন্ট</span>
                        <span className="text-base font-black text-amber-600">
                          {toBengaliNumeral(item.points)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
