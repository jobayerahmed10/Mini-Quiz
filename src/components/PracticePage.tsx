import React, { useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, ArrowLeft, Lightbulb, Check, X } from 'lucide-react';
import { Question, SelectedOption, UserAnswer } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL, normalizeCorrectOption } from '../lib/utils';

interface PracticePageProps {
  questions: Question[];
  onFinishQuiz: (userAnswers: UserAnswer[]) => void;
  onNavigateHome: () => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({
  questions,
  onFinishQuiz,
  onNavigateHome,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-700 font-bold text-lg">কোনো প্রশ্ন পাওয়া যায়নি।</p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  // Calculate actual normalized correct option for this question
  const correctOptionKey = normalizeCorrectOption(
    currentQuestion.correct_answer,
    currentQuestion.option_a,
    currentQuestion.option_b,
    currentQuestion.option_c,
    currentQuestion.option_d
  );

  const handleSelectOption = (optionKey: 'option_a' | 'option_b' | 'option_c' | 'option_d') => {
    if (isAnswered) return; // Only allow selecting once

    setSelectedOption(optionKey);
    setIsAnswered(true);

    const isCorrect = optionKey === correctOptionKey;

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      options: {
        option_a: currentQuestion.option_a,
        option_b: currentQuestion.option_b,
        option_c: currentQuestion.option_c,
        option_d: currentQuestion.option_d,
      },
      selectedOption: optionKey,
      correctOption: correctOptionKey,
      isCorrect,
      explanation: currentQuestion.explanation,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed!
      onFinishQuiz(userAnswers);
    }
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6 animate-fade-in">
      {/* Top Bar: Progress & Exit */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#8AA682] hover:text-[#2D4B3E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোমে যান</span>
        </button>

        {/* Counter Badge */}
        <div className="px-4 py-1.5 bg-[#F5F2EA] text-[#2D4B3E] border border-[#E6E2D3] rounded-full text-xs font-bold tracking-wide bengali-num">
          প্রশ্ন {toBengaliNumeral(currentIndex + 1)} / {toBengaliNumeral(totalQuestions)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-[#E6E2D3]/60 rounded-full overflow-hidden p-0.5 border border-[#E6E2D3]">
        <div
          className="h-full bg-[#8AA682] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* MCQ Card Container */}
      <div className="bg-white rounded-[32px] border border-[#E6E2D3] shadow-xs p-6 sm:p-9 space-y-6 relative overflow-hidden">
        {/* Question Header */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-bold text-[#2D4B3E] bg-[#F5F2EA] border border-[#E6E2D3] px-3 py-1 rounded-full uppercase tracking-wider bengali-num">
            প্রশ্ন {toBengaliNumeral(currentIndex + 1)}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2D4B3E] leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optionKey) => {
            const optionText = currentQuestion[optionKey];
            const prefix = OPTION_BENGLI_LABEL[optionKey];
            const isSelected = selectedOption === optionKey;
            const isCorrectOption = optionKey === correctOptionKey;

            // Determine Option Styling State
            let containerStyles =
              'border-[#E6E2D3] hover:border-[#8AA682] hover:bg-[#F5F2EA]/60 text-[#2D4B3E]';
            let badgeStyles = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3]';
            let iconElement = null;

            if (isAnswered) {
              if (isCorrectOption) {
                containerStyles =
                  'border-[#8AA682] bg-[#F5F2EA] text-[#2D4B3E] ring-2 ring-[#8AA682]/40 font-bold';
                badgeStyles = 'bg-[#2D4B3E] text-white border-[#2D4B3E]';
                iconElement = <Check className="w-5 h-5 text-[#2D4B3E] shrink-0" />;
              } else if (isSelected) {
                containerStyles =
                  'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30';
                badgeStyles = 'bg-rose-500 text-white border-rose-500';
                iconElement = <X className="w-5 h-5 text-rose-600 shrink-0" />;
              } else {
                containerStyles = 'border-[#E6E2D3] opacity-50 text-[#2D4B3E]/50 bg-[#F5F2EA]/20';
                badgeStyles = 'bg-[#F5F2EA] text-[#2D4B3E]/40 border-[#E6E2D3]';
              }
            }

            return (
              <button
                key={optionKey}
                onClick={() => handleSelectOption(optionKey)}
                disabled={isAnswered}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.99] focus:outline-hidden ${containerStyles}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center border shrink-0 transition-colors ${badgeStyles}`}
                  >
                    {prefix}
                  </span>
                  <span className="font-semibold text-base sm:text-lg leading-relaxed break-words">
                    {optionText}
                  </span>
                </div>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Feedback Badge (Correct / Wrong) */}
        {isAnswered && (
          <div className="pt-2 animate-fade-in">
            {selectedOption === correctOptionKey ? (
              <div className="p-4 rounded-2xl bg-[#F5F2EA] border border-[#8AA682] text-[#2D4B3E] flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#2D4B3E] shrink-0" />
                <div>
                  <p className="font-bold text-base">সঠিক উত্তর!</p>
                  <p className="text-xs text-[#2D4B3E]/80">
                    আপনি সঠিক উত্তর বেছে নিয়েছেন।
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-base">ভুল উত্তর!</p>
                  <p className="text-xs text-rose-900 opacity-90">
                    সঠিক উত্তর হলো: <strong className="font-bold underline">{OPTION_BENGLI_LABEL[correctOptionKey]}) {currentQuestion[correctOptionKey]}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation Card */}
        {isAnswered && currentQuestion.explanation && (
          <div className="p-5 rounded-2xl bg-[#F5F2EA] border border-[#E6E2D3] text-[#2D4B3E] space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2D4B3E]">
              <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>ব্যাখ্যা:</span>
            </div>
            <p className="text-sm leading-relaxed font-medium text-[#2D4B3E]/90 pl-6">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action Button: Next Question */}
        {isAnswered && (
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#2D4B3E] hover:bg-[#233B31] text-white font-bold text-base rounded-full shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>{isLastQuestion ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
