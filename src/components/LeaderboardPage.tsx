import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Sparkles, Award, User, RefreshCw, Filter } from 'lucide-react';
import { toBengaliNumeral, getUserProfile } from '../lib/utils';
import { LeaderboardEntry, fetchLeaderboardEntriesFromSupabase, fetchExamsFromSupabase, ExamItem } from '../lib/supabase';

interface LeaderboardPageProps {
  onBack: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  initialExamId?: string;
  exams?: ExamItem[];
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  onBack,
  currentUserScore = 0,
  totalQuestions = 0,
  correctCount = 0,
  wrongCount = 0,
  initialExamId = 'all',
  exams: propsExams,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [examList, setExamList] = useState<ExamItem[]>(propsExams || []);

  const userProfile = getUserProfile();
  const userName = userProfile?.name?.trim() || 'আপনি (পরীক্ষার্থী)';

  // Load Exams list for filter
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

  // Load Leaderboard entries
  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboardEntriesFromSupabase(selectedExamId);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();

    // Listen for live leaderboard updates from other tabs
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
      if (bc) bc.close();
    };
  }, [selectedExamId]);

  // Filter & Sort entries
  const filteredEntries = entries.filter((e) => {
    if (!selectedExamId || selectedExamId === 'all') return true;
    return e.exam_id === selectedExamId || e.exam_title === selectedExamId;
  });

  // Sort strictly by score (desc), accuracy (desc), created_at (asc)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Assign 1-based ranks
  const rankedList = sortedEntries.map((item, index) => {
    const isUser = userProfile?.name && item.user_name?.toLowerCase().trim() === userProfile.name.toLowerCase().trim();
    return {
      ...item,
      rank: index + 1,
      isCurrentUser: isUser,
    };
  });

  const currentUserItem = rankedList.find((item) => item.isCurrentUser);
  const userRank = currentUserItem ? currentUserItem.rank : null;

  // Selected Exam Title
  const currentExamObj = examList.find((e) => e.id === selectedExamId);
  const selectedExamTitle = currentExamObj ? currentExamObj.title : (selectedExamId === 'all' ? 'সকল পরীক্ষা' : selectedExamId);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070D1E] pb-24 animate-fade-in">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#0b705c] dark:text-emerald-400 font-extrabold text-xs sm:text-sm hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ফিরে যান</span>
          </button>

          <div className="flex items-center gap-1.5 font-black text-sm sm:text-base text-[#0B132B] dark:text-white">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>লাইভ মেধা তালিকা</span>
          </div>

          <button
            onClick={loadLeaderboardData}
            className="p-2 text-slate-500 hover:text-[#0b705c] dark:hover:text-emerald-400 transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Exam Selection Dropdown / Selector */}
        <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-[#0B132B] dark:text-white px-1">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#0b705c] dark:text-emerald-400" />
              <span>পরীক্ষা ফিল্টার করুন:</span>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">
              মোট অংশগ্রহণকারী: {toBengaliNumeral(rankedList.length)} জন
            </span>
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs sm:text-sm text-[#0B132B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b705c]"
          >
            <option value="all">🏆 সকল পরীক্ষার মেধা তালিকা (সম্মিলিত)</option>
            {examList.map((exam) => (
              <option key={exam.id} value={exam.id}>
                📝 {exam.title} ({exam.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Current User Stats Card Banner */}
        <div className="bg-gradient-to-r from-[#0b705c] to-[#0B132B] text-white rounded-[28px] p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
            <Trophy className="w-40 h-40" />
          </div>

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400 border border-white/30 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lg border border-white/20 shrink-0">
                  <User className="w-6 h-6 text-amber-300" />
                </div>
              )}
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  {userName}
                </h3>
                <p className="text-[11px] font-bold text-amber-200">
                  {userRank
                    ? `আপনার মেধা অবস্থান: ${toBengaliNumeral(userRank)}ম স্থান`
                    : 'আপনি এখনো এই পরীক্ষায় অংশ নেননি'}
                </p>
              </div>
            </div>

            {currentUserItem && (
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">
                  {toBengaliNumeral(currentUserItem.score)}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  /{toBengaliNumeral(currentUserItem.total_questions)} মার্কস
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="p-12 text-center bg-white dark:bg-[#0D172A] rounded-[28px] border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 text-[#0b705c] animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">মেধা তালিকা লোড হচ্ছে...</p>
          </div>
        ) : rankedList.length === 0 ? (
          /* Empty State - No Fake/Placeholder Data */
          <div className="bg-white dark:bg-[#0D172A] rounded-[28px] p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
            
            {/* Top Winners Podium (Dynamic rendering for 1, 2, or 3 top ranks) */}
            {rankedList.length >= 1 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2">
                {/* 2nd Place */}
                {rankedList[1] ? (
                  <div className="bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-600 rounded-3xl p-3 sm:p-4 text-center space-y-2 shadow-sm">
                    <div className="relative inline-block">
                      {rankedList[1].user_avatar ? (
                        <img
                          src={rankedList[1].user_avatar}
                          alt={rankedList[1].user_name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto ring-4 ring-slate-300"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ring-4 ring-slate-300">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                        ২য়
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-[#0B132B] dark:text-white line-clamp-1">
                        {rankedList[1].user_name}
                      </h4>
                      <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {toBengaliNumeral(rankedList[1].score)} নম্বর
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="opacity-0 pointer-events-none" />
                )}

                {/* 1st Place (Center / Taller) */}
                {rankedList[0] && (
                  <div className="bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 rounded-3xl p-3.5 sm:p-5 text-center space-y-2.5 shadow-md -translate-y-2">
                    <div className="relative inline-block">
                      {rankedList[0].user_avatar ? (
                        <img
                          src={rankedList[0].user_avatar}
                          alt={rankedList[0].user_name}
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover mx-auto ring-4 ring-amber-400"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ring-4 ring-amber-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFC107] text-[#0B132B] flex items-center gap-0.5 shadow-xs">
                        🏆 ১ম
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-[#0B132B] dark:text-white line-clamp-1">
                        {rankedList[0].user_name}
                      </h4>
                      <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                        {toBengaliNumeral(rankedList[0].score)} নম্বর
                      </p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {rankedList[2] ? (
                  <div className="bg-orange-100/70 dark:bg-amber-950/40 border-2 border-amber-300/60 rounded-3xl p-3 sm:p-4 text-center space-y-2 shadow-sm">
                    <div className="relative inline-block">
                      {rankedList[2].user_avatar ? (
                        <img
                          src={rankedList[2].user_avatar}
                          alt={rankedList[2].user_name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto ring-4 ring-amber-600/40"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ring-4 ring-amber-600/40">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-800/20 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        ৩য়
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-[11px] sm:text-xs text-[#0B132B] dark:text-white line-clamp-1">
                        {rankedList[2].user_name}
                      </h4>
                      <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {toBengaliNumeral(rankedList[2].score)} নম্বর
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="opacity-0 pointer-events-none" />
                )}
              </div>
            )}

            {/* Full Rankings Table List (4th+ and All) */}
            <div className="bg-white dark:bg-[#0D172A] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-md divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
                <span>মেধা অবস্থান & পরীক্ষার্থী</span>
                <span>স্কোর & নির্ভুলতা</span>
              </div>

              {rankedList.slice(3).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                    item.isCurrentUser
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 text-center font-black text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">
                      #{toBengaliNumeral(item.rank)}
                    </span>

                    {item.user_avatar ? (
                      <img
                        src={item.user_avatar}
                        alt={item.user_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black text-xs shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className={`text-xs sm:text-sm font-black truncate ${
                        item.isCurrentUser ? 'text-[#0b705c] dark:text-emerald-400 font-black' : 'text-[#0B132B] dark:text-white'
                      }`}>
                        {item.user_name} {item.isCurrentUser ? '(আপনি)' : ''}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        সঠিক: {toBengaliNumeral(item.correct_count)}টি | ভুল: {toBengaliNumeral(item.wrong_count)}টি
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                      {toBengaliNumeral(item.score)} নম্বর
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      নির্ভুলতা: {item.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
