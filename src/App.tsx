import { useState, useEffect, useCallback } from 'react';
import { Header, FontFamilyType } from './components/Header';
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

  const handleStartPractice = (subjectOrOpts: string | { subject: string; questionCount?: number; timeMinutes?: number } = 'সকল বিষয়') => {
    const subjName = typeof subjectOrOpts === 'string' ? subjectOrOpts : subjectOrOpts.subject;
    const timeMins = typeof subjectOrOpts === 'object' && subjectOrOpts.timeMinutes ? subjectOrOpts.timeMinutes : 30;
    setSelectedSubject(subjName);
    setExamTimeMinutes(timeMins);
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
        selectedSubject={selectedSubject}
        onNavigateHome={handleNavigateHome}
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
            showHarakat={showHarakat}
          />
        )}

        {currentPage === 'home' && (
          <>
            {activeTab === 'exam' && (
              <ExamPage
                onStartExam={(opts) => handleStartPractice(opts)}
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


