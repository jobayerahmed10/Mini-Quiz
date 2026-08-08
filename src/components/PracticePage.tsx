import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Lightbulb, 
  Check, 
  X,
  Filter,
  Layers,
  ChevronDown,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Question, SelectedOption, UserAnswer } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL, normalizeCorrectOption } from '../lib/utils';
import { SUBJECT_CATEGORIES, detectQuestionSubject } from '../lib/subjects';

interface PracticePageProps {
  questions: Question[];
  initialSubject?: string;
  onFinishQuiz: (userAnswers: UserAnswer[]) => void;
  onNavigateHome: () => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({
  questions,
  initialSubject = 'all',
  onFinishQuiz,
  onNavigateHome,
}) => {
  const [activeSubject, setActiveSubject] = useState<string>(initialSubject);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showGridNavigator, setShowGridNavigator] = useState(false);

  // Filter questions according to activeSubject
  const filteredQuestions = useMemo(() => {
    if (!activeSubject || activeSubject === 'all') return questions;
    return questions.filter((q) => {
      const subj = detectQuestionSubject(q);
      return subj === activeSubject;
    });
  }, [questions, activeSubject]);

  const totalQuestions = filteredQuestions.length;
  const currentQuestion = filteredQuestions[currentIndex];

  // When subject changes, reset index & answers
  const handleSubjectChange = (newSubject: string) => {
    setActiveSubject(newSubject);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#2D4B3E]">
            {activeSubject !== 'all' ? `"${activeSubject}" বিষয়ে কোনো প্রশ্ন পাওয়া যায়নি` : 'কোনো প্রশ্ন পাওয়া যায়নি'}
          </h2>
          <p className="text-xs text-[#8AA682]">
            অনুগ্রহ করে অন্য একটি বিষয় নির্বাচন করুন অথবা সকল বিষয় নির্বাচন করে টেস্ট শুরু করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => handleSubjectChange('all')}
            className="px-5 py-2.5 bg-[#2D4B3E] text-white font-bold rounded-xl text-xs hover:bg-[#1E332A] transition-colors cursor-pointer"
          >
            সকল বিষয় বেছে নিন
          </button>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-white text-[#2D4B3E] border border-[#E6E2D3] font-bold rounded-xl text-xs hover:bg-[#F5F2EA] transition-colors cursor-pointer"
          >
            হোমে ফিরে যান
          </button>
        </div>
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
    const currentSubject = detectQuestionSubject(currentQuestion);

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      subject: currentSubject,
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
  const currentSubjectTag = detectQuestionSubject(currentQuestion);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6E2D3] shadow-xs">
        {/* Back Link */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8AA682] hover:text-[#2D4B3E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোমে যান</span>
        </button>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#8AA682]" />
          <span className="text-xs font-bold text-[#8AA682]">বিষয়:</span>
          <select
            value={activeSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F2EA] text-[#2D4B3E] font-bold text-xs rounded-xl border border-[#E6E2D3] focus:outline-none cursor-pointer"
          >
            <option value="all">সকল বিষয় (Mixed)</option>
            {SUBJECT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Counter Pill */}
        <div className="px-3.5 py-1.5 bg-[#2D4B3E] text-white rounded-full text-xs font-bold tracking-wide self-start sm:self-auto">
          প্রশ্ন {toBengaliNumeral(currentIndex + 1)} / {toBengaliNumeral(totalQuestions)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* MCQ Main Card Container */}
      <div className="bg-white rounded-[32px] border border-[#E6E2D3] shadow-md p-6 sm:p-9 space-y-6 relative overflow-hidden">
        
        {/* Subject Badge & Topic Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D3]/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentSubjectTag}</span>
            </span>

            {currentQuestion.topic && (
              <span className="text-xs font-medium text-[#8AA682] bg-[#F5F2EA] px-2.5 py-1 rounded-full border border-[#E6E2D3]">
                টপিক: {currentQuestion.topic}
              </span>
            )}
          </div>

          <span className="text-xs font-mono font-bold text-[#8AA682]">
            Q.{currentIndex + 1}
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#2D4B3E] leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options Grid / List */}
        <div className="space-y-3 pt-2">
          {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optionKey) => {
            const optionText = currentQuestion[optionKey];
            const prefix = OPTION_BENGLI_LABEL[optionKey];
            const isSelected = selectedOption === optionKey;
            const isCorrectOption = optionKey === correctOptionKey;

            // Option Button Styling
            let containerStyles =
              'border-[#E6E2D3] hover:border-[#8AA682] hover:bg-[#F5F2EA]/70 text-[#2D4B3E]';
            let badgeStyles = 'bg-[#F5F2EA] text-[#2D4B3E] border-[#E6E2D3]';
            let iconElement = null;

            if (isAnswered) {
              if (isCorrectOption) {
                containerStyles =
                  'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30 font-bold';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-600';
                iconElement = <Check className="w-5 h-5 text-emerald-700 shrink-0" />;
              } else if (isSelected) {
                containerStyles =
                  'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30 font-medium';
                badgeStyles = 'bg-rose-500 text-white border-rose-500';
                iconElement = <X className="w-5 h-5 text-rose-600 shrink-0" />;
              } else {
                containerStyles = 'border-[#E6E2D3] opacity-45 text-[#2D4B3E]/50 bg-[#F5F2EA]/20';
                badgeStyles = 'bg-[#F5F2EA] text-[#2D4B3E]/40 border-[#E6E2D3]';
              }
            }

            return (
              <button
                key={optionKey}
                onClick={() => handleSelectOption(optionKey)}
                disabled={isAnswered}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3.5 active:scale-[0.99] focus:outline-none cursor-pointer ${containerStyles}`}
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

        {/* Feedback Alert Box */}
        {isAnswered && (
          <div className="pt-2 animate-fade-in">
            {selectedOption === correctOptionKey ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-base text-emerald-900">অভিনন্দন! আপনার উত্তর সঠিক হয়েছে।</p>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    পরবর্তী প্রশ্ন অনুশীলনের জন্য নিচে বাটনে ক্লিক করুন।
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base text-rose-900">ভুল উত্তর!</p>
                  <p className="text-xs text-rose-900 mt-1">
                    সঠিক উত্তর হলো: <strong className="font-bold underline">{OPTION_BENGLI_LABEL[correctOptionKey]}) {currentQuestion[correctOptionKey]}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rich Explanation Box */}
        {isAnswered && currentQuestion.explanation && (
          <div className="p-5 rounded-2xl bg-[#F5F2EA] border border-[#E6E2D3] text-[#2D4B3E] space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2D4B3E]">
              <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>সহজ তথ্য ও ব্যাখ্যা:</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-[#2D4B3E]/90 pl-6">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action Controls */}
        {isAnswered && (
          <div className="pt-4 flex items-center justify-between border-t border-[#E6E2D3]/60">
            <span className="text-xs text-[#8AA682] font-semibold">
              প্রশ্ন {currentIndex + 1} / {totalQuestions} সম্পন্ন
            </span>

            <button
              onClick={handleNextQuestion}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#2D4B3E] hover:bg-[#1E332A] text-white font-bold text-base rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>{isLastQuestion ? 'ফলাফল ও পারফরম্যান্স দেখুন' : 'পরবর্তী প্রশ্ন'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
