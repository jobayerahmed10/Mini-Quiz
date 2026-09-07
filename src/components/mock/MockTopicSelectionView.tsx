import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { CurriculumSubject, CurriculumTopic } from '../../data/mockCurriculum';

interface MockTopicSelectionViewProps {
  selectedSubject: CurriculumSubject;
  allSubjects: CurriculumSubject[];
  selectedTopicIds: Set<string>;
  selectedSubtopicIds: Set<string>;
  questionCount: number;
  onToggleTopic: (topic: CurriculumTopic) => void;
  onToggleSubtopic: (topicId: string, subtopicId: string) => void;
  onSelectAllInTopic: (topic: CurriculumTopic, selectAll: boolean) => void;
  onChangeQuestionCount: (count: number) => void;
  onSwitchSubject: (subject: CurriculumSubject) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const MockTopicSelectionView: React.FC<MockTopicSelectionViewProps> = ({
  selectedSubject,
  allSubjects,
  selectedSubtopicIds,
  questionCount,
  onToggleSubtopic,
  onSelectAllInTopic,
  onChangeQuestionCount,
  onSwitchSubject,
  onProceed,
  onBack,
}) => {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    // Default expand topics for clear hierarchy visibility
    const initial: Record<string, boolean> = {};
    selectedSubject.topics.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
  });

  const [showSubjectDrawer, setShowSubjectDrawer] = useState(false);

  const toggleExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const totalSelectedCount = selectedSubtopicIds.size;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] text-slate-900 dark:text-slate-100 flex flex-col font-hind pb-36">
      {/* 1. Header with Back Button and 1/2 Steps Indicator */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="পিছনে যান"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              টপিক সিলেক্ট করুন
            </h1>
          </div>

          <div className="px-3 py-1 rounded-full bg-[#046A38] text-white text-xs sm:text-sm font-bold shadow-xs select-none">
            ১/২ স্টেপস
          </div>
        </div>

        {/* Two-step progress bar */}
        <div className="max-w-2xl mx-auto flex items-center gap-2 mt-3">
          <div className="h-1.5 flex-1 bg-[#046A38] rounded-full" />
          <div className="h-1.5 flex-1 bg-emerald-100 dark:bg-slate-800 rounded-full" />
        </div>
      </header>

      {/* Active Subject Information Bar */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">বর্তমান বিষয়:</span>
          <span className="text-sm font-black text-[#046A38] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
            {selectedSubject.name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSubjectDrawer(true)}
          className="text-xs font-bold text-[#046A38] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          বিষয় পরিবর্তন করুন
        </button>
      </div>

      {/* 2. Hierarchical Topics and Subtopics List */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-2 space-y-3 sm:space-y-4">
        {selectedSubject.topics.map((topic) => {
          // Check how many child subtopics are currently selected
          const topicSubCount = topic.subtopics.length > 0
            ? topic.subtopics.filter((s) => selectedSubtopicIds.has(s.id)).length
            : (selectedSubtopicIds.has(topic.id) ? 1 : 0);

          const isAllSelected = topic.subtopics.length > 0
            ? topicSubCount === topic.subtopics.length
            : selectedSubtopicIds.has(topic.id);

          const isPartiallySelected = topic.subtopics.length > 0 && topicSubCount > 0 && !isAllSelected;
          const isExpanded = expandedTopics[topic.id] ?? true;

          return (
            <div
              key={topic.id}
              className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden transition-all"
            >
              {/* Main Topic Header */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Topic Checkbox */}
                  <button
                    type="button"
                    onClick={() => onSelectAllInTopic(topic, !isAllSelected)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isAllSelected
                        ? 'bg-[#046A38] border-[#046A38] text-white shadow-xs'
                        : isPartiallySelected
                        ? 'bg-[#046A38]/20 border-[#046A38] text-[#046A38]'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                    }`}
                    aria-label={`Select all in ${topic.title}`}
                  >
                    {isAllSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    {isPartiallySelected && <div className="w-2.5 h-2.5 bg-[#046A38] rounded-xs" />}
                  </button>

                  {/* Topic Title */}
                  <div
                    onClick={() => toggleExpand(topic.id)}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {topic.title}
                    </span>

                    {/* Subtopic selected count badge */}
                    {topicSubCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#046A38] text-white text-xs font-black shrink-0">
                        {topicSubCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Dynamic Questions Count ({solved}/{total} টি প্রশ্ন) & Accordion toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {topic.solvedQuestions}/{topic.totalQuestions} টি প্রশ্ন
                  </span>
                  {topic.subtopics.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(topic.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label="টপিক টগল করুন"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Indented Child Subtopics List */}
              {isExpanded && topic.subtopics.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40">
                  {topic.subtopics.map((sub) => {
                    const isSubChecked = selectedSubtopicIds.has(sub.id);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => onToggleSubtopic(topic.id, sub.id)}
                        className="py-2.5 px-4 sm:px-6 pl-10 sm:pl-12 flex items-center justify-between gap-3 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Subtopic Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                              isSubChecked
                                ? 'bg-[#046A38] border-[#046A38] text-white shadow-2xs'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSubChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          {/* Subtopic Title */}
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isSubChecked
                                ? 'text-[#046A38] dark:text-emerald-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {sub.title}
                          </span>
                        </div>

                        {/* Subtopic Question Count: {solved}/{total} */}
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                          {sub.solvedQuestions}/{sub.totalQuestions}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* 3. Fixed Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Row 1: Question Count Selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-hind">
              প্রশ্নের সংখ্যা
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={100}
                value={questionCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) onChangeQuestionCount(val);
                }}
                className="w-16 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-[#046A38]"
              />
            </div>
          </div>

          {/* Row 2: Action Buttons (+ আরেকটি বিষয় & এগিয়ে যান) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowSubjectDrawer(true)}
              className="py-3 px-4 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ আরেকটি বিষয়</span>
            </button>

            <button
              type="button"
              onClick={onProceed}
              disabled={totalSelectedCount === 0}
              className="py-3 px-6 rounded-full bg-[#046A38] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-md hover:bg-[#03542c] active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <span>এগিয়ে যান ({totalSelectedCount})</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Subject Switcher Drawer Modal */}
      {showSubjectDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                বিষয় নির্বাচন করুন
              </h3>
              <button
                type="button"
                onClick={() => setShowSubjectDrawer(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1 cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {allSubjects.map((sub) => {
                const isCurrent = sub.id === selectedSubject.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      onSwitchSubject(sub);
                      setShowSubjectDrawer(false);
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-[#046A38] bg-emerald-50/60 dark:bg-emerald-950/40 text-[#046A38] dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-bold">{sub.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {sub.topics.length} টি টপিক
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
