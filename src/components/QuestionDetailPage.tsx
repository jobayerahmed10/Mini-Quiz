import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Copy, Check, BookOpen, HelpCircle, Sparkles, Zap, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Question } from '../types';
import { fetchQuestionBySlugOrId } from '../lib/supabase';
import { QuestionActionFooter } from './QuestionActionFooter';

interface QuestionDetailPageProps {
  slugOrId: string;
  onNavigateHome: () => void;
  onStartPractice: (subject?: string, topic?: string) => void;
  showHarakat?: boolean;
}

export const QuestionDetailPage: React.FC<QuestionDetailPageProps> = ({
  slugOrId,
  onNavigateHome,
  onStartPractice,
  showHarakat = true,
}) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchQuestionBySlugOrId(slugOrId).then((q) => {
      if (!isMounted) return;
      setQuestion(q);
      setIsLoading(false);

      if (q) {
        // Dynamic Meta Header update
        const pageTitle = `${q.question} | ${q.subject || 'পরীক্ষা'} | আত-তামরীন একাডেমি`;
        document.title = pageTitle;

        // Dynamic Google QAPage Schema (JSON-LD)
        const correctKey = (q.correct_answer || 'option_a') as 'option_a' | 'option_b' | 'option_c' | 'option_d';
        const correctAnswerText = q[correctKey] || q.option_a;
        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "QAPage",
          "mainEntity": {
            "@type": "Question",
            "name": q.question,
            "text": q.question,
            "answerCount": 1,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": correctAnswerText,
              "explanation": q.explanation || 'আত-তামরীন একাডেমি বিস্তারিত ব্যাখ্যা।'
            }
          }
        };

        let scriptTag = document.getElementById('jsonld-qapage-schema');
        if (!scriptTag) {
          scriptTag = document.createElement('script');
          scriptTag.id = 'jsonld-qapage-schema';
          scriptTag.setAttribute('type', 'application/ld+json');
          document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(schemaObj);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slugOrId]);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/q/${slugOrId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = () => {
    const fullUrl = `${window.location.origin}/q/${slugOrId}`;
    if (navigator.share) {
      navigator.share({
        title: question?.question || 'প্রশ্ন দেখুন',
        text: `${question?.question}\n\nসঠিক উত্তর ও ব্যাখ্যা দেখুন আত-তামরীন একাডেমিতে:`,
        url: fullUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 font-hind">
          প্রশ্নটি লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
        </p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-5 font-hind">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          নির্দিষ্ট প্রশ্নটি খুঁজে পাওয়া যায়নি!
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
          লিংকটি ভুল হতে পারে অথবা প্রশ্নটি ডাটাবেস থেকে সরিয়ে ফেলা হয়েছে।
        </p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 rounded-full bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </button>
      </div>
    );
  }

  const optionsMap = [
    { key: 'option_a', label: 'ক', text: question.option_a },
    { key: 'option_b', label: 'খ', text: question.option_b },
    { key: 'option_c', label: 'গ', text: question.option_c },
    { key: 'option_d', label: 'ঘ', text: question.option_d },
  ];

  const correctKey = (question.correct_answer || 'option_a') as string;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-5 space-y-6 font-hind animate-fade-in mb-24">
      {/* Top Header Row with Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onNavigateHome}
          className="px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল প্রশ্ন</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[#0b705c] dark:text-emerald-400 text-xs font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="লিংক কপি করুন"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="শেয়ার করুন"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">শেয়ার</span>
          </button>
        </div>
      </div>

      {/* Primary Question Card */}
      <div className="neu-card !rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
        {/* Badges line */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="bg-[#0b705c] text-white font-extrabold px-3 py-1 rounded-full shadow-2xs">
            {question.subject || 'সাধারণ বিষয়'}
          </span>
          {question.topic && (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-200/80 dark:border-amber-800/60">
              {question.topic}
            </span>
          )}
          <span className="text-slate-400 ml-auto text-[11px] font-semibold">
            আইডি: #{question.id}
          </span>
        </div>

        {/* Question Heading */}
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed font-hind">
            {question.question}
          </h1>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {optionsMap.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isCorrect = opt.key === correctKey;
            const isRevealed = showExplanation || selectedOption !== null;

            let cardStyle = 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200';
            
            if (isRevealed) {
              if (isCorrect) {
                cardStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/40';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/40';
              }
            }

            return (
              <button
                key={opt.key}
                onClick={() => {
                  setSelectedOption(opt.key);
                  setShowExplanation(true);
                }}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${cardStyle}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs ${
                  isRevealed && isCorrect 
                    ? 'bg-emerald-600 text-white' 
                    : isRevealed && isSelected && !isCorrect 
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {opt.label}
                </div>

                <div className="flex-1 font-bold text-sm sm:text-base leading-snug pt-0.5">
                  {opt.text}
                </div>

                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Toggle Button */}
        {!showExplanation && selectedOption === null && (
          <button
            onClick={() => setShowExplanation(true)}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>সঠিক উত্তর ও ব্যাখ্যা দেখুন</span>
          </button>
        )}

        {/* Full Interactive Action Footer (Likes, Bookmarks, Reports, Explanations) */}
        <QuestionActionFooter
          question={question}
          defaultExpanded={showExplanation}
        />
      </div>

      {/* Action Footer Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onStartPractice(question.subject || 'সকল বিষয়', question.topic || undefined)}
          className="p-4 rounded-2xl bg-[#0b705c] hover:bg-[#085a4a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
        >
          <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span>এই বিষয়ে আরও প্রশ্ন অনুশীলন করুন</span>
        </button>

        <button
          onClick={onNavigateHome}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
        >
          <span>অন্যান্য প্রশ্ন ও পরীক্ষা দেখুন</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
