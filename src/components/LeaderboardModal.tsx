import React, { useState, useEffect } from 'react';
import { X, Trophy, Sparkles, User, RefreshCw, Filter } from 'lucide-react';
import { toBengaliNumeral, getUserProfile } from '../lib/utils';
import { LeaderboardEntry, fetchLeaderboardEntriesFromSupabase, fetchExamsFromSupabase, ExamItem } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  examId?: string;
  examTitle?: string;
  exams?: ExamItem[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserScore = 0,
  totalQuestions = 0,
  correctCount = 0,
  wrongCount = 0,
  examId = 'all',
  examTitle,
  exams: propsExams,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(examId);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [examList, setExamList] = useState<ExamItem[]>(propsExams || []);

  const userProfile = getUserProfile();
  const userName = userProfile?.name?.trim() || 'আপনি (পরীক্ষার্থী)';
  const userAvatar = userProfile?.avatar;

  useEffect(() => {
    if (examId) {
      setSelectedExamId(examId);
    }
  }, [examId]);

  // Load Exams list for selector dropdown
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

  // Load Leaderboard data
  const loadLeaderboardData = async () => {
    if (!isOpen) return;
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
    if (isOpen) {
      loadLeaderboardData();

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
    }
  }, [isOpen, selectedExamId]);

  if (!isOpen) return null;

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

  const currentExamObj = examList.find((e) => e.id === selectedExamId);
  const displayTitle = examTitle || (currentExamObj ? currentExamObj.title : (selectedExamId === 'all' ? 'সকল পরীক্ষা' : selectedExamId));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#F4F7F9] dark:bg-[#070D1E] max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4 pb-6 my-auto">
        
        {/* Sticky Header Close Button */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#0D172A]/90 backdrop-blur-md px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-[#0B132B] dark:text-white">
              লাইভ মেধা তালিকা
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadLeaderboardData}
              className="p-2 text-slate-500 hover:text-[#0b705c] dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0B132B] dark:text-slate-200 font-extrabold text-xs rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>বন্ধ করুন</span>
            </button>
          </div>
        </div>

        <div className="px-3 sm:px-5 space-y-5">
          
          {/* Top Banner Card */}
          <div className="bg-[#0B132B] text-white rounded-[32px] p-5 sm:p-7 text-center space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
            
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-400/50 bg-[#121E36]/80 text-amber-300 font-black text-xs shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>পরীক্ষার প্রকৃত মেধা তালিকা</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                {displayTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/90 font-semibold max-w-md mx-auto">
                প্রকৃত পরীক্ষার্থীদের নম্বর ও নির্ভুলতার লাইভ র‍্যাংকিং
              </p>
            </div>

            {/* Filter Selector */}
            <div className="pt-2">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#121E36] text-amber-300 border border-slate-700 rounded-xl font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">🏆 সকল পরীক্ষার মেধা তালিকা (সম্মিলিত)</option>
                {examList.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    📝 {exam.title} ({exam.subject})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Current User Highlighting Card */}
          <div className="bg-blue-50/90 dark:bg-slate-800/80 rounded-[24px] p-4 sm:p-5 border-2 border-[#0B132B] flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg font-black text-[#0B132B] dark:text-amber-300 shrink-0">
                {userRank ? `#${toBengaliNumeral(userRank)}` : '-'}
              </span>
              <div className="relative shrink-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#0B132B]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-black text-xs border-2 border-[#0B132B]">
                    <User className="w-6 h-6 text-amber-300" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0B132B] text-white text-[9px] font-black rounded-full border border-white">
                  আপনি
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-[#0B132B] dark:text-white truncate">
                    {userName}
                  </h4>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                  {userRank
                    ? `আপনার অবস্থান: ${toBengaliNumeral(userRank)}ম স্থান`
                    : 'এখনো পরীক্ষা সাবমিট করেননি'}
                </p>
              </div>
            </div>

            {currentUserItem && (
              <div className="flex items-center gap-3 shrink-0 text-center text-xs font-bold">
                <div>
                  <span className="text-[10px] text-slate-500 block">সঠিক</span>
                  <span className="text-[#0B132B] dark:text-amber-400 font-black">
                    {toBengaliNumeral(currentUserItem.correct_count)}টি
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">নাম্বার</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                    {toBengaliNumeral(currentUserItem.score)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table / Empty State */}
          {isLoading ? (
            <div className="p-8 text-center bg-white dark:bg-[#0D172A] rounded-[28px] border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 text-[#0b705c] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">মেধা তালিকা লোড হচ্ছে...</p>
            </div>
          ) : rankedList.length === 0 ? (
            /* Empty State - Absolutely NO Fake/Placeholder Names */
            <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-8 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/60">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-[#0B132B] dark:text-white">
                এখনো কোনো পরীক্ষার্থী অংশ নেয়নি
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                এই পরীক্ষায় এখনো কোনো উত্তরপত্র সাবমিট হয়নি। আপনি পরীক্ষা দিয়ে শীর্ষে জায়গা নিন!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Podium Section for Top 3 */}
              {rankedList.length >= 1 && (
                <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-center text-[#0B132B] dark:text-white font-black text-base">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3>শীর্ষ বিজয়ী</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-end pt-1">
                    {/* 2nd Place */}
                    {rankedList[1] ? (
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className="relative">
                          {rankedList[1].user_avatar ? (
                            <img
                              src={rankedList[1].user_avatar}
                              alt={rankedList[1].user_name}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-300"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#0b705c] text-white flex items-center justify-center font-black">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-slate-300 text-slate-800 text-[9px] font-black rounded-full border border-white">
                            🥈 ২য়
                          </div>
                        </div>
                        <h4 className="text-[11px] font-black text-[#0B132B] dark:text-white truncate max-w-[80px]">
                          {rankedList[1].user_name}
                        </h4>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          {toBengaliNumeral(rankedList[1].score)} নম্বর
                        </p>
                      </div>
                    ) : <div />}

                    {/* 1st Place */}
                    {rankedList[0] && (
                      <div className="flex flex-col items-center text-center space-y-1 -mt-2">
                        <div className="text-lg">👑</div>
                        <div className="relative">
                          {rankedList[0].user_avatar ? (
                            <img
                              src={rankedList[0].user_avatar}
                              alt={rankedList[0].user_name}
                              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-400"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-[#0b705c] text-white flex items-center justify-center font-black">
                              <User className="w-7 h-7" />
                            </div>
                          )}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full border border-white">
                            🥇 ১ম
                          </div>
                        </div>
                        <h4 className="text-xs font-black text-[#0B132B] dark:text-white truncate max-w-[100px]">
                          {rankedList[0].user_name}
                        </h4>
                        <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {toBengaliNumeral(rankedList[0].score)} নম্বর
                        </p>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {rankedList[2] ? (
                      <div className="flex flex-col items-center text-center space-y-1">
                        <div className="relative">
                          {rankedList[2].user_avatar ? (
                            <img
                              src={rankedList[2].user_avatar}
                              alt={rankedList[2].user_name}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-600/40"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#0b705c] text-white flex items-center justify-center font-black">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-800 text-white text-[9px] font-black rounded-full border border-white">
                            🥉 ৩য়
                          </div>
                        </div>
                        <h4 className="text-[11px] font-black text-[#0B132B] dark:text-white truncate max-w-[80px]">
                          {rankedList[2].user_name}
                        </h4>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          {toBengaliNumeral(rankedList[2].score)} নম্বর
                        </p>
                      </div>
                    ) : <div />}
                  </div>
                </div>
              )}

              {/* Ranking List Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs font-black text-slate-500">
                  <span>পরীক্ষার্থীদের তালিকা</span>
                  <span>মোট: {toBengaliNumeral(rankedList.length)} জন</span>
                </div>

                {rankedList.slice(3).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-3 border flex items-center justify-between gap-3 shadow-xs ${
                      item.isCurrentUser
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400'
                        : 'bg-white dark:bg-[#0D172A] border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-slate-500 shrink-0 w-6 text-center">
                        #{toBengaliNumeral(item.rank)}
                      </span>
                      {item.user_avatar ? (
                        <img
                          src={item.user_avatar}
                          alt={item.user_name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black text-xs shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#0B132B] dark:text-white truncate">
                          {item.user_name} {item.isCurrentUser ? '(আপনি)' : ''}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500">
                          একুরেসি: {item.accuracy}%
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 block">
                        {toBengaliNumeral(item.score)} নম্বর
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {toBengaliNumeral(item.correct_count)}টি সঠিক
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
