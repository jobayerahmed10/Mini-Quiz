import React, { useState, useEffect, useMemo } from 'react';
import { CurriculumSubject, CurriculumTopic } from '../../data/mockCurriculum';
import { 
  fetchMockCurriculumFromSupabase, 
  fetchQuestionsForSelectedSubtopics, 
  recordAttemptedQuestionIds,
  subscribeToQuestionsRealtime 
} from '../../lib/mockTopicService';
import { MockTopicSelectionView } from './MockTopicSelectionView';
import { MockConfirmationView } from './MockConfirmationView';
import { MockExamInterface } from './MockExamInterface';
import { Question, QuizResult } from '../../types';

interface MockExamFlowProps {
  initialSubjectName: string;
  allQuestions: Question[];
  onFinishQuiz: (result: QuizResult) => void;
  onClose: () => void;
}

export const MockExamFlow: React.FC<MockExamFlowProps> = ({
  initialSubjectName,
  allQuestions,
  onFinishQuiz,
  onClose,
}) => {
  const [curriculum, setCurriculum] = useState<CurriculumSubject[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [currentStep, setCurrentStep] = useState<'topic_select' | 'confirm' | 'exam'>('topic_select');
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // 1. Initial Selection State: strictly EMPTY by default (remove auto-select / pre-check behavior)
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<Set<string>>(() => new Set<string>());

  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(25);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState<boolean>(true);

  const [loadingExamQuestions, setLoadingExamQuestions] = useState<boolean>(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);

  // Load subjects & topics with dynamic counts from Supabase and subscribe to realtime updates
  useEffect(() => {
    let mounted = true;

    const loadData = () => {
      fetchMockCurriculumFromSupabase().then((data) => {
        if (!mounted) return;
        setCurriculum(data);
        setLoadingCurriculum(false);
      });
    };

    loadData();

    // Realtime channel subscription: auto-updates when admin inserts/updates questions
    const unsubscribe = subscribeToQuestionsRealtime(() => {
      if (mounted) {
        loadData();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Find the selected subject
  const selectedSubject = useMemo(() => {
    if (curriculum.length === 0) return null;
    if (activeSubjectId) {
      const foundById = curriculum.find((s) => s.id === activeSubjectId);
      if (foundById) return foundById;
    }
    const cleanInitial = initialSubjectName.trim().toLowerCase();
    const foundByName = curriculum.find(
      (s) =>
        s.name.toLowerCase().includes(cleanInitial) ||
        cleanInitial.includes(s.name.toLowerCase())
    );
    return foundByName || curriculum[0];
  }, [curriculum, initialSubjectName, activeSubjectId]);

  // Subtopic toggle handler
  const handleToggleSubtopic = (topicId: string, subtopicId: string) => {
    setSelectedSubtopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(subtopicId)) {
        next.delete(subtopicId);
      } else {
        next.add(subtopicId);
      }
      return next;
    });
  };

  // Select all or deselect all in a topic
  const handleSelectAllInTopic = (topic: CurriculumTopic, selectAll: boolean) => {
    setSelectedSubtopicIds((prev) => {
      const next = new Set(prev);
      if (topic.subtopics.length > 0) {
        topic.subtopics.forEach((sub) => {
          if (selectAll) {
            next.add(sub.id);
          } else {
            next.delete(sub.id);
          }
        });
      } else {
        if (selectAll) {
          next.add(topic.id);
        } else {
          next.delete(topic.id);
        }
      }
      return next;
    });
  };

  // Parent topic checkbox toggle
  const handleToggleTopic = (topic: CurriculumTopic) => {
    if (topic.subtopics.length > 0) {
      const topicSubIds = topic.subtopics.map((s) => s.id);
      const allSelected = topicSubIds.every((id) => selectedSubtopicIds.has(id));
      handleSelectAllInTopic(topic, !allSelected);
    } else {
      setSelectedSubtopicIds((prev) => {
        const next = new Set(prev);
        if (next.has(topic.id)) {
          next.delete(topic.id);
        } else {
          next.add(topic.id);
        }
        return next;
      });
    }
  };

  // Subject switch handler (resets selection to empty)
  const handleSwitchSubject = (newSubject: CurriculumSubject) => {
    setActiveSubjectId(newSubject.id);
    setSelectedSubtopicIds(new Set<string>()); // Empty selection on subject change
  };

  // Resolve titles of selected items for Step 2 confirmation
  const { selectedSubtopicTitles, selectedTopicTitles } = useMemo(() => {
    if (!selectedSubject) return { selectedSubtopicTitles: [], selectedTopicTitles: [] };

    const subTitles: string[] = [];
    const topTitles: string[] = [];

    selectedSubject.topics.forEach((top) => {
      let topicHasSub = false;
      if (top.subtopics.length > 0) {
        top.subtopics.forEach((sub) => {
          if (selectedSubtopicIds.has(sub.id)) {
            subTitles.push(sub.title);
            topicHasSub = true;
          }
        });
      } else if (selectedSubtopicIds.has(top.id)) {
        subTitles.push(top.title);
        topicHasSub = true;
      }

      if (topicHasSub) {
        topTitles.push(top.title);
      }
    });

    return { selectedSubtopicTitles: subTitles, selectedTopicTitles: topTitles };
  }, [selectedSubject, selectedSubtopicIds]);

  // Handle Start Examination: Queries Supabase for selected subtopics, shuffles, and starts exam
  const handleStartExam = async () => {
    setLoadingExamQuestions(true);
    try {
      const subtopicIdArray = Array.from(selectedSubtopicIds);
      let loadedQuestions = await fetchQuestionsForSelectedSubtopics(
        subtopicIdArray,
        selectedSubtopicTitles,
        questionCount
      );

      // If database has 0 or fewer questions, fallback to allQuestions matching subject
      if (loadedQuestions.length === 0) {
        const fallback = allQuestions.slice(0, questionCount);
        loadedQuestions = fallback;
      }

      setExamQuestions(loadedQuestions);
      setCurrentStep('exam');
    } catch (err) {
      console.error('Error starting mock exam:', err);
    } finally {
      setLoadingExamQuestions(false);
    }
  };

  if (loadingCurriculum || !selectedSubject) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] flex flex-col items-center justify-center p-6 text-center font-hind">
        <div className="w-12 h-12 rounded-full border-4 border-[#046A38]/30 border-t-[#046A38] animate-spin mb-4" />
        <p className="text-slate-700 dark:text-slate-300 font-bold text-base">
          সুপাবেজ থেকে টপিক ও সাব-টপিক লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* STEP 1: TOPIC & SUBTOPIC SELECTION */}
      {currentStep === 'topic_select' && (
        <MockTopicSelectionView
          selectedSubject={selectedSubject}
          allSubjects={curriculum}
          selectedTopicIds={new Set(selectedTopicTitles)}
          selectedSubtopicIds={selectedSubtopicIds}
          questionCount={questionCount}
          onToggleTopic={handleToggleTopic}
          onToggleSubtopic={handleToggleSubtopic}
          onSelectAllInTopic={handleSelectAllInTopic}
          onChangeQuestionCount={setQuestionCount}
          onSwitchSubject={handleSwitchSubject}
          onProceed={() => setCurrentStep('confirm')}
          onBack={onClose}
        />
      )}

      {/* STEP 2: CONFIRMATION & SETTINGS */}
      {currentStep === 'confirm' && (
        <MockConfirmationView
          selectedSubject={selectedSubject}
          selectedSubtopicTitles={selectedSubtopicTitles}
          selectedTopicTitles={selectedTopicTitles}
          questionCount={questionCount}
          timeMinutes={timeMinutes}
          negativeMarkingEnabled={negativeMarkingEnabled}
          onTimeChange={setTimeMinutes}
          onNegativeMarkingToggle={setNegativeMarkingEnabled}
          onStartExam={handleStartExam}
          onBack={() => setCurrentStep('topic_select')}
        />
      )}

      {/* STEP 3: MOCK EXAM INTERFACE */}
      {currentStep === 'exam' && (
        <MockExamInterface
          questions={examQuestions}
          subjectName={selectedSubject.name}
          timeMinutes={timeMinutes}
          negativeMarkingEnabled={negativeMarkingEnabled}
          onFinishExam={(result) => {
            // Save answered question IDs to localStorage for tracking attempted stats
            const answeredIds = result.userAnswers?.map((a) => String(a.questionId)) || [];
            if (answeredIds.length > 0) {
              recordAttemptedQuestionIds(answeredIds);
            }
            onFinishQuiz(result);
          }}
          onExit={onClose}
        />
      )}

      {/* Loading Overlay when generating exam session */}
      {loadingExamQuestions && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-[#046A38]/30 border-t-[#046A38] animate-spin" />
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              নির্বাচিত টপিকের প্রশ্নসমূহ লোড ও সাজানো হচ্ছে...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
