import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { Question, QuizResult, UserAnswer } from '../../types';

interface MockExamInterfaceProps {
  questions: Question[];
  subjectName: string;
  timeMinutes: number;
  negativeMarkingEnabled: boolean;
  onFinishExam: (result: QuizResult) => void;
  onExit: () => void;
}

export const MockExamInterface: React.FC<MockExamInterfaceProps> = ({
  questions,
  subjectName,
  timeMinutes,
  negativeMarkingEnabled,
  onFinishExam,
  onExit,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(timeMinutes * 60);
  const [userSelections, setUserSelections] = useState<Record<number, string>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleSelectOption = (qIdx: number, optionKey: string) => {
    setUserSelections((prev) => ({
      ...prev,
      [qIdx]: optionKey,
    }));
  };

  const handleSubmitQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    let wrongCount = 0;
    const penaltyPerWrong = negativeMarkingEnabled ? 0.5 : 0;

    const constructedUserAnswers: UserAnswer[] = questions.map((q, idx) => {
      const selected = userSelections[idx] || null;
      const rawCorrect = String(q.correct_answer || 'option_a').toLowerCase().trim();

      // Normalize correct answer to option_a, option_b, option_c, option_d
      let normalizedCorrect = 'option_a';
      if (rawCorrect === 'option_b' || rawCorrect === 'b' || rawCorrect === 'খ') normalizedCorrect = 'option_b';
      else if (rawCorrect === 'option_c' || rawCorrect === 'c' || rawCorrect === 'গ') normalizedCorrect = 'option_c';
      else if (rawCorrect === 'option_d' || rawCorrect === 'd' || rawCorrect === 'ঘ') normalizedCorrect = 'option_d';

      const isCorrect = selected === normalizedCorrect;
      if (selected) {
        if (isCorrect) correctCount++;
        else wrongCount++;
      }

      return {
        questionId: q.id,
        questionText: q.question,
        subject: q.subject || subjectName,
        options: {
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
        },
        selectedOption: selected as any,
        correctOption: normalizedCorrect as any,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const rawScore = correctCount * 1 - wrongCount * penaltyPerWrong;
    const score = Math.max(0, parseFloat(rawScore.toFixed(2)));
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    const finalResult: QuizResult = {
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      score,
      percentage,
      userAnswers: constructedUserAnswers,
      completedAt: new Date().toISOString(),
      selectedSubject: subjectName,
      examId: 'mock-custom',
      examTitle: `মক পরীক্ষা: ${subjectName}`,
    };

    onFinishExam(finalResult);
  };

  const answeredCount = Object.keys(userSelections).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] text-slate-900 dark:text-slate-100 flex flex-col font-hind pb-28">
      {/* 1. Header (Screenshot 4) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="পরীক্ষা থেকে প্রস্থান করুন"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="text-center flex-1 pr-9">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              মক পরীক্ষা
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              সময়: {timeMinutes} মিনিট
            </p>
          </div>
        </div>

        {/* Exam instructions sub-bar */}
        <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            প্রতিটি প্রশ্নের পূর্ণমান প্রশ্নের পাশে লেখা আছে এবং {negativeMarkingEnabled ? 'ভুলপ্রতি ০.৫ মার্ক কাটা যাবে' : 'কোনো নেগেটিভ মার্কিং নেই'}
          </p>
        </div>
      </header>

      {/* 2. Questions List (Screenshot 4) */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {questions.map((q, qIdx) => {
          const selectedKey = userSelections[qIdx];

          const optionLabels = [
            { key: 'option_a', prefix: '(ক)', text: q.option_a },
            { key: 'option_b', prefix: '(খ)', text: q.option_b },
            { key: 'option_c', prefix: '(গ)', text: q.option_c },
            { key: 'option_d', prefix: '(ঘ)', text: q.option_d },
          ];

          return (
            <div
              key={q.id || qIdx}
              className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
            >
              {/* Question text + marks circle */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {qIdx + 1}. {q.question}
                </h3>
                <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  ১
                </div>
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 gap-2">
                {optionLabels.map((opt) => {
                  const isChecked = selectedKey === opt.key;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(qIdx, opt.key)}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-[#046A38] bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {/* Radio dot */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'border-[#046A38] bg-white dark:bg-slate-900'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#046A38]" />
                        )}
                      </div>

                      {/* Prefix & text */}
                      <span className="font-semibold text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">
                        {opt.prefix}
                      </span>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* 3. Floating Bottom Bar in Dark Green (Screenshot 4) */}
      <footer className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-xl mx-auto bg-[#046A38] text-white rounded-2xl shadow-xl px-4 sm:px-5 py-3 flex items-center justify-between pointer-events-auto border border-emerald-600/30">
          {/* Left: Clock icon + live timer */}
          <div className="flex items-center gap-2 font-mono font-bold text-base sm:text-lg tracking-wider">
            <Clock className="w-5 h-5 text-white/90 stroke-[2.2]" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Center: সাবমিট করুন Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-5 sm:px-6 py-2 rounded-xl bg-white text-[#046A38] font-bold text-sm sm:text-base hover:bg-slate-100 active:scale-95 shadow-xs transition-all cursor-pointer"
          >
            সাবমিট করুন
          </button>

          {/* Right: Answered Progress */}
          <div className="font-bold text-sm sm:text-base text-white/95">
            {answeredCount}/{questions.length}
          </div>
        </div>
      </footer>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              আপনি কি পরীক্ষা সাবমিট করতে চান?
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-around text-center text-sm font-bold">
              <div>
                <p className="text-xs text-slate-400 font-normal">মোট প্রশ্ন</p>
                <p className="text-base text-slate-800 dark:text-slate-200">{questions.length}</p>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">উত্তর দিয়েছেন</p>
                <p className="text-base text-emerald-700 dark:text-emerald-300">{answeredCount}</p>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-rose-500 font-normal">অনুত্তরিত</p>
                <p className="text-base text-rose-600">{unansweredCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="py-3 rounded-full bg-[#046A38] text-white font-bold hover:bg-[#03542c] shadow-md"
              >
                হ্যাঁ, সাবমিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              আপনি কি পরীক্ষা বন্ধ করতে চান?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              এখন বের হলে আপনার বর্তমান উত্তরগুলো সংরক্ষিত হবে না।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="py-3 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                পরীক্ষা চালিয়ে যান
              </button>
              <button
                type="button"
                onClick={onExit}
                className="py-3 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md"
              >
                হ্যাঁ, প্রস্থান করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
