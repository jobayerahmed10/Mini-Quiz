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
  HelpCircle,
  BookOpen,
  Sparkles
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

  const filteredQuestions = useMemo(() => {
    if (!activeSubject || activeSubject === 'all' || activeSubject === 'সকল বিষয়') return questions;
    return questions.filter((q) => {
      const subj = detectQuestionSubject(q);
      return subj === activeSubject;
    });
  }, [questions, activeSubject]);

  const totalQuestions = filteredQuestions.length;
  const currentQuestion = filteredQuestions[currentIndex];

  const handleSubjectChange = (newSubject: string) => {
    setActiveSubject(newSubject);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-fade-in mb-24">
        <div className="w-16 h-16 neu-card flex items-center justify-center mx-auto text-amber-400">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">
            {activeSubject !== 'all' ? `"${activeSubject}" বিষয়ে প্রশ্ন লোড হচ্ছে...` : 'কোনো প্রশ্ন পাওয়া যায়নি'}
          </h2>
          <p className="text-xs text-slate-300">
            অনুগ্রহ করে অন্য একটি বিষয় নির্বাচন করুন অথবা সকল বিষয় নির্বাচন করে টেস্ট শুরু করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleSubjectChange('all')}
            className="neu-btn px-5 py-2.5 text-amber-300 font-bold rounded-xl text-xs hover:text-amber-200 cursor-pointer"
          >
            সকল বিষয় বেছে নিন
          </button>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:text-white cursor-pointer"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const correctOptionKey = normalizeCorrectOption(
    currentQuestion.correct_answer,
    currentQuestion.option_a,
    currentQuestion.option_b,
    currentQuestion.option_c,
    currentQuestion.option_d
  );

  const handleSelectOption = (optionKey: 'option_a' | 'option_b' | 'option_c' | 'option_d') => {
    if (isAnswered) return;

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
      onFinishQuiz(userAnswers);
    }
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentSubjectTag = detectQuestionSubject(currentQuestion);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in mb-24">
      {/* Top Header Bar */}
      <div className="neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-amber-300 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>হোমে যান</span>
        </button>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">বিষয়:</span>
          <select
            value={activeSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="px-3 py-1.5 bg-[#0D172A] text-amber-300 font-bold text-xs rounded-xl border border-slate-700/80 focus:outline-none cursor-pointer shadow-[inset_2px_2px_4px_#060a17]"
          >
            <option value="all">সকল বিষয় (Mixed)</option>
            {SUBJECT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="px-3.5 py-1.5 bg-[#14223E] text-amber-300 border border-amber-400/30 rounded-full text-xs font-black self-start sm:self-auto">
          প্রশ্ন {toBengaliNumeral(currentIndex + 1)} / {toBengaliNumeral(totalQuestions)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#0D172A] rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-[inset_1px_1px_3px_#060a17]">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="neu-card p-6 sm:p-8 space-y-6 relative border border-slate-700/80">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentSubjectTag}</span>
          </span>

          <span className="text-xs font-black text-slate-400">
            Q.{currentIndex + 1}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((optionKey) => {
            const optionText = currentQuestion[optionKey];
            const prefix = OPTION_BENGLI_LABEL[optionKey];
            const isSelected = selectedOption === optionKey;
            const isCorrectOption = optionKey === correctOptionKey;

            let buttonStyles = 'neu-btn text-white hover:border-amber-400/80';
            let badgeStyles = 'bg-[#0D172A] text-slate-300 border-slate-700';
            let iconElement = null;

            if (isAnswered) {
              if (isCorrectOption) {
                buttonStyles = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                badgeStyles = 'bg-emerald-600 text-white border-emerald-500';
                iconElement = <Check className="w-5 h-5 text-emerald-400 shrink-0" />;
              } else if (isSelected) {
                buttonStyles = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                badgeStyles = 'bg-rose-600 text-white border-rose-500';
                iconElement = <X className="w-5 h-5 text-rose-400 shrink-0" />;
              } else {
                buttonStyles = 'opacity-40 text-slate-400 border-slate-800 bg-[#0A1224]';
                badgeStyles = 'bg-slate-900 text-slate-500 border-slate-800';
              }
            }

            return (
              <button
                key={optionKey}
                onClick={() => handleSelectOption(optionKey)}
                disabled={isAnswered}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-3.5 cursor-pointer ${buttonStyles}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center border shrink-0 ${badgeStyles}`}>
                    {prefix}
                  </span>
                  <span className="font-bold text-sm sm:text-base leading-relaxed">
                    {optionText}
                  </span>
                </div>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Feedback Alert */}
        {isAnswered && (
          <div className="pt-2 animate-fade-in">
            {selectedOption === correctOptionKey ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-emerald-100">অভিনন্দন! আপনার উত্তর সঠিক হয়েছে।</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 flex items-start gap-3">
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-rose-100">ভুল উত্তর!</p>
                  <p className="text-xs text-rose-200 mt-1">
                    সঠিক উত্তর হলো: <strong className="font-bold underline">{OPTION_BENGLI_LABEL[correctOptionKey]}) {currentQuestion[correctOptionKey]}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {isAnswered && currentQuestion.explanation && (
          <div className="p-4 rounded-2xl bg-[#0D172A] border border-slate-700/80 text-slate-200 space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>সহজ তথ্য ও ব্যাখ্যা:</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300 pl-6">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next Question Button */}
        {isAnswered && (
          <div className="pt-4 flex items-center justify-between border-t border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold">
              প্রশ্ন {currentIndex + 1} / {totalQuestions}
            </span>

            <button
              onClick={handleNextQuestion}
              className="neu-btn px-7 py-3 rounded-2xl text-amber-300 font-black text-sm flex items-center gap-2 hover:text-amber-200 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <span>{isLastQuestion ? 'ফলাফল ও বিশ্লেষণ দেখুন' : 'পরবর্তী প্রশ্ন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

