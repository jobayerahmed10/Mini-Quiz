import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft,
  X,
  Copy,
  Check,
  Trophy,
  Sparkles,
  HelpCircle,
  Award,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { QuizResult, UserAnswer } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL, formatArabicText, isArabicText, isFullyArabic } from '../lib/utils';
import { LeaderboardModal } from './LeaderboardModal';

interface ResultPageProps {
  result: QuizResult;
  onRetry: () => void;
  onNavigateHome: () => void;
  onOpenLeaderboard?: () => void;
  showHarakat?: boolean;
  initialViewMode?: 'summary' | 'explanation';
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetry,
  onNavigateHome,
  onOpenLeaderboard,
  showHarakat = true,
  initialViewMode = 'summary',
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'explanation'>(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode, result]);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Inline AI Explanation state
  const [expandedAiIds, setExpandedAiIds] = useState<string[]>([]);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoadingIds, setAiLoadingIds] = useState<string[]>([]);

  const toggleAiExplanation = async (ans: UserAnswer) => {
    const qId = ans.questionId;
    if (expandedAiIds.includes(qId)) {
      setExpandedAiIds((prev) => prev.filter((id) => id !== qId));
      return;
    }

    setExpandedAiIds((prev) => [...prev, qId]);

    if (!aiExplanations[qId]) {
      setAiLoadingIds((prev) => [...prev, qId]);
      try {
        const prompt = `প্রশ্ন: ${ans.questionText}\nবিকল্পসমূহ:\nক) ${ans.options.option_a}\nখ) ${ans.options.option_b}\nগ) ${ans.options.option_c}\nঘ) ${ans.options.option_d}\nসঠিক উত্তর: ${OPTION_BENGLI_LABEL[ans.correctOption]}\n\nএই প্রশ্নটির সঠিক উত্তর ও বিস্তারিত শিক্ষণীয় ব্যাখ্যা বাংলায় প্রদান করুন।`;
        const res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        const text = data.text || 'কোনো এআই ব্যাখ্যা পাওয়া যায়নি।';
        setAiExplanations((prev) => ({ ...prev, [qId]: text }));
      } catch (err) {
        setAiExplanations((prev) => ({
          ...prev,
          [qId]: 'এআই ব্যাখ্যা সংযোগে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।',
        }));
      } finally {
        setAiLoadingIds((prev) => prev.filter((id) => id !== qId));
      }
    }
  };

  const unansweredCount = Math.max(
    0,
    result.totalQuestions - result.userAnswers.filter((a) => a.selectedOption).length
  );

  useEffect(() => {
    // Trigger celebratory confetti if score >= 50%
    if (result.percentage >= 50) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#0B5D43', '#FFC107', '#10b981', '#059669', '#3b82f6'],
      });
    }
  }, [result.percentage]);

  const handleCopyExplanation = (ans: UserAnswer) => {
    const textToCopy = `প্রশ্ন: ${ans.questionText}\nব্যাখ্যা: ${ans.explanation || 'কোনো ব্যাখ্যা নেই'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedQuestionId(ans.questionId);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  // Feedback Heading based on percentage
  let feedbackHeading = 'আরও অনুশীলন প্রয়োজন!';
  if (result.percentage === 100) {
    feedbackHeading = 'অসাধারণ পারফরম্যান্স!';
  } else if (result.percentage >= 80) {
    feedbackHeading = 'চমৎকার প্রস্তুতি!';
  } else if (result.percentage >= 50) {
    feedbackHeading = 'সন্তোষজনক ফলাফল!';
  }

  return (
    <div className="min-h-screen bg-[#F2F5F8] dark:bg-[#070D1E] pb-20 animate-fade-in">
      
      {/* Top Header Navigation Bar (Exact match to Screenshots 2 & 3) */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back Arrow + রেজাল্ট */}
          <button
            onClick={() => {
              if (viewMode === 'explanation') {
                setViewMode('summary');
              } else {
                onNavigateHome();
              }
            }}
            className="flex items-center gap-2 text-[#0b705c] dark:text-emerald-400 font-extrabold text-sm hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>রেজাল্ট</span>
          </button>

          {/* Answer Ratio indicator: ১/১৬ উত্তর */}
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {toBengaliNumeral(result.correctCount)}/{toBengaliNumeral(result.totalQuestions)} উত্তর
          </div>

          {/* Right "বন্ধ করুন" Button */}
          <button
            onClick={onNavigateHome}
            className="px-4 py-1.5 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0B132B] dark:text-slate-200 font-black text-xs rounded-full cursor-pointer transition-all active:scale-95"
          >
            বন্ধ করুন
          </button>

        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-5">
        
        {/* SUMMARY VIEW MODE (IMAGE 2) */}
        {viewMode === 'summary' ? (
          <>
            {/* Main Navy Blue Banner Card */}
            <div className="bg-[#0B132B] text-white rounded-[32px] p-6 sm:p-8 text-center space-y-6 relative overflow-hidden shadow-xl border border-slate-800">
              
              {/* Top Banner Badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#FFC107] text-[#0B132B] font-black text-xs rounded-full shadow-xs">
                <span>✨ 🎉</span>
                <span>অভিনন্দন!</span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {feedbackHeading}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200/90 max-w-md mx-auto leading-relaxed font-semibold">
                  তামরীন একাডেমি জাতীয় মেধা তালিকায় আপনার ফলাফল সংযুক্ত হয়েছে।
                </p>
              </div>

              {/* Gauge Circular Score Meter */}
              <div className="relative w-44 h-44 mx-auto flex flex-col items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#162444"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#FFC107"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * result.percentage) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-0.5">
                  <span className="text-4xl font-black text-[#FFC107] tracking-tight">
                    {toBengaliNumeral(result.percentage)}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-200/90 tracking-wide">
                    স্কোর শতাংশ
                  </span>
                </div>
              </div>

              {/* Action Buttons Inside Navy Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setViewMode('explanation')}
                  className="py-3.5 px-5 bg-[#121E36] hover:bg-[#162444] text-white font-extrabold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-amber-300" />
                  <span>ব্যাখ্যা সহ উত্তর</span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenLeaderboard) {
                      onOpenLeaderboard();
                    } else {
                      setShowLeaderboardModal(true);
                    }
                  }}
                  className="py-3.5 px-5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Trophy className="w-4 h-4 text-[#0B132B]" />
                  <span>মেধা তালিকা</span>
                </button>
              </div>

            </div>

            {/* 4 Stat Grid Cards (White cards below) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Correct */}
              <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-5 text-center space-y-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  সঠিক
                </span>
                <span className="text-3xl font-black text-[#0B132B] dark:text-amber-400 block">
                  {toBengaliNumeral(result.correctCount)}
                </span>
              </div>

              {/* Wrong */}
              <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-5 text-center space-y-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  ভুল
                </span>
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400 block">
                  {toBengaliNumeral(result.wrongCount)}
                </span>
              </div>

              {/* Unanswered */}
              <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-5 text-center space-y-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  অনুত্তরিত
                </span>
                <span className="text-3xl font-black text-slate-800 dark:text-slate-200 block">
                  {toBengaliNumeral(unansweredCount)}
                </span>
              </div>

              {/* Time Spent */}
              <div className="bg-white dark:bg-[#0D172A] rounded-2xl p-5 text-center space-y-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  সময়
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 block pt-1">
                  ০ মি. ৪ সে.
                </span>
              </div>
            </div>

            {/* National Merit Rank Card (Matching Image 1) */}
            <div className="bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl p-4 text-center border border-amber-200/80 dark:border-amber-800/50 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block">
                জাতীয় মেধা র‍্যাংক
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 block tracking-tight">
                ১৫তম
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onRetry}
                className="flex-1 py-3.5 bg-[#0B132B] text-amber-400 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span>পুনরায় পরীক্ষা দিন</span>
              </button>
            </div>
          </>
        ) : (
          /* EXPLANATION VIEW MODE (IMAGE 3) */
          <div className="space-y-4">
            
            {/* Section Subheader */}
            <div className="flex items-center justify-between text-sm font-black text-slate-800 dark:text-slate-200 px-1 pt-1">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0B132B] dark:text-amber-400" />
                <h2>উত্তর ও বিস্তারিত ব্যাখ্যা</h2>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                মোট {toBengaliNumeral(result.totalQuestions)}টি প্রশ্ন
              </span>
            </div>

            {/* Questions List */}
            {result.userAnswers.map((answer, index) => {
              const isCorrect = answer.isCorrect;
              const isAnswered = answer.selectedOption !== null;

              return (
                <div
                  key={answer.questionId || index}
                  className={`bg-white dark:bg-[#0D172A] rounded-[28px] p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                    !isAnswered
                      ? 'border border-slate-200 dark:border-slate-800'
                      : isCorrect
                      ? 'border-2 border-[#0B132B]/30 dark:border-amber-400/50 bg-blue-50/10'
                      : 'border-2 border-rose-300/60 dark:border-rose-900/40 bg-rose-50/10'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Bengali Question Number Badge (Navy Blue Circle) */}
                    <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {toBengaliNumeral(index + 1)}
                    </div>

                    {/* Status Badge */}
                    {!isAnswered ? (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full font-bold text-xs border border-slate-200 dark:border-slate-700">
                        ⚪ অনুত্তরিত
                      </span>
                    ) : isCorrect ? (
                      <span className="px-3.5 py-1 bg-[#0B132B] text-white rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
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
                  {(() => {
                    const isQuestionRtl = isFullyArabic(answer.questionText);
                    return (
                      <>
                        <h3
                          dir={isQuestionRtl ? 'rtl' : 'ltr'}
                          className={`text-base sm:text-lg font-black text-[#0B132B] dark:text-white leading-relaxed ${
                            isQuestionRtl ? 'text-right font-arabic' : 'text-left'
                          }`}
                        >
                          {formatArabicText(answer.questionText, showHarakat)}
                        </h3>

                        {/* Options List */}
                        {(() => {
                          const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'] as const;
                          const arabicOptionCount = optionKeys.filter((k) => isFullyArabic(answer.options[k])).length;
                          const areOptionsRtl = arabicOptionCount >= 3;

                          return (
                            <div className="space-y-3 pt-1">
                              {optionKeys.map((optionKey) => {
                                const rawOptionText = answer.options[optionKey];
                                const optionText = formatArabicText(rawOptionText, showHarakat);
                                const prefixLabel = OPTION_BENGLI_LABEL[optionKey];

                                const isOptionCorrect = optionKey === answer.correctOption;
                                const isOptionSelected = optionKey === answer.selectedOption;
                                const isThisOptArabic = isFullyArabic(rawOptionText);

                                let styleClasses = 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
                                let letterBg = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
                                let rightBadge = null;

                                if (isOptionCorrect) {
                                  // Correct Answer Option -> Navy Blue
                                  styleClasses = 'bg-blue-50/80 dark:bg-slate-800/80 border-2 border-[#0B132B] text-[#0B132B] dark:text-amber-100 font-extrabold shadow-xs';
                                  letterBg = 'bg-[#0B132B] text-white';
                                  rightBadge = (
                                    <span className="px-3 py-1 bg-[#0B132B]/15 text-[#0B132B] dark:bg-amber-400/20 dark:text-amber-300 rounded-full font-extrabold text-xs shrink-0">
                                      ✓ সঠিক উত্তর
                                    </span>
                                  );
                                } else if (isOptionSelected && !isCorrect) {
                                  // Wrong Answer Option -> Red
                                  styleClasses = 'bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-950 dark:text-rose-100 font-extrabold shadow-xs';
                                  letterBg = 'bg-rose-600 text-white';
                                  rightBadge = (
                                    <span className="px-3 py-1 bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 rounded-full font-extrabold text-xs shrink-0">
                                      ✕ আপনার ভুল উত্তর
                                    </span>
                                  );
                                }

                                return (
                                  <div
                                    key={optionKey}
                                    dir={areOptionsRtl ? 'rtl' : 'ltr'}
                                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
                                      areOptionsRtl ? 'text-right' : 'text-left'
                                    } ${styleClasses}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${letterBg}`}>
                                        {prefixLabel}
                                      </div>
                                      <span className={`font-bold leading-relaxed ${
                                        isThisOptArabic ? 'font-arabic' : ''
                                      } ${areOptionsRtl ? 'text-right' : 'text-left'}`}>
                                        {optionText}
                                      </span>
                                    </div>
                                    {rightBadge}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}

                  {/* Detailed Manual Explanation Container (Only rendered if admin provided explanation) */}
                  {answer.explanation && answer.explanation.trim() !== '' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF5] dark:bg-slate-800/80 border border-amber-200/90 dark:border-slate-700/80 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-400 font-extrabold text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📄</span>
                          <span>বিস্তারিত ব্যাখ্যা</span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">▲</span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium pt-1">
                        {formatArabicText(answer.explanation, showHarakat)}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-amber-200/60 dark:border-slate-700/80 text-[11px] sm:text-xs">
                        <span className="text-amber-800/90 dark:text-amber-400/90 font-bold">
                          সহীহ ম্যানুয়াল ব্যাখ্যা
                        </span>

                        <button
                          onClick={() => handleCopyExplanation(answer)}
                          className="px-3.5 py-1.5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                        >
                          {copiedQuestionId === answer.questionId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#0B132B]" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#0B132B]" />
                              <span>কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom AI Tutor Bar & Inline Expandable Menu */}
                  <div className="space-y-2">
                    <div className="bg-[#0B132B] hover:bg-[#162444] text-white rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-2 shadow-xs transition-colors">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold min-w-0">
                        <Sparkles className="w-4 h-4 text-[#FFC107] shrink-0" />
                        <span className="truncate">তামরীন AI দিয়ে আরও বিস্তৃত ব্যাখ্যা জানুন</span>
                      </div>

                      <button
                        onClick={() => toggleAiExplanation(answer)}
                        className="px-4 py-1.5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black text-xs rounded-xl cursor-pointer shrink-0 transition-all active:scale-95 shadow-xs flex items-center gap-1"
                      >
                        <span>{expandedAiIds.includes(answer.questionId) ? 'বন্ধ করুন ▲' : 'AI TUTOR ▼'}</span>
                      </button>
                    </div>

                    {/* Inline Expandable Dropdown Menu for Tamreen AI Explanation */}
                    {expandedAiIds.includes(answer.questionId) && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] text-white border border-amber-400/30 space-y-3 shadow-md animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2 text-[#FFC107] font-extrabold text-xs sm:text-sm">
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>তামরীন AI টিউটর সমাধান</span>
                          </div>
                          <span className="text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md font-bold">
                            লাইভ জেমিনাই AI
                          </span>
                        </div>

                        {aiLoadingIds.includes(answer.questionId) ? (
                          <div className="flex items-center gap-2.5 py-4 text-amber-300 text-xs font-bold">
                            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                            <span>উস্তাদ এআই প্রশ্নটির নিখুঁত ব্যাখ্যা তৈরি করছেন...</span>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line pt-1">
                            {aiExplanations[answer.questionId] || 'কোনো ব্যাখ্যা তৈরি করা সম্ভব হয়নি।'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {/* Back to Summary Button */}
            <button
              onClick={() => setViewMode('summary')}
              className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-300 transition-all"
            >
              মূল ফলাফলে ফিরে যান
            </button>

          </div>
        )}

      </div>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserScore={result.score}
        totalQuestions={result.totalQuestions}
        correctCount={result.correctCount}
        wrongCount={result.wrongCount}
        examId={result.selectedSubject}
        examTitle={result.selectedSubject}
      />

    </div>
  );
};
