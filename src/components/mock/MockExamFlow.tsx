import React, { useState, useEffect, useMemo } from 'react';
import { CurriculumSubject, CurriculumTopic } from '../../data/mockCurriculum';
import { fetchMockCurriculumFromSupabase } from '../../lib/mockTopicService';
import { MockTopicSelectionView } from './MockTopicSelectionView';
import { MockConfirmationView } from './MockConfirmationView';
import { MockExamInterface } from './MockExamInterface';
import { Question, QuizResult } from '../../types';
import { AUTHENTIC_TOPIC_QUESTIONS } from '../../data/charyapadaQuestions';

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

  // Load subjects & topics from Supabase
  useEffect(() => {
    let mounted = true;
    fetchMockCurriculumFromSupabase().then((data) => {
      if (!mounted) return;
      setCurriculum(data);
      setLoadingCurriculum(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Find the selected subject
  const selectedSubject = useMemo(() => {
    if (curriculum.length === 0) return null;
    const cleanInitial = initialSubjectName.trim().toLowerCase();
    const found = curriculum.find(
      (s) =>
        s.name.toLowerCase().includes(cleanInitial) ||
        cleanInitial.includes(s.name.toLowerCase())
    );
    return found || curriculum[0];
  }, [curriculum, initialSubjectName]);

  // Selected subtopics & topics state
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    return set;
  });

  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(25);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState<boolean>(true);

  // Initialize with the first topic's subtopics selected by default
  useEffect(() => {
    if (selectedSubject && selectedSubtopicIds.size === 0) {
      const initialSet = new Set<string>();
      if (selectedSubject.topics.length > 0) {
        // Default select subtopics of the first topic (e.g. চর্যাপদ as in screenshot)
        selectedSubject.topics[0].subtopics.forEach((sub) => {
          initialSet.add(sub.id);
        });
      }
      setSelectedSubtopicIds(initialSet);
    }
  }, [selectedSubject]);

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

  const handleSelectAllInTopic = (topic: CurriculumTopic, selectAll: boolean) => {
    setSelectedSubtopicIds((prev) => {
      const next = new Set(prev);
      topic.subtopics.forEach((sub) => {
        if (selectAll) {
          next.add(sub.id);
        } else {
          next.delete(sub.id);
        }
      });
      return next;
    });
  };

  const handleToggleTopic = (topic: CurriculumTopic) => {
    const topicSubIds = topic.subtopics.map((s) => s.id);
    const allSelected = topicSubIds.every((id) => selectedSubtopicIds.has(id));
    handleSelectAllInTopic(topic, !allSelected);
  };

  const handleSwitchSubject = (newSubject: CurriculumSubject) => {
    const newSet = new Set<string>();
    if (newSubject.topics.length > 0) {
      newSubject.topics[0].subtopics.forEach((sub) => newSet.add(sub.id));
    }
    setSelectedSubtopicIds(newSet);
  };

  // Build resolved titles of selected items for display in step 2
  const { selectedSubtopicTitles, selectedTopicTitles } = useMemo(() => {
    if (!selectedSubject) return { selectedSubtopicTitles: [], selectedTopicTitles: [] };

    const subTitles: string[] = [];
    const topTitles: string[] = [];

    selectedSubject.topics.forEach((top) => {
      let topicHasSub = false;
      top.subtopics.forEach((sub) => {
        if (selectedSubtopicIds.has(sub.id)) {
          subTitles.push(sub.title);
          topicHasSub = true;
        }
      });
      if (topicHasSub) {
        topTitles.push(top.title);
      }
    });

    return { selectedSubtopicTitles: subTitles, selectedTopicTitles: topTitles };
  }, [selectedSubject, selectedSubtopicIds]);

  // Resolve questions for the exam
  const examQuestions = useMemo(() => {
    if (!selectedSubject) return [];

    const searchPool = [...AUTHENTIC_TOPIC_QUESTIONS, ...allQuestions];
    const subSet = new Set(selectedSubtopicTitles.map((t) => t.toLowerCase().trim()));
    const topSet = new Set(selectedTopicTitles.map((t) => t.toLowerCase().trim()));
    const subjName = selectedSubject.name.toLowerCase();

    // 1. Exact match by subtopic or topic
    const matched: Question[] = [];
    const seen = new Set<string>();

    searchPool.forEach((q) => {
      const qKey = `${q.id}-${q.question}`;
      if (seen.has(qKey)) return;

      const qTopic = (q.topic || '').toLowerCase().trim();
      const qSubj = (q.subject || '').toLowerCase().trim();

      const matchesSubtopic = qTopic && subSet.has(qTopic);
      const matchesTopic = qTopic && topSet.has(qTopic);
      const matchesSubject = qSubj && (qSubj.includes(subjName) || subjName.includes(qSubj));

      if (matchesSubtopic || matchesTopic || (matchesSubject && selectedSubtopicTitles.length === 0)) {
        seen.add(qKey);
        matched.push(q);
      }
    });

    // If matches are fewer than questionCount, pad with subject questions or pool
    if (matched.length < questionCount) {
      searchPool.forEach((q) => {
        const qKey = `${q.id}-${q.question}`;
        if (!seen.has(qKey)) {
          seen.add(qKey);
          matched.push(q);
        }
      });
    }

    return matched.slice(0, questionCount);
  }, [selectedSubject, selectedSubtopicTitles, selectedTopicTitles, allQuestions, questionCount]);

  if (loadingCurriculum || !selectedSubject) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090E1A] flex flex-col items-center justify-center p-6 text-center font-hind">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600/30 border-t-emerald-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-bold">
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
          onStartExam={() => setCurrentStep('exam')}
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
            onFinishQuiz(result);
          }}
          onExit={onClose}
        />
      )}
    </div>
  );
};
