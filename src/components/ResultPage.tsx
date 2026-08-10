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
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetry,
  onNavigateHome,
  onOpenLeaderboard,
  showHarakat = true,
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'explanation'>('summary');
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [activeAiModal, setActiveAiModal] = useState<UserAnswer | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

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
            {/* Main Forest Green Card (Exact match to Image 2) */}
            <div className="bg-[#0B5D43] text-white rounded-[32px] p-6 sm:p-8 text-center space-y-6 relative overflow-hidden shadow-xl border border-emerald-800">
              
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
                <p className="text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed font-semibold">
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
                    stroke="#074733"
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
                  <span className="text-[11px] font-bold text-emerald-100/90 tracking-wide">
                    স্কোর শতাংশ
                  </span>
                </div>
              </div>

              {/* Action Buttons Inside Dark Green Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setViewMode('explanation')}
                  className="py-3.5 px-5 bg-[#074733] hover:bg-[#053526] text-white font-extrabold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 border border-emerald-600/30 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-300" />
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
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
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
                  ০ মি. ২০ সে.
                </span>
              </div>
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
                <HelpCircle className="w-5 h-5 text-emerald-600" />
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
                  className="bg-white dark:bg-[#0D172A] rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4"
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Bengali Question Number Badge (Navy Blue Circle) */}
                    <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs border border-slate-700/40">
                      {toBengaliNumeral(index + 1)}
                    </div>

                    {/* Status Badge */}
                    {!isAnswered ? (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full font-bold text-[11px] border border-slate-200 dark:border-slate-700">
                        ⚪ অনুত্তরিত
                      </span>
                    ) : isCorrect ? (
                      <span className="px-3 py-1 bg-[#0B132B] text-amber-300 dark:bg-[#0B132B] dark:text-amber-300 rounded-full font-black text-[11px] border border-amber-400/40 flex items-center gap-1 shadow-xs">
                        <span>✓</span>
                        <span>সঠিক হয়েছে</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 rounded-full font-black text-[11px] border border-red-300 dark:border-red-800 flex items-center gap-1 shadow-xs">
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
                          className={`text-base font-black text-[#0B132B] dark:text-white leading-relaxed ${
                            isQuestionRtl ? 'text-right font-arabic' : 'text-left'
                          }`}
                        >
                          {formatArabicText(answer.questionText, showHarakat)}
                        </h3>

                        {/* Options List */}
                        <div className="space-y-2.5 pt-1">
                          {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optionKey) => {
                            const rawOptionText = answer.options[optionKey];
                            const optionText = formatArabicText(rawOptionText, showHarakat);
                            const prefixLabel = OPTION_BENGLI_LABEL[optionKey];

                            const isOptionCorrect = optionKey === answer.correctOption;
                            const isOptionSelected = optionKey === answer.selectedOption;
                            const isOptRtl = isFullyArabic(rawOptionText);

                            let styleClasses = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
                            let letterBg = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
                            let rightBadge = null;

                            if (isOptionCorrect) {
                              // Correct Answer Option -> NAVY BLUE
                              styleClasses = 'bg-[#0B132B]/10 dark:bg-[#0B132B]/80 border-2 border-[#0B132B] dark:border-amber-400 text-[#0B132B] dark:text-amber-100 font-extrabold shadow-xs';
                              letterBg = 'bg-[#0B132B] text-amber-300 dark:bg-amber-400 dark:text-[#0B132B]';
                              rightBadge = (
                                <span className="px-2.5 py-0.5 bg-[#0B132B] text-amber-300 dark:bg-amber-400 dark:text-[#0B132B] rounded-md font-extrabold text-[10px] shrink-0 shadow-xs">
                                  ✓ সঠিক উত্তর
                                </span>
                              );
                            } else if (isOptionSelected && !isCorrect) {
                              // Wrong Answer Option -> RED
                              styleClasses = 'bg-red-50 dark:bg-red-950/50 border-2 border-red-500 text-red-950 dark:text-red-100 font-bold shadow-xs';
                              letterBg = 'bg-red-600 text-white';
                              rightBadge = (
                                <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-md font-extrabold text-[10px] shrink-0 shadow-xs">
                                  ✕ আপনার ভুল উত্তর
                                </span>
                              );
                            }

                            return (
                              <div
                                key={optionKey}
                                dir={isOptRtl ? 'rtl' : 'ltr'}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
                                  isOptRtl ? 'text-right' : 'text-left'
                                } ${styleClasses}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${letterBg}`}>
                                    {prefixLabel}
                                  </div>
                                  <span className={`font-bold leading-relaxed ${isOptRtl ? 'font-arabic text-right' : 'text-left'}`}>
                                    {optionText}
                                  </span>
                                </div>
                                {rightBadge}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                  {/* Detailed Explanation Container */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-black text-xs">
                      <span>📄</span>
                      <span>বিস্তারিত ব্যাখ্যা</span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {answer.explanation
                        ? formatArabicText(answer.explanation, showHarakat)
                        : 'এই প্রশ্নের বিস্তারিত ব্যাখ্যা প্রস্তুত করা হচ্ছে।'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-slate-700/80 text-[11px]">
                      <span className="text-amber-800/80 dark:text-amber-400/80 font-bold">
                        সহীহ ম্যানুয়াল ব্যাখ্যা
                      </span>

                      <button
                        onClick={() => handleCopyExplanation(answer)}
                        className="px-3 py-1 bg-amber-200/70 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-black rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedQuestionId === answer.questionId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bottom AI Tutor Bar */}
                  <div className="bg-[#0B5D43] text-white rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold min-w-0">
                      <Sparkles className="w-4 h-4 text-[#FFC107] shrink-0" />
                      <span className="truncate">তামরীন AI দিয়ে আরও বিস্তৃত ব্যাখ্যা জানুন</span>
                    </div>

                    <button
                      onClick={() => setActiveAiModal(answer)}
                      className="px-3.5 py-1.5 bg-[#FFC107] hover:bg-[#e0a800] text-[#0B132B] font-black text-xs rounded-xl cursor-pointer shrink-0 transition-all active:scale-95 shadow-xs"
                    >
                      AI TUTOR
                    </button>
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

      {/* AI Tutor Explanation Modal */}
      {activeAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setActiveAiModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[#0B5D43] dark:text-amber-400 font-black text-lg">
              <Sparkles className="w-5 h-5 text-[#FFC107]" />
              <h3>তামরীন AI টিউটর বিশ্লেষণ</h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              প্রশ্ন: {activeAiModal.questionText}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
              <p className="font-extrabold text-[#0B5D43] dark:text-emerald-300">
                💡 এআই শিক্ষকের পরামর্শ ও গভীর সমাধান:
              </p>
              <p>
                {activeAiModal.explanation || 'এই প্রশ্নটি পরীক্ষা প্রস্তুতির জন্য অত্যন্ত গুরুত্বপূর্ণ। উত্তরটি মনে রাখতে মূল বিষয়বস্তু বারবার রিভিশন করুন।'}
              </p>
            </div>

            <button
              onClick={() => setActiveAiModal(null)}
              className="w-full py-3 bg-[#0B5D43] text-white font-black text-xs rounded-2xl cursor-pointer hover:bg-[#084733] transition-all"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserScore={result.score}
        totalQuestions={result.totalQuestions}
        correctCount={result.correctCount}
        wrongCount={result.wrongCount}
      />

    </div>
  );
};
