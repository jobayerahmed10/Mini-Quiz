import React, { useState } from 'react';
import { X, Trophy, Sparkles, Award, ArrowLeft, User } from 'lucide-react';
import { toBengaliNumeral, getUserProfile } from '../lib/utils';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserScore?: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserScore = 1,
  totalQuestions = 16,
  correctCount = 1,
  wrongCount = 15,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'current' | 'week' | 'month' | 'all'>('current');
  const userProfile = getUserProfile();
  const userName = userProfile?.name || 'আপনার স্থান';
  const userAvatar = userProfile?.avatar;

  if (!isOpen) return null;

  // Candidate pool
  const baseCandidates = [
    {
      id: 'c1',
      name: 'মাওলানা হাফেজ আব্দুল মালেক',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 15,
      correct: 15,
      wrong: 0,
      tests: '২৮টি পরীক্ষা',
      avg: 'গড় ২৯.৫',
    },
    {
      id: 'c2',
      name: 'মুফতি তানভীর আহমেদ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 14,
      correct: 14,
      wrong: 1,
      tests: '২৮টি পরীক্ষা',
      avg: 'গড় ২৮.৩',
    },
    {
      id: 'c3',
      name: 'কারি মোশতাক মাহমুদ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      isCurrentUser: false,
      marks: 14,
      correct: 14,
      wrong: 1,
      tests: '২৭টি পরীক্ষা',
      avg: 'গড় ২৮.১',
    },
    {
      id: 'c4',
      name: 'হাফেজ মাওলানা ওবায়দুল্লাহ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 13,
      correct: 13,
      wrong: 2,
      tests: '২৫টি পরীক্ষা',
      avg: 'গড় ২৭.০',
    },
    {
      id: 'c5',
      name: 'মাওলানা উবায়দুল হক',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 12,
      correct: 12,
      wrong: 3,
      tests: '২৪টি পরীক্ষা',
      avg: 'গড় ২৬.৫',
    },
    {
      id: 'c6',
      name: 'মুফতি আব্দুল কাইয়ুম',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 11,
      correct: 11,
      wrong: 4,
      tests: '২২টি পরীক্ষা',
      avg: 'গড় ২৫.০',
    },
    {
      id: 'c7',
      name: 'এনটিআরসিএ পরীক্ষার্থী (চট্টগ্রাম)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 10,
      correct: 10,
      wrong: 5,
      tests: '২০টি পরীক্ষা',
      avg: 'গড় ২৩.০',
    },
    {
      id: 'c8',
      name: 'মোঃ জসিম উদ্দিন (রাজশাহী)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
      isCurrentUser: false,
      marks: 8,
      correct: 8,
      wrong: 7,
      tests: '১৮টি পরীক্ষা',
      avg: 'গড় ২০.৫',
    },
  ];

  const userCandidate = {
    id: 'user_current',
    name: userName === 'আপনার স্থান' ? 'আপনি (পরীক্ষার্থী)' : userName,
    avatar: userAvatar || '',
    isCurrentUser: true,
    marks: correctCount,
    correct: correctCount,
    wrong: wrongCount,
    tests: '১টি পরীক্ষা',
    avg: `গড় ${correctCount}`,
  };

  // Combine & Sort strictly by Marks (Descending), then Correct count
  const allCandidates = [...baseCandidates, userCandidate].sort((a, b) => {
    if (b.marks !== a.marks) return b.marks - a.marks;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  // Assign ranks
  const rankedList = allCandidates.map((c, index) => {
    const rank = index + 1;
    const accuracy = totalQuestions > 0 ? `${Math.round((c.marks / totalQuestions) * 100)}%` : '১০০%';
    return {
      ...c,
      rank,
      accuracy,
      points: `${c.marks} পয়েন্ট`,
    };
  });

  const userRankItem = rankedList.find((item) => item.isCurrentUser);
  const userRank = userRankItem ? userRankItem.rank : 1;

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

  const accuracyPct = Math.round((correctCount / (totalQuestions || 1)) * 100);

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
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0B132B] dark:text-slate-200 font-extrabold text-xs rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>বন্ধ করুন</span>
          </button>
        </div>

        <div className="px-3 sm:px-5 space-y-5">
          
          {/* Top Navy Blue Banner Card */}
          <div className="bg-[#0B132B] text-white rounded-[32px] p-5 sm:p-7 text-center space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
            
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-400/50 bg-[#121E36]/80 text-amber-300 font-black text-xs shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>লাইভ মেধা তালিকা</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                ফ্রি পরীক্ষায় অংশগ্রহণকারীদের মেধা তালিকা
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/90 font-semibold max-w-md mx-auto">
                বিষয়ভিত্তিক ও মডেল টেস্ট পরীক্ষার সেরা পরীক্ষার্থীদের তালিকা
              </p>
            </div>

            {/* Center Pill Badge */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#162444] text-amber-300 border border-slate-700 font-black text-xs sm:text-sm shadow-md">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>ফ্রি মেধা তালিকা</span>
              </div>
            </div>

            {/* Filter Tab Pills Container */}
            <div className="bg-[#121E36]/90 rounded-2xl p-1.5 grid grid-cols-4 gap-1 border border-slate-700/50 pt-1">
              {[
                { id: 'current', label: 'এই পরীক্ষা' },
                { id: 'week', label: 'এই সপ্তাহে' },
                { id: 'month', label: 'এই মাসে' },
                { id: 'all', label: 'সর্বকালের' },
              ].map((tab) => {
                const isActive = filterPeriod === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterPeriod(tab.id as any)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FFC107] text-[#0B132B] shadow-md scale-102'
                        : 'text-slate-200/80 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* White Card: "✨ শীর্ষ ৩ বিজয়ী" (Podium Section) */}
          <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-center text-[#0B132B] dark:text-white font-black text-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3>শীর্ষ ৩ বিজয়ী</h3>
            </div>

            {/* 3 Winner Columns Layout */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2">
              
              {/* 2nd Place (Left Column) */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <img
                    src={topWinners[1].avatar}
                    alt={topWinners[1].name}
                    className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ${topWinners[1].ringColor}`}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-xs border border-white">
                    🥈
                  </div>
                </div>

                <div className="space-y-1 pt-1 min-w-0 w-full">
                  <h4 className="text-xs sm:text-sm font-black text-[#0B132B] dark:text-white leading-tight truncate">
                    {topWinners[1].name}
                  </h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] ${topWinners[1].badgeBg}`}>
                    {topWinners[1].title}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                    {topWinners[1].tests} • {topWinners[1].avg}
                  </p>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {topWinners[1].points}
                  </p>
                </div>

                {/* Podium Block 2 */}
                <div className={`w-full h-24 sm:h-28 rounded-2xl ${topWinners[1].podiumBg} flex flex-col items-center justify-center p-2 space-y-0.5 shadow-inner`}>
                  <span className={`text-2xl font-black ${topWinners[1].numColor}`}>২</span>
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                    রানার-আপ
                  </span>
                </div>
              </div>

              {/* 1st Place (Center Column - Taller) */}
              <div className="flex flex-col items-center text-center space-y-2 -mt-4">
                <div className="relative">
                  {/* Gold Crown */}
                  <div className="text-2xl -mb-1 animate-bounce">👑</div>
                  <img
                    src={topWinners[0].avatar}
                    alt={topWinners[0].name}
                    className={`w-16 h-16 sm:w-22 sm:h-22 rounded-2xl object-cover ${topWinners[0].ringColor}`}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
                    🥇
                  </div>
                </div>

                <div className="space-y-1 pt-1 min-w-0 w-full">
                  <h4 className="text-xs sm:text-sm font-black text-[#0B132B] dark:text-white leading-tight truncate">
                    {topWinners[0].name}
                  </h4>
                  <span className={`inline-block px-3 py-0.5 rounded-full font-black text-[10px] shadow-xs ${topWinners[0].badgeBg}`}>
                    👑 {topWinners[0].title}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                    {topWinners[0].tests} • {topWinners[0].avg}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                    {topWinners[0].points}
                  </p>
                </div>

                {/* Podium Block 1 */}
                <div className={`w-full h-32 sm:h-36 rounded-2xl ${topWinners[0].podiumBg} flex flex-col items-center justify-center p-2 space-y-0.5 shadow-md`}>
                  <span className={`text-3xl font-black ${topWinners[0].numColor}`}>১</span>
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    চ্যাম্পিয়ন
                  </span>
                </div>
              </div>

              {/* 3rd Place (Right Column) */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <img
                    src={topWinners[2].avatar}
                    alt={topWinners[2].name}
                    className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ${topWinners[2].ringColor}`}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-amber-800 text-white flex items-center justify-center font-black text-xs shadow-xs border border-white">
                    🥉
                  </div>
                </div>

                <div className="space-y-1 pt-1 min-w-0 w-full">
                  <h4 className="text-xs sm:text-sm font-black text-[#0B132B] dark:text-white leading-tight truncate">
                    {topWinners[2].name}
                  </h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] ${topWinners[2].badgeBg}`}>
                    {topWinners[2].title}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                    {topWinners[2].tests} • {topWinners[2].avg}
                  </p>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {topWinners[2].points}
                  </p>
                </div>

                {/* Podium Block 3 */}
                <div className={`w-full h-20 sm:h-24 rounded-2xl ${topWinners[2].podiumBg} flex flex-col items-center justify-center p-2 space-y-0.5 shadow-inner`}>
                  <span className={`text-2xl font-black ${topWinners[2].numColor}`}>৩</span>
                  <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300">
                    ৩য় স্থান
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Current User Card (Highlighted Navy Card) */}
          <div className="bg-blue-50/90 dark:bg-slate-800/80 rounded-[24px] p-4 sm:p-5 border-2 border-[#0B132B] flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg font-black text-[#0B132B] dark:text-amber-300 shrink-0">
                {toBengaliNumeral(userRank)}.
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
                  <span className="px-2 py-0.5 bg-[#0B132B] text-white font-black text-[10px] rounded-full shrink-0">
                    আপনি
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                  আপনার মেধা অবস্থান • একুরেসি {accuracyPct}%
                </p>
              </div>
            </div>

            {/* Right side stats */}
            <div className="flex items-center gap-3 shrink-0 text-center text-xs font-bold">
              <div>
                <span className="text-[10px] text-slate-500 block">সঠিক</span>
                <span className="text-[#0B132B] dark:text-amber-400 font-black">
                  {toBengaliNumeral(correctCount)}টি
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ভুল</span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {toBengaliNumeral(wrongCount)}টি
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">নাম্বার</span>
                <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                  {toBengaliNumeral(correctCount)}
                </span>
              </div>
            </div>
          </div>

          {/* "অন্যান্য পরীক্ষার্থীদের র‍্যাংকিং" Section */}
          <div className="space-y-3 pt-2">
            
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-[#0B132B] dark:text-white">
                অন্যান্য পরীক্ষার্থীদের র‍্যাংকিং
              </h3>
              <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-extrabold text-[11px]">
                মোট পরীক্ষার্থী: ৩৬ জন
              </span>
            </div>

            {/* Ranking Cards List */}
            <div className="space-y-2.5">
              {otherRankings.map((item) => (
                <div
                  key={item.rank}
                  className="bg-white dark:bg-[#0D172A] rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-300 shrink-0 w-6 text-center">
                      {item.rank}.
                    </span>
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-[#0B132B] dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        একুরেসি {item.accuracy}
                      </p>
                    </div>
                  </div>

                  {/* Right columns */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-center text-xs font-bold">
                    <div>
                      <span className="text-[10px] text-slate-400 block hidden sm:block">সঠিক</span>
                      <span className="text-[#0B132B] dark:text-amber-400 font-black">
                        {toBengaliNumeral(item.correct)}টি
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block hidden sm:block">ভুল</span>
                      <span className="text-rose-500 dark:text-rose-400 font-black">
                        {toBengaliNumeral(item.wrong)}টি
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block hidden sm:block">নাম্বার</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black text-sm sm:text-base">
                        {toBengaliNumeral(item.marks)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
