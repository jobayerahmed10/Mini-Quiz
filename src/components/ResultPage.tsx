import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft,
  Share2,
  Trophy,
  BookOpen,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { QuizResult, UserAnswer, Question } from '../types';
import { toBengaliNumeral, getUserProfile, OPTION_BENGLI_LABEL, formatArabicText, isFullyArabic } from '../lib/utils';
import { QuestionActionFooter } from './QuestionActionFooter';

interface ResultPageProps {
  result: QuizResult;
  onRetry: () => void;
  onNavigateHome: () => void;
  onOpenLeaderboard?: () => void;
  showHarakat?: boolean;
  initialViewMode?: 'summary' | 'explanation' | 'leaderboard';
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onNavigateHome,
  showHarakat = true,
}) => {
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

  const handleShareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: `${examTitle} - পরীক্ষার ফলাফল`,
        text: `তামরীন একাডেমিতে ${examTitle} পরীক্ষায় আমার প্রাপ্ত নম্বর: ${toBengaliNumeral(obtainedMarksVal)}/${toBengaliNumeral(result.totalQuestions)}`,
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

          {/* Row 2: সঠিক উত্তর */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">সঠিক উত্তর</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(result.correctCount)}
            </span>
          </div>

          {/* Row 3: ভুল উত্তর */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">ভুল উত্তর</span>
            <span className="text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(result.wrongCount)}
            </span>
          </div>

          {/* Row 4: নেগেটিভ মার্ক */}
          <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">নেগেটিভ মার্ক</span>
            <span className="text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
              {toBengaliNumeral(negativeMarkVal.toFixed(2))}
            </span>
          </div>

          {/* Row 5: প্রাপ্ত নম্বর */}
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

        {/* 4. DETAILED EXPLANATIONS & ALL QUESTIONS WITH ANSWERS */}
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

      </div>
    </div>
  );
};
