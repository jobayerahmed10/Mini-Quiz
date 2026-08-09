import { useState, useEffect, useCallback } from 'react';
import { Header, FontFamilyType } from './components/Header';
import { HomePage } from './components/HomePage';
import { PracticePage } from './components/PracticePage';
import { ResultPage } from './components/ResultPage';
import { ExamPage } from './components/ExamPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { CoursesPage } from './components/CoursesPage';
import { UstadAiPage } from './components/UstadAiPage';
import { JobCircularsPage } from './components/JobCircularsPage';
import { SubjectsPage } from './components/SubjectsPage';
import { BottomNav } from './components/BottomNav';
import { Question, PageRoute, QuizResult, UserAnswer, TabRoute } from './types';
import { fetchPublishedQuestions } from './lib/supabase';
import { getStudentStats, saveQuizResultToStats, StudentStats, addCompletedExamId } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabRoute>('exam');
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [examQuestionCount, setExamQuestionCount] = useState<number | undefined>(undefined);
  const [examTimeMinutes, setExamTimeMinutes] = useState<number>(30);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats>(getStudentStats());

  // Dark Mode & Font Customization State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('miniquiz_darkmode') === 'true';
  });

  const [fontSize, setFontSize] = useState<'normal' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('miniquiz_fontsize') as 'normal' | 'medium' | 'large') || 'normal';
  });

  const [fontFamily, setFontFamily] = useState<FontFamilyType>(() => {
    return (localStorage.getItem('miniquiz_fontfamily') as FontFamilyType) || 'hind';
  });

  const [showHarakat, setShowHarakat] = useState<boolean>(() => {
    return localStorage.getItem('miniquiz_showharakat') !== 'false';
  });

  // Apply Dark Mode class to documentElement & body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('miniquiz_darkmode', String(isDarkMode));
  }, [isDarkMode]);

  // Persist Font & Harakat settings
  useEffect(() => {
    localStorage.setItem('miniquiz_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('miniquiz_fontfamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('miniquiz_showharakat', String(showHarakat));
  }, [showHarakat]);

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

  // History state listener for mobile back button support
  useEffect(() => {
    // Set initial history state if not set
    if (!window.history.state) {
      window.history.replaceState({ page: 'home', tab: 'exam' }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setCurrentPage(e.state.page as PageRoute);
        if (e.state.tab) {
          setActiveTab(e.state.tab as TabRoute);
        }
      } else {
        setCurrentPage('home');
        setActiveTab('exam');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateWithHistory = (newPage: PageRoute, newTab?: TabRoute) => {
    const targetTab = newTab || activeTab;
    setCurrentPage(newPage);
    if (newTab) {
      setActiveTab(newTab);
    }
    window.history.pushState({ page: newPage, tab: targetTab }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateWithHistory('home', 'exam');
    }
  };

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
    // Mark subject and exam as completed
    if (selectedSubject) {
      addCompletedExamId(selectedSubject);
    }
    addCompletedExamId('exam_1');
    addCompletedExamId('exam_2');

    const updatedStats = saveQuizResultToStats(correctCount, totalQuestions);
    setStudentStats(updatedStats);
    navigateWithHistory('result');
  };

  const handleOpenLeaderboard = () => {
    navigateWithHistory('leaderboard');
  };

  const handleStartPractice = (subjectOrOpts: string | { subject: string; questionCount?: number; timeMinutes?: number } = 'সকল বিষয়') => {
    if (typeof subjectOrOpts === 'string') {
      setSelectedSubject(subjectOrOpts);
      setExamQuestionCount(undefined);
      setExamTimeMinutes(30);
    } else {
      setSelectedSubject(subjectOrOpts.subject);
      setExamQuestionCount(subjectOrOpts.questionCount);
      setExamTimeMinutes(subjectOrOpts.timeMinutes || 30);
    }
    navigateWithHistory('practice');
  };

  const handleNavigateHome = () => {
    navigateWithHistory('home', 'exam');
  };

  const handleRetry = () => {
    setQuizResult(null);
    navigateWithHistory('practice');
  };

  const handleTabChange = (tab: TabRoute) => {
    navigateWithHistory('home', tab);
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'noto': return 'font-noto';
      case 'tiro': return 'font-tiro';
      case 'anek': return 'font-anek';
      case 'amiri': return 'font-amiri';
      case 'scheherazade': return 'font-scheherazade';
      case 'cairo': return 'font-cairo';
      default: return 'font-hind';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'medium': return 'font-scale-medium';
      case 'large': return 'font-scale-large';
      default: return 'font-scale-normal';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-[#0B132B] selection:text-white pb-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0B132B] text-slate-100 dark' : 'bg-slate-100 text-slate-900'
    } ${getFontFamilyClass()} ${getFontSizeClass()}`}>
      {/* Top Navigation Header */}
      <Header
        currentPage={currentPage}
        activeTab={activeTab}
        selectedSubject={selectedSubject}
        onNavigateHome={handleNavigateHome}
        onGoBack={handleGoBack}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        fontFamily={fontFamily}
        onChangeFontFamily={setFontFamily}
        showHarakat={showHarakat}
        onChangeShowHarakat={setShowHarakat}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-12">
        {currentPage === 'practice' && (
          <PracticePage
            questions={questions}
            initialSubject={selectedSubject}
            targetQuestionCount={examQuestionCount}
            timeMinutes={examTimeMinutes}
            onFinishQuiz={handleFinishQuiz}
            onNavigateHome={handleNavigateHome}
            showHarakat={showHarakat}
          />
        )}

        {currentPage === 'result' && quizResult && (
          <ResultPage
            result={quizResult}
            onRetry={handleRetry}
            onNavigateHome={handleNavigateHome}
            onOpenLeaderboard={handleOpenLeaderboard}
            showHarakat={showHarakat}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage
            onBack={handleGoBack}
            currentUserScore={quizResult?.score || 15}
            totalQuestions={quizResult?.totalQuestions || 15}
            correctCount={quizResult?.correctCount || 14}
            wrongCount={quizResult?.wrongCount || 1}
          />
        )}

        {currentPage === 'home' && (
          <>
            {activeTab === 'exam' && (
              <ExamPage
                questions={questions}
                onStartExam={(opts) => handleStartPractice(opts)}
                onOpenLeaderboard={handleOpenLeaderboard}
                onReviewAnswers={(opts) => handleStartPractice(opts)}
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


