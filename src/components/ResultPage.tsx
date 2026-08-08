import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, CheckCircle, XCircle, Award, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { QuizResult } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL } from '../lib/utils';

interface ResultPageProps {
  result: QuizResult;
  onRetry: () => void;
  onNavigateHome: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetry,
  onNavigateHome,
}) => {
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);

  useEffect(() => {
    // Trigger celebratory confetti if percentage >= 50%
    if (result.percentage >= 50) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#14b8a6', '#0284c7', '#f59e0b'],
      });
    }
  }, [result.percentage]);

  // Determine feedback badge text & color based on score
  let feedbackTitle = 'চমৎকার প্রস্তুতি!';
  let feedbackDesc = 'আপনি দারুণ ফলাফল করেছেন। অনুশীলন চালিয়ে যান!';
  let feedbackColor = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3]';

  if (result.percentage === 100) {
    feedbackTitle = 'অসাধারণ! সব উত্তর সঠিক!';
    feedbackDesc = 'অভিনন্দন! আপনি ১০০% নম্বর পেয়েছেন।';
    feedbackColor = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#8AA682]';
  } else if (result.percentage >= 80) {
    feedbackTitle = 'অনেক ভালো ফলাফল!';
    feedbackDesc = 'আপনার প্রস্তুতি বেশ শক্ত। আরেকটু নিখুঁত করুন।';
    feedbackColor = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3]';
  } else if (result.percentage >= 50) {
    feedbackTitle = 'সন্তোষজনক!';
    feedbackDesc = 'আরও কিছু প্রশ্ন অনুশীলন করলে স্কোর আরও ভালো হবে।';
    feedbackColor = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3]';
  } else {
    feedbackTitle = 'আরও অনুশীলনের প্রয়োজন';
    feedbackDesc = 'হতাশ হবেন না! আবার চেষ্টা করুন এবং ব্যাখ্যাগুলো মনোযোগ দিয়ে পড়ুন।';
    feedbackColor = 'bg-amber-50 text-amber-900 border-amber-200';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Top Banner & Celebration Title */}
      <div className="text-center space-y-4 bg-white p-8 sm:p-10 rounded-[32px] border border-[#E6E2D3] shadow-xs relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F2EA] text-[#2D4B3E] border border-[#E6E2D3] flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-8 h-8 text-[#8AA682]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2D4B3E]">
          পরীক্ষা সম্পন্ন!
        </h1>

        <div className={`p-4 rounded-2xl border max-w-md mx-auto space-y-1 ${feedbackColor}`}>
          <p className="font-bold text-lg">{feedbackTitle}</p>
          <p className="text-xs sm:text-sm opacity-90">{feedbackDesc}</p>
        </div>
      </div>

      {/* Grid of 5 Main Stats as requested by Prompt */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Stat 1: মোট প্রশ্ন */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E6E2D3] shadow-xs text-center space-y-1">
          <span className="text-xs font-bold text-[#8AA682] uppercase tracking-wider block">
            মোট প্রশ্ন
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
            {toBengaliNumeral(result.totalQuestions)}
          </span>
        </div>

        {/* Stat 2: সঠিক উত্তর */}
        <div className="bg-[#F5F2EA] p-5 rounded-[24px] border border-[#E6E2D3] shadow-xs text-center space-y-1">
          <span className="text-xs font-bold text-[#2D4B3E] uppercase tracking-wider block flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#8AA682]" />
            সঠিক উত্তর
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
            {toBengaliNumeral(result.correctCount)}
          </span>
        </div>

        {/* Stat 3: ভুল উত্তর */}
        <div className="bg-rose-50/80 p-5 rounded-[24px] border border-rose-200 shadow-xs text-center space-y-1">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            ভুল উত্তর
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 bengali-num">
            {toBengaliNumeral(result.wrongCount)}
          </span>
        </div>

        {/* Stat 4: প্রাপ্ত নম্বর */}
        <div className="bg-white p-5 rounded-[24px] border border-[#E6E2D3] shadow-xs text-center space-y-1">
          <span className="text-xs font-bold text-[#8AA682] uppercase tracking-wider block flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#8AA682]" />
            প্রাপ্ত নম্বর
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E] bengali-num">
            {toBengaliNumeral(result.score)}
          </span>
        </div>

        {/* Stat 5: শতকরা */}
        <div className="col-span-2 sm:col-span-2 bg-[#2D4B3E] text-white p-5 rounded-[24px] shadow-xs text-center space-y-1 flex items-center justify-around">
          <div>
            <span className="text-xs font-bold text-[#8AA682] uppercase tracking-wider block">
              শতকরা নম্বর
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold bengali-num text-white">
              {toBengaliNumeral(result.percentage)}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#8AA682] flex items-center justify-center text-xs font-bold bengali-num text-white">
            {toBengaliNumeral(result.percentage)}%
          </div>
        </div>
      </div>

      {/* Action Buttons: "আবার চেষ্টা করুন" & "হোমে ফিরে যান" */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#2D4B3E] hover:bg-[#233B31] text-white font-bold text-base rounded-full shadow-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>আবার চেষ্টা করুন</span>
        </button>

        <button
          onClick={onNavigateHome}
          className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#F5F2EA] hover:bg-[#E6E2D3] text-[#2D4B3E] font-bold text-base rounded-full border border-[#E6E2D3] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>হোমে ফিরে যান</span>
        </button>
      </div>

      {/* Accordion / Review Answer Sheet */}
      <div className="bg-white rounded-[32px] border border-[#E6E2D3] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowAnswerSheet((prev) => !prev)}
          className="w-full px-6 py-5 bg-[#F5F2EA] hover:bg-[#E6E2D3]/60 flex items-center justify-between text-left transition-colors border-b border-[#E6E2D3] cursor-pointer"
        >
          <div className="flex items-center gap-2 font-bold text-[#2D4B3E] text-base">
            <HelpCircle className="w-5 h-5 text-[#8AA682]" />
            <span>উত্তরপত্রের বিস্তারিত পর্যালোচনা ({toBengaliNumeral(result.userAnswers.length)} টি প্রশ্ন)</span>
          </div>
          {showAnswerSheet ? (
            <ChevronUp className="w-5 h-5 text-[#2D4B3E]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#2D4B3E]" />
          )}
        </button>

        {showAnswerSheet && (
          <div className="p-6 space-y-6 divide-y divide-[#E6E2D3]">
            {result.userAnswers.map((answer, idx) => {
              const isCorrect = answer.isCorrect;
              return (
                <div key={idx} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-sm text-[#2D4B3E] leading-snug">
                      {toBengaliNumeral(idx + 1)}. {answer.questionText}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-[#F5F2EA] text-[#2D4B3E] border border-[#8AA682]'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-[#8AA682]" />
                          <span>সঠিক</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>ভুল</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                    <div
                      className={`p-3 rounded-xl border ${
                        answer.selectedOption === answer.correctOption
                          ? 'bg-[#F5F2EA] border-[#8AA682] text-[#2D4B3E]'
                          : 'bg-rose-50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span>আপনার প্রদত্ত উত্তর: </span>
                      <strong className="font-bold">
                        {answer.selectedOption
                          ? `${OPTION_BENGLI_LABEL[answer.selectedOption]}) ${answer.options[answer.selectedOption]}`
                          : 'উত্তর প্রদান করা হয়নি'}
                      </strong>
                    </div>

                    {!isCorrect && (
                      <div className="p-3 rounded-xl bg-[#F5F2EA] border border-[#8AA682] text-[#2D4B3E]">
                        <span>সঠিক উত্তর ছিল: </span>
                        <strong className="font-bold">
                          {OPTION_BENGLI_LABEL[answer.correctOption]}){' '}
                          {answer.options[answer.correctOption]}
                        </strong>
                      </div>
                    )}
                  </div>

                  {answer.explanation && (
                    <div className="text-xs text-[#2D4B3E] bg-[#F5F2EA] p-3.5 rounded-xl border border-[#E6E2D3]">
                      <strong className="text-[#2D4B3E] font-bold">ব্যাখ্যা: </strong>
                      {answer.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
