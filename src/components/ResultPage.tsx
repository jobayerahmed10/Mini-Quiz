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
  CheckCircle2
} from 'lucide-react';
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
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
      
      {/* Top Trophy Banner */}
      <div className="text-center space-y-4 bg-white p-8 sm:p-10 rounded-[36px] border border-[#E6E2D3] shadow-md relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 text-[#2D4B3E] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-8 h-8 text-emerald-700" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-[#8AA682] uppercase tracking-wider">
            {result.selectedSubject && result.selectedSubject !== 'all' ? `${result.selectedSubject} ` : ''}মডেল টেস্ট
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2D4B3E]">
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
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E2D3] text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-[#8AA682] uppercase tracking-wider block">
            মোট প্রশ্ন
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#2D4B3E]">
            {toBengaliNumeral(result.totalQuestions)}টি
          </span>
        </div>

        {/* Correct */}
        <div className="bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            সঠিক
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {toBengaliNumeral(result.correctCount)}টি
          </span>
        </div>

        {/* Wrong */}
        <div className="bg-rose-50/80 p-4 sm:p-5 rounded-2xl border border-rose-200 text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            ভুল
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-900">
            {toBengaliNumeral(result.wrongCount)}টি
          </span>
        </div>

        {/* Score Percentage */}
        <div className="bg-[#2D4B3E] text-white p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-xs">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
            প্রাপ্ত নম্বর
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {toBengaliNumeral(result.percentage)}%
          </span>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      {subjectBreakdown.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#E6E2D3] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 text-[#2D4B3E] font-extrabold text-lg sm:text-xl">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2>বিষয় ভিত্তিক ফলাফল বিশ্লেষণ</h2>
          </div>

          <div className="space-y-4">
            {subjectBreakdown.map((item, idx) => (
              <div key={idx} className="p-4 bg-[#F5F2EA]/60 rounded-2xl border border-[#E6E2D3] space-y-2">
                <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-[#2D4B3E]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>{item.subject}</span>
                  </div>
                  <span>
                    {toBengaliNumeral(item.correct)} / {toBengaliNumeral(item.total)} সঠিক ({toBengaliNumeral(item.percentage)}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#E6E2D3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
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
          className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#2D4B3E] hover:bg-[#1E332A] text-white font-bold text-base rounded-2xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>পুনরায় পরীক্ষা দিন</span>
        </button>

        <button
          onClick={onNavigateHome}
          className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-[#F5F2EA] text-[#2D4B3E] font-bold text-base rounded-2xl border border-[#E6E2D3] cursor-pointer transition-all active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
          <span>অন্যান্য বিষয় বেছে নিন</span>
        </button>
      </div>

      {/* Review Answer Sheet Section */}
      <div className="bg-white rounded-[32px] border border-[#E6E2D3] overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 bg-[#F5F2EA] border-b border-[#E6E2D3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => setShowAnswerSheet((prev) => !prev)}
            className="flex items-center gap-2 font-bold text-[#2D4B3E] text-base cursor-pointer text-left"
          >
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <span>উত্তরপত্রের বিস্তারিত পর্যালোচনা ({toBengaliNumeral(result.userAnswers.length)}টি প্রশ্ন)</span>
            {showAnswerSheet ? (
              <ChevronUp className="w-5 h-5 text-[#2D4B3E] ml-1" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#2D4B3E] ml-1" />
            )}
          </button>

          {/* Filter Status Buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6E2D3] self-start sm:self-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-[#2D4B3E] text-white' : 'text-[#2D4B3E]'
              }`}
            >
              সব
            </button>
            <button
              onClick={() => setFilterStatus('correct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'correct' ? 'bg-emerald-600 text-white' : 'text-emerald-700'
              }`}
            >
              সঠিক ({toBengaliNumeral(result.correctCount)})
            </button>
            <button
              onClick={() => setFilterStatus('wrong')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'wrong' ? 'bg-rose-600 text-white' : 'text-rose-700'
              }`}
            >
              ভুল ({toBengaliNumeral(result.wrongCount)})
            </button>
          </div>
        </div>

        {showAnswerSheet && (
          <div className="p-6 space-y-6 divide-y divide-[#E6E2D3]/70">
            {filteredAnswers.map((answer, idx) => {
              const isCorrect = answer.isCorrect;
              return (
                <div key={idx} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {answer.subject && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                          {answer.subject}
                        </span>
                      )}
                      <p className="font-bold text-sm sm:text-base text-[#2D4B3E] leading-relaxed">
                        {toBengaliNumeral(idx + 1)}. {answer.questionText}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
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
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-rose-50 border-rose-200 text-rose-950 font-semibold'
                      }`}
                    >
                      <span>আপনার প্রদত্ত উত্তর: </span>
                      <strong className="font-bold">
                        {answer.selectedOption
                          ? `${OPTION_BENGLI_LABEL[answer.selectedOption]}) ${answer.options[answer.selectedOption]}`
                          : 'উত্তর দেয়া হয়নি'}
                      </strong>
                    </div>

                    {!isCorrect && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold">
                        <span>সঠিক উত্তর: </span>
                        <strong className="font-bold">
                          {OPTION_BENGLI_LABEL[answer.correctOption]}){' '}
                          {answer.options[answer.correctOption]}
                        </strong>
                      </div>
                    )}
                  </div>

                  {answer.explanation && (
                    <div className="text-xs text-[#2D4B3E] bg-[#F5F2EA] p-3.5 rounded-xl border border-[#E6E2D3] leading-relaxed">
                      <strong className="text-[#2D4B3E] font-bold">ব্যাখ্যা: </strong>
                      {answer.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAnswers.length === 0 && (
              <div className="text-center py-6 text-xs text-[#8AA682] font-semibold">
                এই ফিল্টারে কোনো উত্তর নেই।
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
