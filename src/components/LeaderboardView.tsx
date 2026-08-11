import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Sparkles, User, RefreshCw, Filter, ChevronDown, X } from 'lucide-react';
import { toBengaliNumeral, getUserProfile } from '../lib/utils';
import { LeaderboardEntry, fetchLeaderboardEntriesFromSupabase, fetchExamsFromSupabase, ExamItem } from '../lib/supabase';

export type LeaderboardFilterType = 'today' | 'this_week' | 'this_month' | 'all_time' | 'this_exam';

export interface LeaderboardDisplayItem {
  id: string;
  rank: number;
  userName: string;
  userAvatar?: string;
  isCurrentUser: boolean;
  
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

export function computeLeaderboard(
  entries: LeaderboardEntry[],
  filterType: LeaderboardFilterType,
  selectedExamId: string,
  currentUserName: string,
  currentUserAvatar?: string
): LeaderboardDisplayItem[] {
  const normalizedCurrentUserName = currentUserName.toLowerCase().trim();

  let filtered = [...entries];

  if (filterType === 'this_exam') {
    if (selectedExamId && selectedExamId !== 'all') {
      filtered = filtered.filter(
        (e) => e.exam_id === selectedExamId || e.exam_title === selectedExamId
      );
    }

    // Group or select best entry per user per exam
    const userBestMap = new Map<string, LeaderboardEntry>();
    for (const item of filtered) {
      const uKey = item.user_name.toLowerCase().trim();
      const examKey = item.exam_id || item.exam_title || 'default';
      const mapKey = selectedExamId === 'all' ? `${uKey}_${examKey}` : uKey;

      const existing = userBestMap.get(mapKey);
      if (!existing) {
        userBestMap.set(mapKey, item);
      } else {
        if (item.score > existing.score) {
          userBestMap.set(mapKey, item);
        } else if (item.score === existing.score) {
          if (item.accuracy > existing.accuracy) {
            userBestMap.set(mapKey, item);
          } else if (new Date(item.created_at).getTime() < new Date(existing.created_at).getTime()) {
            userBestMap.set(mapKey, item);
          }
        }
      }
    }

    const itemsList: LeaderboardDisplayItem[] = Array.from(userBestMap.values()).map((e) => {
      const uKey = e.user_name.toLowerCase().trim();
      const isCurr = Boolean(normalizedCurrentUserName && (uKey === normalizedCurrentUserName || uKey === 'আপনি (পরীক্ষার্থী)'));
      const totalQ = Number(e.total_questions || (e.correct_count + e.wrong_count) || 0);

      return {
        id: e.id,
        rank: 0,
        userName: isCurr ? (currentUserName || e.user_name) : e.user_name,
        userAvatar: isCurr ? (currentUserAvatar || e.user_avatar) : e.user_avatar,
        isCurrentUser: isCurr,
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
      filtered = filtered.filter(
        (e) => e.exam_id === selectedExamId || e.exam_title === selectedExamId
      );
    }

    // Group by user
    const userGroupMap = new Map<string, LeaderboardEntry[]>();
    for (const item of filtered) {
      const uKey = item.user_name.toLowerCase().trim();
      if (!userGroupMap.has(uKey)) {
        userGroupMap.set(uKey, []);
      }
      userGroupMap.get(uKey)!.push(item);
    }

    const itemsList: LeaderboardDisplayItem[] = [];
    for (const [uKey, userEntries] of userGroupMap.entries()) {
      const firstEntry = userEntries[0];
      const testCount = userEntries.length;
      const isCurr = Boolean(normalizedCurrentUserName && (uKey === normalizedCurrentUserName || uKey === 'আপনি (পরীক্ষার্থী)'));

      let totalCorrect = 0;
      let totalQuestions = 0;
      let totalScore = 0;
      let earliestCreatedAt = userEntries[0].created_at;
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
        id: `user_agg_${uKey}`,
        rank: 0,
        userName: isCurr ? (currentUserName || firstEntry.user_name) : firstEntry.user_name,
        userAvatar: isCurr ? (currentUserAvatar || latestAvatar) : latestAvatar,
        isCurrentUser: isCurr,
        testCount,
        avgAccuracy,
        points,
        totalQuestions: totalQuestions,
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
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  onClose,
  isModal = false,
  initialExamId = 'all',
  isExamOnlyMode = false,
  exams: propsExams,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  
  useEffect(() => {
    setSelectedExamId(initialExamId);
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [examList, setExamList] = useState<ExamItem[]>(propsExams || []);

  const userProfile = getUserProfile();
  const userName = userProfile?.name?.trim() || 'আপনি (পরীক্ষার্থী)';
  const userAvatar = userProfile?.avatar || '';

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

  // Fetch Leaderboard entries from Supabase / localStorage
  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboardEntriesFromSupabase('all');
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();

    const handleProfileUpdate = () => {
      loadLeaderboardData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('tamreen_profile_updated', handleProfileUpdate);
    }

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
      }
      if (bc) bc.close();
    };
  }, []);

  const currentFilter = effectiveExamOnlyMode ? 'this_exam' : filterType;

  // Compute ranked list based on current filter & selected exam
  const rankedList = computeLeaderboard(entries, currentFilter, selectedExamId, userName, userAvatar);
  const currentUserRankItem = rankedList.find((item) => item.isCurrentUser);
  const topOneItem = rankedList.length > 0 ? rankedList[0] : null;

  // Selected Exam Title display
  const currentExamObj = examList.find((e) => e.id === selectedExamId);
  const selectedExamTitle = currentExamObj ? currentExamObj.title : (selectedExamId === 'all' ? 'সকল বিষয় / মডেল টেস্ট' : selectedExamId);

  return (
    <div className="space-y-6">
      
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

      {/* 1. Dark Green Header Card */}
      <div className="bg-gradient-to-b from-[#05402A] to-[#043321] text-white rounded-[32px] p-5 sm:p-7 text-center flex flex-col items-center justify-center space-y-4 shadow-xl border border-emerald-900/60 relative overflow-hidden mx-auto">
        
        {/* Top Badge */}
        <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-400/40 bg-[#074D33] text-amber-300 font-extrabold text-xs shadow-xs mx-auto text-center">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{effectiveExamOnlyMode ? 'মেধাতালিকা' : 'লিডারবোর্ড'}</span>
        </div>

        {/* Title */}
        <div className="space-y-1.5 max-w-xl mx-auto text-center">
          <h1 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight text-center">
            {effectiveExamOnlyMode
              ? `${selectedExamTitle} - এর মেধা তালিকা`
              : 'ফ্রি পরীক্ষায় অংশগ্রহণকারীদের লিডারবোর্ড'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {onBack && (
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-full border border-emerald-600/60 bg-[#074D33]/60 hover:bg-[#074D33] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
            >
              ফিরে যান
            </button>
          )}

          <button
            onClick={() => {
              if (effectiveExamOnlyMode) {
                setFilterType('this_exam');
              } else {
                setFilterType('today');
              }
            }}
            className="px-5 py-2.5 rounded-full bg-[#00E676] hover:bg-[#00C853] text-[#05402A] font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-[#05402A]" />
            <span>{effectiveExamOnlyMode ? 'মেধাতালিকা' : 'লিডারবোর্ড'}</span>
          </button>
        </div>

        {/* 4 Filter Tabs (Only in General Leaderboard) */}
        {!effectiveExamOnlyMode && (
          <div className="pt-2">
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
        )}

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
              "{selectedExamTitle}" পরীক্ষায় এখনো কোনো রেজাল্ট জমা হয়নি। আপনিই প্রথম পরীক্ষা দিয়ে শীর্ষে মেধা তালিকায় স্থান অর্জন করুন!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 2. Top Champion Section */}
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
                  <h3 className="font-black text-base sm:text-lg text-[#0B132B] dark:text-white">
                    {topOneItem.userName}
                  </h3>

                  <div className="inline-block px-3.5 py-0.5 rounded-full bg-[#FFC107] text-[#05402A] text-xs font-black shadow-2xs">
                    👑 ১ম স্থান
                  </div>

                  <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300 pt-0.5">
                    {currentFilter === 'this_exam' ? (
                      <>
                        {topOneItem.totalQuestions ? `প্রশ্ন: ${toBengaliNumeral(topOneItem.totalQuestions)}টি • ` : ''}একুরেসি {toBengaliNumeral(topOneItem.avgAccuracy)}%
                      </>
                    ) : (
                      <>
                        {toBengaliNumeral(topOneItem.testCount)}টি পরীক্ষা • গড় {toBengaliNumeral(topOneItem.avgAccuracy)}%
                      </>
                    )}
                  </p>

                  <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {currentFilter === 'this_exam' ? (
                      <>নম্বর: {toBengaliNumeral(topOneItem.score)}{topOneItem.totalQuestions > 0 ? ` / ${toBengaliNumeral(topOneItem.totalQuestions)}` : ''}</>
                    ) : (
                      <>{toBengaliNumeral(topOneItem.points)} পয়েন্ট</>
                    )}
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

          {/* 3. Current User Mint Card Banner */}
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

                  {currentFilter === 'this_exam' ? (
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                      {currentUserRankItem.examTitle ? `${currentUserRankItem.examTitle} • ` : ''}
                      {currentUserRankItem.totalQuestions ? `প্রশ্ন: ${toBengaliNumeral(currentUserRankItem.totalQuestions)}টি • ` : ''}
                      একুরেসি {toBengaliNumeral(currentUserRankItem.avgAccuracy)}%
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-extrabold rounded-full">
                        টেস্ট: {toBengaliNumeral(currentUserRankItem.testCount)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-extrabold rounded-full">
                        গড়: {toBengaliNumeral(currentUserRankItem.avgAccuracy)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Stats */}
              {currentFilter === 'this_exam' ? (
                <div className="flex items-center gap-3 shrink-0 text-right text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-slate-500 block">সঠিক</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      {toBengaliNumeral(currentUserRankItem.correctCount)}টি
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ভুল</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black text-sm">
                      {toBengaliNumeral(currentUserRankItem.wrongCount)}টি
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">নাম্বার</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                      {toBengaliNumeral(currentUserRankItem.score)}
                      {currentUserRankItem.totalQuestions > 0 ? ` / ${toBengaliNumeral(currentUserRankItem.totalQuestions)}` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-bold block">পয়েন্ট</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {toBengaliNumeral(currentUserRankItem.points)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. Other Participants Rankings List */}
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-xs sm:text-sm text-[#0B132B] dark:text-white truncate">
                          {item.userName}
                        </h4>
                        {item.isCurrentUser && (
                          <span className="px-2 py-0.2 bg-[#0B705C] text-white text-[9px] font-black rounded-full">
                            আপনি
                          </span>
                        )}
                      </div>

                      {currentFilter === 'this_exam' ? (
                        <p className="text-[10px] font-bold text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                          {item.examTitle ? `${item.examTitle} • ` : ''}
                          {item.totalQuestions ? `প্রশ্ন: ${toBengaliNumeral(item.totalQuestions)}টি • ` : ''}
                          একুরেসি: {toBengaliNumeral(item.avgAccuracy)}%
                        </p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.2 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-full">
                            টেস্ট: {toBengaliNumeral(item.testCount)}
                          </span>
                          <span className="px-2 py-0.2 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full">
                            গড়: {toBengaliNumeral(item.avgAccuracy)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentFilter === 'this_exam' ? (
                    <div className="flex items-center gap-2.5 text-right text-xs shrink-0">
                      <div>
                        <span className="text-[9px] text-slate-400 block">সঠিক</span>
                        <span className="text-emerald-600 font-black">
                          {toBengaliNumeral(item.correctCount)}টি
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">ভুল</span>
                        <span className="text-rose-600 font-black">
                          {toBengaliNumeral(item.wrongCount)}টি
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">নাম্বার</span>
                        <span className="text-amber-600 font-black text-sm">
                          {toBengaliNumeral(item.score)}
                          {item.totalQuestions > 0 ? ` / ${toBengaliNumeral(item.totalQuestions)}` : ''}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold block">পয়েন্ট</span>
                      <span className="text-base font-black text-amber-600">
                        {toBengaliNumeral(item.points)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
