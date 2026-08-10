import React, { useState } from 'react';
import { ArrowLeft, Trophy, Sparkles, Award, User, Medal } from 'lucide-react';
import { toBengaliNumeral, getUserProfile } from '../lib/utils';

interface LeaderboardPageProps {
  onBack: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  onBack,
  currentUserScore = 15,
  totalQuestions = 15,
  correctCount = 14,
  wrongCount = 1,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'current' | 'week' | 'month'>('current');
  const userProfile = getUserProfile();
  const userName = userProfile?.name || 'আপনি (পরীক্ষার্থী)';

  // Pool of mock candidates to compete with
  const baseCandidates = [
    {
      id: 'c1',
      name: 'মাওলানা হাফেজ আব্দুল মালেক',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 15,
      correct: 15,
      wrong: 0,
      pointsText: '১৫ নম্বর',
    },
    {
      id: 'c2',
      name: 'মুফতি তানভীর আহমেদ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 14,
      correct: 14,
      wrong: 1,
      pointsText: '১৪ নম্বর',
    },
    {
      id: 'c3',
      name: 'কারি মোশতাক মাহমুদ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 14,
      correct: 14,
      wrong: 1,
      pointsText: '১৪ নম্বর',
    },
    {
      id: 'c4',
      name: 'হাফেজ মাওলানা ওবায়দুল্লাহ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 13,
      correct: 13,
      wrong: 2,
      pointsText: '১৩ নম্বর',
    },
    {
      id: 'c5',
      name: 'মাওলানা উবায়দুল হক',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 12,
      correct: 12,
      wrong: 3,
      pointsText: '১২ নম্বর',
    },
    {
      id: 'c6',
      name: 'মুফতি আব্দুল কাইয়ুম',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 11,
      correct: 11,
      wrong: 4,
      pointsText: '১১ নম্বর',
    },
    {
      id: 'c7',
      name: 'এনটিআরসিএ পরীক্ষার্থী (চট্টগ্রাম)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 10,
      correct: 10,
      wrong: 5,
      pointsText: '১০ নম্বর',
    },
    {
      id: 'c8',
      name: 'মোঃ জসিম উদ্দিন (রাজশাহী)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 8,
      correct: 8,
      wrong: 7,
      pointsText: '৮ নম্বর',
    },
  ];

  // User Candidate Object
  const userCandidate = {
    id: 'user_current',
    name: userProfile?.name ? `${userProfile.name} (আপনি)` : 'আপনি (পরীক্ষার্থী)',
    avatar: userProfile?.avatar || '',
    isCurrentUser: true,
    marks: currentUserScore,
    correct: correctCount,
    wrong: wrongCount,
    pointsText: `${currentUserScore} নম্বর`,
  };

  // Combine & Sort strictly by Marks (Descending), then Correct count
  const allCandidates = [...baseCandidates, userCandidate].sort((a, b) => {
    if (b.marks !== a.marks) return b.marks - a.marks;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  // Assign ranks sequentially based on marks order
  const rankedList = allCandidates.map((c, index) => {
    const rank = index + 1;
    const accuracy = totalQuestions > 0 ? `${Math.round((c.marks / totalQuestions) * 100)}%` : '১০০%';
    return {
      ...c,
      rank,
      accuracy,
    };
  });

  // Find user's exact rank
  const userRankItem = rankedList.find((item) => item.isCurrentUser);
  const userRank = userRankItem ? userRankItem.rank : 1;

  // Podium (Top 3) vs Other Rankings (4th+)
  const topWinners = [
    {
      ...rankedList[0],
      title: '১ম স্থান',
      label: 'চ্যাম্পিয়ন',
      badgeBg: 'bg-[#FFC107] text-[#0B132B]',
      podiumBg: 'bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400',
      numColor: 'text-amber-600',
      ringColor: 'ring-4 ring-amber-400',
    },
    {
      ...rankedList[1],
      title: '২য় স্থান',
      label: 'রানার-আপ',
      badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
      podiumBg: 'bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-600',
      numColor: 'text-slate-600 dark:text-slate-300',
      ringColor: 'ring-4 ring-slate-300',
    },
    {
      ...rankedList[2],
      title: '৩য় স্থান',
      label: '৩য় স্থান',
      badgeBg: 'bg-amber-800/20 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
      podiumBg: 'bg-orange-100/70 dark:bg-amber-950/40 border-2 border-amber-300/60',
      numColor: 'text-amber-800 dark:text-amber-300',
      ringColor: 'ring-4 ring-amber-600/40',
    },
  ];

  const otherRankings = rankedList.slice(3);

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
            <span>জাতীয় মেধা তালিকা</span>
          </div>

          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Current User Card Banner */}
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
                  আপনার মেধা অবস্থান: {toBengaliNumeral(userRank)}ম স্থান
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">
                {toBengaliNumeral(currentUserScore)}
              </span>
              <span className="text-xs font-bold text-slate-200">/{toBengaliNumeral(totalQuestions)} মার্কস</span>
            </div>
          </div>
        </div>

        {/* Filter Period Tabs */}
        <div className="flex items-center justify-center p-1.5 bg-white dark:bg-[#0D172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setFilterPeriod('current')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
              filterPeriod === 'current'
                ? 'bg-[#0b705c] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            সামগ্রিক মেধা
          </button>
          <button
            onClick={() => setFilterPeriod('week')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
              filterPeriod === 'week'
                ? 'bg-[#0b705c] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            এই সপ্তাহ
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
              filterPeriod === 'month'
                ? 'bg-[#0b705c] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            এই মাস
          </button>
        </div>

        {/* Top 3 Winners Podium Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2">
          {/* 2nd Place */}
          <div className={`rounded-3xl p-3 sm:p-4 text-center space-y-2 ${topWinners[1].podiumBg} shadow-sm`}>
            <div className="relative inline-block">
              {topWinners[1].avatar ? (
                <img
                  src={topWinners[1].avatar}
                  alt={topWinners[1].name}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto ${topWinners[1].ringColor}`}
                />
              ) : (
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ${topWinners[1].ringColor}`}>
                  <User className="w-6 h-6" />
                </div>
              )}
              <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full ${topWinners[1].badgeBg}`}>
                ২য়
              </span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-[11px] sm:text-xs text-[#0B132B] dark:text-white line-clamp-1">
                {topWinners[1].name}
              </h4>
              <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {toBengaliNumeral(topWinners[1].marks)} মার্কস
              </p>
            </div>
          </div>

          {/* 1st Place (Center / Taller) */}
          <div className={`rounded-3xl p-3.5 sm:p-5 text-center space-y-2.5 ${topWinners[0].podiumBg} shadow-md border-amber-400 -translate-y-2`}>
            <div className="relative inline-block">
              {topWinners[0].avatar ? (
                <img
                  src={topWinners[0].avatar}
                  alt={topWinners[0].name}
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover mx-auto ${topWinners[0].ringColor}`}
                />
              ) : (
                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ${topWinners[0].ringColor}`}>
                  <User className="w-8 h-8" />
                </div>
              )}
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-black px-2.5 py-0.5 rounded-full ${topWinners[0].badgeBg} flex items-center gap-0.5 shadow-xs`}>
                🏆 ১ম
              </span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-xs sm:text-sm text-[#0B132B] dark:text-white line-clamp-1">
                {topWinners[0].name}
              </h4>
              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                {toBengaliNumeral(topWinners[0].marks)} মার্কস
              </p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className={`rounded-3xl p-3 sm:p-4 text-center space-y-2 ${topWinners[2].podiumBg} shadow-sm`}>
            <div className="relative inline-block">
              {topWinners[2].avatar ? (
                <img
                  src={topWinners[2].avatar}
                  alt={topWinners[2].name}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto ${topWinners[2].ringColor}`}
                />
              ) : (
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0b705c] text-white flex items-center justify-center font-black mx-auto ${topWinners[2].ringColor}`}>
                  <User className="w-6 h-6" />
                </div>
              )}
              <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full ${topWinners[2].badgeBg}`}>
                ৩য়
              </span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-[11px] sm:text-xs text-[#0B132B] dark:text-white line-clamp-1">
                {topWinners[2].name}
              </h4>
              <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {toBengaliNumeral(topWinners[2].marks)} মার্কস
              </p>
            </div>
          </div>
        </div>

        {/* Full Rankings Table List */}
        <div className="bg-white dark:bg-[#0D172A] rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-md divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
            <span>মেধা অবস্থান & পরীক্ষার্থী</span>
            <span>স্কোর & নির্ভুলতা</span>
          </div>

          {otherRankings.map((item) => (
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

                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.name}
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
                    {item.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    সঠিক: {toBengaliNumeral(item.correct)}টি | ভুল: {toBengaliNumeral(item.wrong)}টি
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                  {toBengaliNumeral(item.marks)} নম্বর
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  নির্ভুলতা: {item.accuracy}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
