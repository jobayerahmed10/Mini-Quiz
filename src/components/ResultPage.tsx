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

  // Format Elapsed Time
  const formatElapsedTime = (totalSeconds: number = 0) => {
    if (!totalSeconds || totalSeconds < 60) {
      return `${toBengaliNumeral(totalSeconds || 1)} সেকেন্ড`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (secs === 0) {
      return `${toBengaliNumeral(mins)} মিনিট`;
    }
    return `${toBengaliNumeral(mins)} মিনিট ${toBengaliNumeral(secs)} সেকেন্ড`;
  };

  const formattedTimeBengali = formatElapsedTime(result.timeTakenSeconds || 60);

  // Negative Marking Calculation
  const negativeMarkVal = result.negativeMarks !== undefined 
    ? result.negativeMarks 
    : Number((result.wrongCount * 0.25).toFixed(2));
  
  const obtainedMarksVal = Math.max(0, Number((result.correctCount - negativeMarkVal).toFixed(2)));
  const isPassed = result.percentage >= 40;

  const scorePercentage = result.percentage !== undefined && result.percentage > 0
    ? result.percentage
    : (result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0);

  const isHighScore = scorePercentage > 80;
  const hasTriggeredConfetti = useRef(false);

  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#046A38', '#EAB308', '#0288D1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
        disableForReducedMotion: true,
      });

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

  const skippedCount = Math.max(0, result.totalQuestions - result.correctCount - result.wrongCount);

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#070D1E] pb-28 animate-fade-in font-hind">
      
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4">
        
        {/* 1. TOP DUAL ACTION BUTTONS (Back & Share) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onNavigateHome}
            className="neu-card !rounded-2xl py-3 px-3 sm:px-4 flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-xs bg-white dark:bg-[#0D172A] border border-slate-200/80 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="truncate">পরীক্ষার তালিকায় ফিরে যান</span>
          </button>

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

        {/* 2. CHORCHA STYLE RESULT CARD (MATCHING USER SCREENSHOT EXACTLY) */}
        <div className="bg-white dark:bg-[#0D172A] rounded-[32px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 text-center space-y-5">
          
          {/* Cute Mascot Illustration */}
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full flex items-center justify-center relative shadow-inner">
            <svg viewBox="0 0 200 200" className="w-28 h-28 drop-shadow-md">
              {/* Cute Red Bear Mascot Body */}
              <ellipse cx="100" cy="115" rx="55" ry="50" fill="#E53935" />
              <path d="M70 70 Q100 45 130 70 Z" fill="#C62828" />
              {/* Ears */}
              <circle cx="65" cy="75" r="14" fill="#E53935" />
              <circle cx="135" cy="75" r="14" fill="#E53935" />
              <circle cx="65" cy="75" r="7" fill="#FFCDD2" />
              <circle cx="135" cy="75" r="7" fill="#FFCDD2" />
              {/* Face Belly Patch */}
              <ellipse cx="100" cy="120" rx="38" ry="32" fill="#FFF" />
              {/* Happy Eyes */}
              <path d="M82 105 Q88 98 94 105" stroke="#263238" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M106 105 Q112 98 118 105" stroke="#263238" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Nose & Smile */}
              <circle cx="100" cy="112" r="3.5" fill="#263238" />
              <path d="M92 118 Q100 126 108 118" stroke="#263238" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Blushing Cheeks */}
              <circle cx="76" cy="112" r="6" fill="#FF8A80" opacity="0.6" />
              <circle cx="124" cy="112" r="6" fill="#FF8A80" opacity="0.6" />
              {/* Paws */}
              <circle cx="75" cy="140" r="10" fill="#C62828" />
              <circle cx="125" cy="140" r="10" fill="#C62828" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              পয়েন্ট দেখে তোমার ব্রেইন নিয়ে গবেষণা শুরু করেছি
            </h2>
            <p className="text-xs sm:text-sm font-extrabold text-[#046A38] dark:text-emerald-400">
              {isPassed ? 'অসাধারণ পারফরম্যান্স! চালিয়ে যাও' : 'চেষ্টা বজায় রাখো'}
            </p>
          </div>

          {/* 3 Top Stat Cards (Point, Marks, Time) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Card 1: Point */}
            <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden shadow-xs">
              <div className="bg-amber-400 text-slate-950 text-xs font-black py-1 px-1 text-center">
                পয়েন্ট
              </div>
              <div className="py-2.5 px-2 text-center flex items-center justify-center gap-1 text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                <span>⭐</span>
                <span>{toBengaliNumeral(Math.round(obtainedMarksVal))}</span>
              </div>
            </div>

            {/* Card 2: Marks */}
            <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden shadow-xs">
              <div className="bg-emerald-600 text-white text-xs font-black py-1 px-1 text-center">
                মার্কস
              </div>
              <div className="py-2.5 px-2 text-center flex items-center justify-center gap-1 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm">
                <span>🎯</span>
                <span>{toBengaliNumeral(result.correctCount)} / {toBengaliNumeral(result.totalQuestions)}</span>
              </div>
            </div>

            {/* Card 3: Time */}
            <div className="rounded-2xl border-2 border-sky-400/80 bg-sky-50/50 dark:bg-sky-950/20 overflow-hidden shadow-xs">
              <div className="bg-sky-500 text-white text-xs font-black py-1 px-1 text-center">
                সময়
              </div>
              <div className="py-2.5 px-2 text-center flex items-center justify-center gap-1 text-sky-900 dark:text-sky-200 font-bold text-xs truncate">
                <span>⏱️</span>
                <span className="truncate">{formattedTimeBengali}</span>
              </div>
            </div>
          </div>

          {/* Summary Pills (Correct, Wrong, Skipped) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="py-2 px-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#0D172A] flex items-center justify-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
              <span className="truncate">{toBengaliNumeral(result.correctCount)} সঠিক</span>
            </div>
            <div className="py-2 px-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#0D172A] flex items-center justify-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0"></span>
              <span className="truncate">{toBengaliNumeral(result.wrongCount)} ভুল</span>
            </div>
            <div className="py-2 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D172A] flex items-center justify-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-400 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shrink-0"></span>
              <span className="truncate">{toBengaliNumeral(skippedCount)} স্কিপ</span>
            </div>
          </div>

          {/* Bottom Action Button: এগিয়ে যান */}
          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#046A38] hover:bg-[#03542d] active:scale-95 text-white font-black text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>এগিয়ে যান</span>
            </button>
          </div>
        </div>

        {/* 3. DETAILED EXPLANATIONS & ALL QUESTIONS WITH ANSWERS */}
        <div className="space-y-4 animate-fade-in pt-2">
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

                  {/* Question Actions Footer (Explanations, etc.) */}
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
