import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PracticePage } from './components/PracticePage';
import { ResultPage } from './components/ResultPage';
import { ExamPage } from './components/ExamPage';
import { CoursesPage } from './components/CoursesPage';
import { UstadAiPage } from './components/UstadAiPage';
import { JobCircularsPage } from './components/JobCircularsPage';
import { SubjectsPage } from './components/SubjectsPage';
import { BottomNav } from './components/BottomNav';
import { Question, PageRoute, QuizResult, UserAnswer, TabRoute } from './types';
import { fetchPublishedQuestions } from './lib/supabase';
import { getStudentStats, saveQuizResultToStats, StudentStats } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabRoute>('exam');
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats>(getStudentStats());

  // Load published questions on mount
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const result = await fetchPublishedQuestions();
    setQuestions(result.questions);
    setIsFromSupabase(result.isFromSupabase);
    setFetchError(result.error || null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Handle quiz completion
  const handleFinishQuiz = (userAnswers: UserAnswer[]) => {
    const totalQuestions = userAnswers.length;
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const wrongCount = totalQuestions - correctCount;
    const score = correctCount;
    const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

    const result: QuizResult = {
      totalQuestions,
      correctCount,
      wrongCount,
      score,
      percentage,
      userAnswers,
      completedAt: new Date().toISOString(),
      selectedSubject: selectedSubject,
    };

    setQuizResult(result);
    const updatedStats = saveQuizResultToStats(correctCount, totalQuestions);
    setStudentStats(updatedStats);
    setCurrentPage('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartPractice = (subject: string = 'সকল বিষয়') => {
    setSelectedSubject(subject);
    setCurrentPage('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setQuizResult(null);
    setCurrentPage('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: TabRoute) => {
    setActiveTab(tab);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-bengali selection:bg-amber-500 selection:text-slate-950 pb-20">
      {/* Top Navigation Header */}
      <Header
        currentPage={currentPage}
        selectedSubject={selectedSubject}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-12">
        {currentPage === 'practice' && (
          <PracticePage
            questions={questions}
            initialSubject={selectedSubject}
            onFinishQuiz={handleFinishQuiz}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {currentPage === 'result' && quizResult && (
          <ResultPage
            result={quizResult}
            onRetry={handleRetry}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {currentPage === 'home' && (
          <>
            {activeTab === 'exam' && (
              <ExamPage
                onStartExam={(opts) => handleStartPractice(opts.subject)}
              />
            )}

            {activeTab === 'courses' && (
              <CoursesPage />
            )}

            {activeTab === 'ustad_ai' && (
              <UstadAiPage />
            )}

            {activeTab === 'circulars' && (
              <JobCircularsPage
                onStartModelTestForCategory={(cat) => handleStartPractice(cat)}
              />
            )}

            {activeTab === 'subjects' && (
              <SubjectsPage
                onSelectSubject={(subj) => handleStartPractice(subj)}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Neumorphic Sticky Nav Bar */}
      {currentPage !== 'practice' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadCircularsCount={3}
        />
      )}
    </div>
  );
}


