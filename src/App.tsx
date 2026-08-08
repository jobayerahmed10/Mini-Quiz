import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PracticePage } from './components/PracticePage';
import { ResultPage } from './components/ResultPage';
import { SupabaseInfoModal } from './components/SupabaseInfoModal';
import { Question, PageRoute, QuizResult, UserAnswer } from './types';
import { fetchPublishedQuestions } from './lib/supabase';
import { getStudentStats, saveQuizResultToStats, StudentStats } from './lib/utils';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats>(getStudentStats());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Load published questions on mount
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const result = await fetchPublishedQuestions(false);
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
    const score = correctCount; // 1 mark per correct question
    const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

    const result: QuizResult = {
      totalQuestions,
      correctCount,
      wrongCount,
      score,
      percentage,
      userAnswers,
      completedAt: new Date().toISOString(),
    };

    setQuizResult(result);
    const updatedStats = saveQuizResultToStats(correctCount, totalQuestions);
    setStudentStats(updatedStats);
    setCurrentPage('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartPractice = () => {
    if (questions.length === 0) return;
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-bengali selection:bg-emerald-200">
      {/* Top Navigation Header */}
      <Header
        currentPage={currentPage}
        onNavigateHome={handleNavigateHome}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentPage === 'home' && (
          <HomePage
            questions={questions}
            isLoading={isLoading}
            isFromSupabase={isFromSupabase}
            fetchError={fetchError}
            studentStats={studentStats}
            onStartPractice={handleStartPractice}
            onRefreshQuestions={loadQuestions}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {currentPage === 'practice' && (
          <PracticePage
            questions={questions}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            MiniQuiz Student App &bull; বাংলা এমসিকিউ অনুশীলন প্ল্যাটফর্ম
          </p>
          <p className="opacity-80">
            Supabase Ready &bull; Read-Only Architecture
          </p>
        </div>
      </footer>

      {/* Supabase SQL & Instructions Modal */}
      <SupabaseInfoModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
