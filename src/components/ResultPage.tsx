import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Home, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { QuizResult } from '../types';
import { toBengaliNumeral, OPTION_BENGLI_LABEL, formatArabicText } from '../lib/utils';

interface ResultPageProps {
  result: QuizResult;
  onRetry: () => void;
  onNavigateHome: () => void;
  showHarakat?: boolean;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetry,
  onNavigateHome,
  showHarakat = true,
}) => {
  const [showAnswerSheet, setShowAnswerSheet] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'wrong'>('all');

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

  // Calculate subject-wise score breakdown
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { total: number; correct: number; wrong: number }> = {};
    
    result.userAnswers.forEach((ans) => {
      const subj = ans.subject || 'সাধারণ বিষয়';
      if (!map[subj]) {
        map[subj] = { total: 0, correct: 0, wrong: 0 };
      }
      map[subj].total += 1;
      if (ans.isCorrect) {
        map[subj].correct += 1;
      } else {
        map[subj].wrong += 1;
      }
    });

    return Object.entries(map).map(([subject, stats]) => ({
      subject,
      ...stats,
      percentage: Math.round((stats.correct / (stats.total || 1)) * 100),
    }));
  }, [result.userAnswers]);

  // Filtered answers for review
  const filteredAnswers = useMemo(() => {
    return result.userAnswers.filter((ans) => {
      if (filterStatus === 'correct') return ans.isCorrect;
      if (filterStatus === 'wrong') return !ans.isCorrect;
      return true;
    });
  }, [result.userAnswers, filterStatus]);

  // Feedback Title and Style based on score percentage
  let feedbackTitle = 'চমৎকার প্রস্তুতি!';
  let feedbackDesc = 'আপনার বিষয় ভিত্তিক অনুশীলন ইতিবাচক হয়েছে। নিয়মিত রিভিশন রাখুন!';
  let feedbackColor = 'bg-emerald-50 text-emerald-950 border-emerald-200';

  if (result.percentage === 100) {
    feedbackTitle = 'অসাধারণ! ১০০% সঠিক উত্তর!';
    feedbackDesc = 'সবকটি প্রশ্নের সঠিক উত্তর দিয়েছেন। আপনার বিষয় ভিত্তিক দক্ষতা সেরা পর্যায়!';
    feedbackColor = 'bg-emerald-100/80 text-emerald-950 border-emerald-300';
  } else if (result.percentage >= 80) {
    feedbackTitle = 'উৎকৃষ্ট পারফরম্যান্স!';
    feedbackDesc = 'আপনার বিষয় ভিত্তিক ধারণা অত্যন্ত ভালো। ভুল হওয়া প্রশ্নগুলো দেখে নিন।';
    feedbackColor = 'bg-emerald-50 text-emerald-950 border-emerald-200';
  } else if (result.percentage >= 50) {
    feedbackTitle = 'সন্তোষজনক পারফরম্যান্স!';
    feedbackDesc = 'আরও ভালো স্কোর করতে প্রতিটি বিষয়ের ব্যাখ্যাগুলো ভালোভাবে রিভিশন করুন।';
    feedbackColor = 'bg-teal-50 text-teal-950 border-teal-200';
  } else {
    feedbackTitle = 'আরও অনুশীলনের প্রয়োজন';
    feedbackDesc = 'হতাশ হবেন না! ভুল উত্তরগুলোর সমাধান দেখে নিয়ে পুনরায় চেষ্টা করুন।';
    feedbackColor = 'bg-amber-50 text-amber-950 border-amber-200';
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      
      {/* Top Left Navigation Back Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0B132B] dark:text-amber-400 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-slate-300 dark:border-slate-700 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>হোমে ফিরে যান</span>
        </button>
      </div>

      {/* Top Trophy Banner */}
      <div className="text-center space-y-4 neu-card p-8 sm:p-10 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-8 h-8 text-[#0B132B] dark:text-amber-400" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {result.selectedSubject && result.selectedSubject !== 'all' ? `${result.selectedSubject} ` : ''}মডেল টেস্ট
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] dark:text-white">
            পরীক্ষার ফলাফল
          </h1>
        </div>

        <div className={`p-4 rounded-2xl border max-w-lg mx-auto space-y-1 ${feedbackColor}`}>
          <p className="font-bold text-lg">{feedbackTitle}</p>
          <p className="text-xs sm:text-sm opacity-90">{feedbackDesc}</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="neu-card p-4 sm:p-5 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            মোট প্রশ্ন
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] dark:text-white">
            {toBengaliNumeral(result.totalQuestions)}টি
          </span>
        </div>

        {/* Correct */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/60 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            সঠিক
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {toBengaliNumeral(result.correctCount)}টি
          </span>
        </div>

        {/* Wrong */}
        <div className="bg-rose-50/80 dark:bg-rose-950/60 p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            ভুল
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-rose-100">
            {toBengaliNumeral(result.wrongCount)}টি
          </span>
        </div>

        {/* Score Percentage */}
        <div className="bg-[#0B132B] text-white p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-xs border border-[#0B132B] dark:border-amber-500/40">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            প্রাপ্ত নম্বর
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {toBengaliNumeral(result.percentage)}%
          </span>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      {subjectBreakdown.length > 0 && (
        <div className="neu-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 text-[#0B132B] dark:text-white font-extrabold text-lg sm:text-xl">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2>বিষয় ভিত্তিক ফলাফল বিশ্লেষণ</h2>
          </div>

          <div className="space-y-4">
            {subjectBreakdown.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-[#0B132B] dark:text-white">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>{item.subject}</span>
                  </div>
                  <span>
                    {toBengaliNumeral(item.correct)} / {toBengaliNumeral(item.total)} সঠিক ({toBengaliNumeral(item.percentage)}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onRetry}
          className="neu-btn w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#0B132B] text-amber-400 font-bold text-base rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>পুনরায় পরীক্ষা দিন</span>
        </button>

        <button
          onClick={onNavigateHome}
          className="neu-btn w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 text-[#0B132B] dark:text-white font-bold text-base rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
          <span>অন্যান্য বিষয় বেছে নিন</span>
        </button>
      </div>

      {/* Review Answer Sheet Section */}
      <div className="neu-card overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => setShowAnswerSheet((prev) => !prev)}
            className="flex items-center gap-2 font-bold text-[#0B132B] dark:text-white text-base cursor-pointer text-left"
          >
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <span>উত্তরপত্রের বিস্তারিত পর্যালোচনা ({toBengaliNumeral(result.userAnswers.length)}টি প্রশ্ন)</span>
            {showAnswerSheet ? (
              <ChevronUp className="w-5 h-5 text-[#0B132B] dark:text-white ml-1" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#0B132B] dark:text-white ml-1" />
            )}
          </button>

          {/* Filter Status Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-[#0B132B] text-amber-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              সব
            </button>
            <button
              onClick={() => setFilterStatus('correct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'correct' ? 'bg-emerald-600 text-white' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              সঠিক ({toBengaliNumeral(result.correctCount)})
            </button>
            <button
              onClick={() => setFilterStatus('wrong')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'wrong' ? 'bg-rose-600 text-white' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              ভুল ({toBengaliNumeral(result.wrongCount)})
            </button>
          </div>
        </div>

        {showAnswerSheet && (
          <div className="p-6 space-y-6 divide-y divide-slate-200 dark:divide-slate-800">
            {filteredAnswers.map((answer, idx) => {
              const isCorrect = answer.isCorrect;
              return (
                <div key={idx} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {answer.subject && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-200 dark:border-slate-700 rounded-md">
                          {answer.subject}
                        </span>
                      )}
                      <p className="font-bold text-sm sm:text-base text-[#0B132B] dark:text-white leading-relaxed">
                        {toBengaliNumeral(idx + 1)}. {formatArabicText(answer.questionText, showHarakat)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>সঠিক</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>ভুল</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                    <div
                      className={`p-3 rounded-xl border ${
                        answer.selectedOption === answer.correctOption
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-semibold'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100 font-semibold'
                      }`}
                    >
                      <span>আপনার প্রদত্ত উত্তর: </span>
                      <strong className="font-bold">
                        {answer.selectedOption
                          ? `${OPTION_BENGLI_LABEL[answer.selectedOption]}) ${formatArabicText(answer.options[answer.selectedOption], showHarakat)}`
                          : 'উত্তর দেয়া হয়নি'}
                      </strong>
                    </div>

                    {!isCorrect && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-semibold">
                        <span>সঠিক উত্তর: </span>
                        <strong className="font-bold">
                          {OPTION_BENGLI_LABEL[answer.correctOption]}){' '}
                          {formatArabicText(answer.options[answer.correctOption], showHarakat)}
                        </strong>
                      </div>
                    )}
                  </div>

                  {answer.explanation && (
                    <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                      <strong className="text-[#0B132B] dark:text-amber-400 font-bold">ব্যাখ্যা: </strong>
                      {formatArabicText(answer.explanation, showHarakat)}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAnswers.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                এই ফিল্টারে কোনো উত্তর নেই।
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
