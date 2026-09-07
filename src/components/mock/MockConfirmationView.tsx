import React, { useState } from 'react';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { CurriculumSubject } from '../../data/mockCurriculum';

interface MockConfirmationViewProps {
  selectedSubject: CurriculumSubject;
  selectedSubtopicTitles: string[];
  selectedTopicTitles: string[];
  questionCount: number;
  timeMinutes: number;
  negativeMarkingEnabled: boolean;
  onTimeChange: (time: number) => void;
  onNegativeMarkingToggle: (enabled: boolean) => void;
  onStartExam: () => void;
  onBack: () => void;
}

export const MockConfirmationView: React.FC<MockConfirmationViewProps> = ({
  selectedSubject,
  selectedSubtopicTitles,
  selectedTopicTitles,
  questionCount,
  timeMinutes,
  negativeMarkingEnabled,
  onTimeChange,
  onNegativeMarkingToggle,
  onStartExam,
  onBack,
}) => {
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] text-slate-900 dark:text-slate-100 flex flex-col font-hind pb-16">
      {/* 1. Header (Screenshot 3) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="পিছনে যান"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              নিশ্চিত করুন
            </h1>
          </div>

          <div className="px-3 py-1 rounded-full bg-[#046A38] text-white text-xs sm:text-sm font-bold shadow-xs">
            ২/২ স্টেপস
          </div>
        </div>

        {/* Both bars are solid green in Step 2 */}
        <div className="max-w-2xl mx-auto flex items-center gap-2 mt-3">
          <div className="h-1.5 flex-1 bg-[#046A38] rounded-full" />
          <div className="h-1.5 flex-1 bg-[#046A38] rounded-full" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-5 space-y-5 flex-1">
        {/* Section Heading: সিলেক্টেড বিষয় (১) */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind mb-3">
            সিলেক্টেড বিষয় (১)
          </h2>

          {/* Subject Card */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            {/* Top row: Subject Name + Question Count Box */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {selectedSubject.name}
              </span>

              <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200">
                {questionCount} টি প্রশ্ন
              </div>
            </div>

            {/* Accordion dropdown toggle: সিলেক্টেড টপিকস দেখতে এখানে ট্যাপ করুন ⌄ */}
            <button
              type="button"
              onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
              className="w-full pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span>সিলেক্টেড টপিকস দেখতে এখানে ট্যাপ করুন</span>
              {isTopicsExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Expanded Topics & Subtopics List */}
            {isTopicsExpanded && (
              <div className="pt-2 space-y-2.5 animate-fade-in bg-slate-50/60 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  নির্বাচিত টপিক ও সাব-টপিকসমূহ:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubtopicTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#046A38] dark:text-emerald-400" />
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Box (মোট সময় + নেগেটিভ মার্কিং) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-5">
          {/* Setting 1: মোট সময় */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span>মোট সময়</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={timeMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) onTimeChange(val);
                }}
                className="w-16 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-[#046A38]"
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                মিনিট
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/80" />

          {/* Setting 2: নেগেটিভ মার্কিং */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                নেগেটিভ মার্কিং
              </span>

              {/* iOS style toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={negativeMarkingEnabled}
                onClick={() => onNegativeMarkingToggle(!negativeMarkingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer focus:outline-none ${
                  negativeMarkingEnabled ? 'bg-[#046A38]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    negativeMarkingEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Pink pill badge: প্রতি ভুলে ০.৫ মার্কস কাটা যাবে */}
            {negativeMarkingEnabled && (
              <div className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold whitespace-nowrap shadow-2xs">
                প্রতি ভুলে ০.৫ মার্কস কাটা যাবে
              </div>
            )}
          </div>
        </div>

        {/* Bottom large button: পরীক্ষা শুরু করুন */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onStartExam}
            className="w-full py-4 rounded-full bg-[#046A38] text-white font-bold text-base sm:text-lg shadow-lg hover:bg-[#03542c] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer"
          >
            পরীক্ষা শুরু করুন
          </button>
        </div>
      </main>
    </div>
  );
};
