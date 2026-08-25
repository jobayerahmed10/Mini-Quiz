import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  HelpCircle,
  CheckCircle2,
  Clock,
  Check
} from 'lucide-react';
import { Question, UserAnswer } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL, normalizeCorrectOption, formatArabicText, isArabicText, isFullyArabic } from '../lib/utils';
import { detectQuestionSubject } from '../lib/subjects';

interface PracticePageProps {
  questions: Question[];
  initialSubject?: string;
  targetQuestionCount?: number;
  timeMinutes?: number;
  onFinishQuiz: (userAnswers: UserAnswer[], timeTakenSeconds?: number) => void;
  onNavigateHome: () => void;
  showHarakat?: boolean;
}

export const PracticePage: React.FC<PracticePageProps> = ({
  questions,
  initialSubject = 'all',
  targetQuestionCount,
  timeMinutes = 30,
  onFinishQuiz,
  onNavigateHome,
  showHarakat = true,
}) => {
  const [activeSubject] = useState<string>(initialSubject);
  const [userSelections, setUserSelections] = useState<Record<string, 'option_a' | 'option_b' | 'option_c' | 'option_d'>>({});
  
  const safeTimeMinutes = Math.max(1, timeMinutes || 30);
  const initialTotalSeconds = useMemo(() => safeTimeMinutes * 60, [safeTimeMinutes]);
  const [timeLeft, setTimeLeft] = useState<number>(initialTotalSeconds);

  // Sync timer when timeMinutes changes
  useEffect(() => {
    setTimeLeft(safeTimeMinutes * 60);
  }, [safeTimeMinutes]);

  // Robust multi-tier question matching so exam never collapses to 0
  const getResolvedQuestions = (pool: Question[], subj: string, count?: number): Question[] => {
    const rawPool = pool || [];
    if (!subj || subj === 'all' || subj === 'সকল বিষয়') {
      return count && count > 0 && rawPool.length > count ? rawPool.slice(0, count) : rawPool;
    }

    // Stream-based matching for the special exam post buttons
    const sLower = subj.toLowerCase();
    let streamMatches: Question[] = [];

    if (sLower.includes('আরবি প্রভাষক') || (sLower.includes('প্রভাষক') && sLower.includes('আরবি'))) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('আরবি') || text.includes('নাহু') || text.includes('সরফ') || 
               text.includes('বালাগাত') || text.includes('সাহিত্য') || text.includes('তাফসির') || 
               text.includes('হাদিস') || text.includes('ফিকহ') || text.includes('উসুল');
      });
    } else if (sLower.includes('সহকারী মৌলভী ক্বারী') || (sLower.includes('মৌলভী') && sLower.includes('কারী'))) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('তাজবীদ') || text.includes('ক্বিরাআত') || text.includes('কুরআন') || 
               text.includes('মাখরাজ') || text.includes('সিফাত') || text.includes('হাদিস') || 
               text.includes('ফিকহ') || text.includes('আরবি');
      });
    } else if (sLower.includes('সহকারী মৌলভী')) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('কুরআন') || text.includes('তাফসির') || text.includes('হাদিস') || 
               text.includes('ফিকহ') || text.includes('আরবি') || text.includes('নাহু') || 
               text.includes('আকিদা') || text.includes('ইতিহাস');
      });
    } else if (sLower.includes('ইবতেদায়ি মৌলভী') || sLower.includes('ইবতেদায়ী মৌলভী')) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('কুরআন') || text.includes('হাদিস') || text.includes('ফিকহ') || 
               text.includes('আকিদা') || text.includes('আরবি') || text.includes('দ্বীনিয়্যাত');
      });
    } else if (sLower.includes('ইবতেদায়ি কারী') || sLower.includes('ইবতেদায়ী কারী') || sLower.includes('কারী')) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('তাজবীদ') || text.includes('ক্বিরাআত') || text.includes('কুরআন') || 
               text.includes('মাখরাজ') || text.includes('সিফাত') || text.includes('হাদিস') || 
               text.includes('ফিকহ');
      });
    } else if (sLower.includes('গ্রামার') || sLower.includes('grammar') || sLower.includes('নাহু') || sLower.includes('সরফ')) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('নাহু') || text.includes('সরফ') || text.includes('গ্রামার') || 
               text.includes('ব্যাকরণ') || text.includes('ইবরাব') || text.includes('তারকীব') || 
               text.includes('সিগাহ') || text.includes('বালাগাত');
      });
    } else if (sLower.includes('জেনারেল') || sLower.includes('সাধারণ')) {
      streamMatches = rawPool.filter((q) => {
        const text = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
        return text.includes('বাংলা') || text.includes('ইংরেজি') || text.includes('english') || 
               text.includes('গণিত') || text.includes('মানসিক') || text.includes('বাংলাদেশ') || 
               text.includes('আন্তর্জাতিক') || text.includes('আইসিটি') || text.includes('কম্পিউটার') || 
               text.includes('বিজ্ঞান');
      });
    }

    if (streamMatches.length > 0) {
      return count && count > 0 && streamMatches.length > count ? streamMatches.slice(0, count) : streamMatches;
    }

    // Tier 1: Direct subject match
    const directMatches = rawPool.filter((q) => {
      if (q.subject && (q.subject.toLowerCase().includes(subj.toLowerCase()) || subj.toLowerCase().includes(q.subject.toLowerCase()))) {
        return true;
      }
      const detected = detectQuestionSubject(q);
      return detected === subj || subj.includes(detected) || detected.includes(subj);
    });

    if (directMatches.length > 0) {
      return count && count > 0 && directMatches.length > count ? directMatches.slice(0, count) : directMatches;
    }

    // Tier 2: Keyword match
    const keywords = subj
      .replace(/[\(\)（）\[\]\-\_\,\.\/]/g, ' ')
      .split(/\s+/)
      .filter((k) => k.trim().length > 1);

    const keywordMatches = rawPool.filter((q) => {
      const combined = `${q.subject || ''} ${q.topic || ''} ${q.question || ''}`.toLowerCase();
      return keywords.some((k) => combined.includes(k.toLowerCase()));
    });

    if (keywordMatches.length > 0) {
      return count && count > 0 && keywordMatches.length > count ? keywordMatches.slice(0, count) : keywordMatches;
    }

    // Tier 3: Fallback to all questions
    return count && count > 0 && rawPool.length > count ? rawPool.slice(0, count) : rawPool;
  };

  // Lock exam questions on session mount so background Supabase updates don't wipe active exam
  const [examQuestions, setExamQuestions] = useState<Question[]>(() => {
    return getResolvedQuestions(questions, initialSubject, targetQuestionCount);
  });

  // If questions was completely empty on mount and now arrived, populate once
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current && (!examQuestions || examQuestions.length === 0) && questions && questions.length > 0) {
      isInitializedRef.current = true;
      setExamQuestions(getResolvedQuestions(questions, activeSubject, targetQuestionCount));
    }
  }, [questions, activeSubject, targetQuestionCount, examQuestions]);

  const filteredQuestions = examQuestions && examQuestions.length > 0 ? examQuestions : getResolvedQuestions(questions, activeSubject, targetQuestionCount);
  const totalQuestions = filteredQuestions.length;
  const answeredCount = Object.keys(userSelections).length;
  const unansweredCount = totalQuestions - answeredCount;

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    handleSubmitExam();
  };

  // Prevent accidental navigation without confirmation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowExitModal(true);
    };

    window.history.pushState({ page: 'practice', examInProgress: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimerBengali = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${toBengaliNumeral(formattedMins)}:${toBengaliNumeral(formattedSecs)}`;
  };

  const handleSelectOption = (questionId: string, optionKey: 'option_a' | 'option_b' | 'option_c' | 'option_d') => {
    // Lock answer: if an option is already selected for this question, do not allow changing it
    if (userSelections[questionId]) {
      return;
    }
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitExam = () => {
    // Construct UserAnswer list for all questions
    const finalAnswers: UserAnswer[] = filteredQuestions.map((q) => {
      const selectedOption = userSelections[q.id] || null;
      const correctOptionKey = normalizeCorrectOption(
        q.correct_answer,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d
      );
      const isCorrect = selectedOption === correctOptionKey;
      const currentSubjectTag = detectQuestionSubject(q);

      return {
        questionId: q.id,
        questionText: q.question,
        subject: currentSubjectTag,
        options: {
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
        },
        selectedOption: selectedOption as 'option_a' | 'option_b' | 'option_c' | 'option_d',
        correctOption: correctOptionKey,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const timeSpent = Math.max(1, initialTotalSeconds - timeLeft);
    onFinishQuiz(finalAnswers, timeSpent);
  };

  if (totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-fade-in mb-24">
        <div className="w-16 h-16 neu-card flex items-center justify-center mx-auto text-amber-400">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            কোনো প্রশ্ন পাওয়া যায়নি
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            অনুগ্রহ করে অন্য একটি বিষয় নির্বাচন করুন অথবা হোমে ফিরে নতুন টেস্ট শুরু করুন।
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-6 py-3 bg-[#0B132B] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070D1E] pb-28">
      
      {/* Top Sticky Header Bar (Exactly as Screenshot) */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          
          {/* Back Button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-[#0B132B] dark:text-amber-400">
            <Clock className="w-4 h-4 text-[#0B132B] dark:text-amber-400" />
            <span>{formatTimerBengali(timeLeft)}</span>
          </div>

          {/* Answered Ratio Counter */}
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {toBengaliNumeral(answeredCount)}/{toBengaliNumeral(totalQuestions)} উত্তর
          </div>

          {/* Top Submit Button */}
          <button
            onClick={handleOpenSubmitModal}
            className="px-4 py-2 bg-[#0B132B] hover:bg-[#162444] text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
          >
            <span>🧺</span>
            <span>জমা দিন</span>
          </button>

        </div>
      </div>

      {/* Main Scrollable Vertical List of Questions */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 space-y-5">
        {filteredQuestions.map((q, index) => {
          const selectedOpt = userSelections[q.id];
          const isQuestionRtl = isFullyArabic(q.question);

          return (
            <div
              key={q.id}
              className={`bg-white dark:bg-[#0D172A] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-md border-y border-r border-slate-200 dark:border-slate-800 space-y-5 transition-all ${
                isQuestionRtl ? 'border-r-4 border-r-[#0B132B] border-l-0' : 'border-l-4 border-l-[#0B132B]'
              }`}
            >
              {/* Question Header (Number Badge + Question Text) */}
              <div
                dir={isQuestionRtl ? 'rtl' : 'ltr'}
                className={`flex items-start gap-3 ${isQuestionRtl ? 'text-right' : 'text-left'}`}
              >
                {/* Question Number Badge (Navy Blue) */}
                <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  {toBengaliNumeral(index + 1)}
                </div>

                {/* Question Text */}
                <h3 className={`text-base sm:text-lg font-black text-[#0B132B] dark:text-white leading-relaxed pt-0.5 flex-1 ${
                  isQuestionRtl ? 'font-arabic text-right' : 'text-left'
                }`}>
                  {formatArabicText(q.question, showHarakat)}
                </h3>
              </div>

              {/* Options List (ক, খ, গ, ঘ) */}
              {(() => {
                const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'] as const;
                const arabicOptionCount = optionKeys.filter((k) => isFullyArabic(q[k])).length;
                const areOptionsRtl = arabicOptionCount >= 3;

                return (
                  <div className="space-y-3 pt-1">
                    {optionKeys.map((optionKey) => {
                      const rawOptionText = q[optionKey];
                      const optionText = formatArabicText(rawOptionText, showHarakat);
                      const prefixLabel = OPTION_BENGLI_LABEL[optionKey];
                      const isSelected = selectedOpt === optionKey;
                      const isThisOptArabic = isFullyArabic(rawOptionText);
                      const isQuestionAnswered = Boolean(selectedOpt);

                      return (
                        <button
                          key={optionKey}
                          type="button"
                          disabled={isQuestionAnswered}
                          onClick={() => handleSelectOption(q.id, optionKey)}
                          dir={areOptionsRtl ? 'rtl' : 'ltr'}
                          className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isQuestionAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            areOptionsRtl ? 'text-right' : 'text-left'
                          } ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-slate-800/80 border-2 border-[#0B132B] text-[#0B132B] dark:text-white font-bold shadow-xs'
                              : isQuestionAnswered
                              ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60'
                              : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Option Letter Box */}
                            <div
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#0B132B] text-white'
                                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              ) : (
                                prefixLabel
                              )}
                            </div>

                            {/* Option Text */}
                            <span className={`font-bold text-xs sm:text-sm leading-relaxed ${
                              isThisOptArabic ? 'font-arabic' : ''
                            } ${areOptionsRtl ? 'text-right' : 'text-left'}`}>
                              {optionText}
                            </span>
                          </div>

                          {/* Right Selected Check Indicator */}
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-[#0B132B] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })}

        {/* Bottom Finish/Submit Card */}
        <div className="bg-white dark:bg-[#0D172A] rounded-[28px] p-6 sm:p-8 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-[#0B132B] dark:text-white">
              সকল প্রশ্নের উত্তর শেষ হয়েছে?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
              পরীক্ষা জমা দিলে আপনার অর্জিত ফলাফল ও বিস্তারিত বিশ্লেষণ মেধা তালিকায় যুক্ত হবে।
            </p>
          </div>

          <button
            onClick={handleOpenSubmitModal}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0B132B] hover:bg-[#162444] text-white font-black text-sm rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <span>🧺</span>
            <span>পরীক্ষা সাবমিট করুন</span>
          </button>
        </div>

      </div>

      {/* Submission Confirmation Modal (Matching Image 1) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-sm w-full p-6 text-center space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            
            {/* Top Badge Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-100/80 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
              <span className="text-3xl">🏅</span>
            </div>

            {/* Modal Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-[#0B132B] dark:text-white">
                পরীক্ষা সাবমিট করবেন?
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                সাবমিট করার পর উত্তর পরিবর্তন করা সম্ভব হবে না।
              </p>
            </div>

            {/* Unanswered count box */}
            <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
              উত্তর না দেওয়া প্রশ্ন: <span className="text-amber-600 dark:text-amber-400 font-black">{toBengaliNumeral(unansweredCount)}টি</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="py-3 px-4 rounded-2xl bg-[#0B132B] hover:bg-[#162444] text-white font-black text-xs cursor-pointer shadow-sm transition-all active:scale-95"
              >
                সাবমিট
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0D172A] rounded-[32px] max-w-sm w-full p-6 text-center space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
              <span className="text-3xl">⚠️</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-[#0B132B] dark:text-white">
                আপনি কি পরীক্ষা থেকে বের হয়ে যেতে চান?
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                এখন বের হয়ে গেলে আপনার পরীক্ষাটি বাতিল হবে এবং দেয়া উত্তরগুলো সংরক্ষিত হবে না।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="py-3 px-4 rounded-2xl bg-[#0B132B] hover:bg-[#162444] text-white font-black text-xs cursor-pointer shadow-sm transition-all active:scale-95"
              >
                পরীক্ষায় থাকুন
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  onNavigateHome();
                }}
                className="py-3 px-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-black text-xs hover:bg-red-100 cursor-pointer transition-all active:scale-95"
              >
                বের হয়ে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
