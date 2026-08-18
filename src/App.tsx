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
import { ProfileModal } from './components/ProfileModal';
import { ProfilePage } from './components/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { Question, PageRoute, QuizResult, UserAnswer, TabRoute } from './types';
import { fetchPublishedQuestions, saveLeaderboardEntryToSupabase, submitExamResultToSupabase, LeaderboardEntry } from './lib/supabase';
import { getStudentStats, saveQuizResultToStats, StudentStats, addCompletedExamId, saveExamResult, getExamResult, getUserProfile, getUserUniqueId } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem('miniquiz_questions_cache');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('miniquiz_questions_cache');
    } catch {
      return true;
    }
  });
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [examQuestionCount, setExamQuestionCount] = useState<number | undefined>(undefined);
  const [examTimeMinutes, setExamTimeMinutes] = useState<number>(30);
  const [activeExamId, setActiveExamId] = useState<string | undefined>(undefined);
  const [activeExamTitle, setActiveExamTitle] = useState<string | undefined>(undefined);
  const [selectedLeaderboardExamId, setSelectedLeaderboardExamId] = useState<string>('all');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(() => {
    return getExamResult('latest_exam_result');
  });
  const [resultViewMode, setResultViewMode] = useState<'summary' | 'explanation'>('summary');
  const [studentStats, setStudentStats] = useState<StudentStats>(getStudentStats());
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

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
  const handleFinishQuiz = async (userAnswers: UserAnswer[], timeTakenSeconds: number = 0) => {
    const totalQuestions = userAnswers.length;
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const wrongCount = totalQuestions - correctCount;
    // 0.25 negative marking for wrong answers if desired, or standard score
    const negativeMarks = Number((wrongCount * 0.25).toFixed(2));
    const score = Math.max(0, Number((correctCount - negativeMarks).toFixed(2)));
    const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

    const examId = activeExamId || selectedSubject || 'general';
    const examTitle = activeExamTitle || (typeof activeExamId === 'string' && activeExamId !== selectedSubject ? activeExamId : selectedSubject) || 'বাংলা মডেল টেস্ট';

    const result: QuizResult = {
      totalQuestions,
      correctCount,
      wrongCount,
      score: correctCount,
      percentage,
      userAnswers,
      completedAt: new Date().toISOString(),
      selectedSubject: selectedSubject,
      examId: examId,
      examTitle: examTitle,
      timeTakenSeconds: timeTakenSeconds,
      negativeMarks: negativeMarks,
    };

    setQuizResult(result);
    setResultViewMode('summary');

    // Create & save Leaderboard Entry & Exam Result
    const userProfile = getUserProfile();
    const userName = userProfile?.name?.trim() || 'জুবায়ের আহমদ';
    const userAvatar = userProfile?.avatar;
    const userId = getUserUniqueId();

    const entry: LeaderboardEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exam_id: examId,
      exam_title: examTitle,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      score: correctCount,
      total_questions: totalQuestions,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy: percentage,
      created_at: new Date().toISOString(),
    };

    saveLeaderboardEntryToSupabase(entry);

    // Also persist structured exam result to Supabase exam_results & profiles
    submitExamResultToSupabase({
      exam_id: examId,
      exam_title: examTitle,
      is_free: true,
      user_id: userId,
      full_name: userName,
      avatar_url: userAvatar,
      score: correctCount,
      total_marks: totalQuestions,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      time_taken_seconds: timeTakenSeconds,
      submitted_at: entry.created_at,
    });

    // Mark specific active exam as completed and persist result
    if (activeExamId) {
      addCompletedExamId(activeExamId);
      saveExamResult(activeExamId, result);
    }
    if (selectedSubject) {
      saveExamResult(selectedSubject, result);
    }
    saveExamResult('latest_exam_result', result);

    const updatedStats = saveQuizResultToStats(correctCount, totalQuestions);
    setStudentStats(updatedStats);
    navigateWithHistory('result');
  };

  const handleReviewAnswers = (opts: { examId?: string; subject?: string; examType?: string; questionCount?: number; timeMinutes?: number }) => {
    let saved = opts.examId ? getExamResult(opts.examId) : null;
    if (!saved && opts.examType) {
      saved = getExamResult(opts.examType);
    }
    if (!saved && opts.subject) {
      saved = getExamResult(opts.subject);
    }
    if (!saved) {
      saved = getExamResult('latest_exam_result');
    }

    if (saved) {
      setQuizResult(saved);
      setResultViewMode('explanation');
      navigateWithHistory('result');
    } else {
      handleStartPractice({
        subject: opts.subject || 'সকল বিষয়',
        questionCount: opts.questionCount,
        timeMinutes: opts.timeMinutes,
        examId: opts.examId,
        examType: opts.examType,
      });
    }
  };

  const handleOpenLeaderboard = (examId?: string) => {
    if (examId) {
      setSelectedLeaderboardExamId(examId);
    } else if (activeExamId) {
      setSelectedLeaderboardExamId(activeExamId);
    } else {
      setSelectedLeaderboardExamId('all');
    }
    navigateWithHistory('leaderboard');
  };

  const handleStartPractice = (subjectOrOpts: string | { subject: string; questionCount?: number; timeMinutes?: number; examId?: string; examType?: string } = 'সকল বিষয়') => {
    if (typeof subjectOrOpts === 'string') {
      setSelectedSubject(subjectOrOpts);
      setExamQuestionCount(undefined);
      setExamTimeMinutes(30);
      setActiveExamId(undefined);
      setActiveExamTitle(subjectOrOpts);
    } else {
      setSelectedSubject(subjectOrOpts.subject);
      setExamQuestionCount(subjectOrOpts.questionCount);
      setExamTimeMinutes(subjectOrOpts.timeMinutes || 30);
      setActiveExamId(subjectOrOpts.examId || subjectOrOpts.examType);
      setActiveExamTitle(subjectOrOpts.examType || subjectOrOpts.subject);
    }
    navigateWithHistory('practice');
  };

  const handleNavigateHome = () => {
    navigateWithHistory('home', 'home');
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
      {/* Top Navigation Header with Search Bar and Sub-tabs */}
      <Header
        currentPage={currentPage}
        activeTab={activeTab}
        selectedSubject={selectedSubject}
        onNavigateHome={handleNavigateHome}
        onTabChange={handleTabChange}
        onGoBack={handleGoBack}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        fontFamily={fontFamily}
        onChangeFontFamily={setFontFamily}
        showHarakat={showHarakat}
        onChangeShowHarakat={setShowHarakat}
        onOpenProfile={() => setCurrentPage('profile')}
        onOpenLeaderboard={handleOpenLeaderboard}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-12">
        {currentPage === 'profile' && (
          <ProfilePage
            onNavigateHome={handleNavigateHome}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenCourses={() => {
              setCurrentPage('home');
              setActiveTab('courses');
            }}
          />
        )}

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
            initialViewMode={resultViewMode}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage
            onBack={handleGoBack}
            currentUserScore={quizResult?.score || 0}
            totalQuestions={quizResult?.totalQuestions || 0}
            correctCount={quizResult?.correctCount || 0}
            wrongCount={quizResult?.wrongCount || 0}
            initialExamId={selectedLeaderboardExamId}
          />
        )}

        {currentPage === 'home' && (
          <>
            {activeTab === 'home' && (
              <HomePage
                questions={questions}
                isLoading={isLoading}
                isFromSupabase={isFromSupabase}
                fetchError={fetchError}
                studentStats={studentStats}
                selectedSubject={selectedSubject}
                onSelectSubject={(subj) => handleStartPractice(subj)}
                onStartPractice={(subj) => handleStartPractice(subj || 'সকল বিষয়')}
                onRefreshQuestions={loadQuestions}
                onOpenSupabaseModal={() => {}}
                onTabNavigate={handleTabChange}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'exam' && (
              <ExamPage
                questions={questions}
                onStartExam={(opts) => handleStartPractice(opts)}
                onOpenLeaderboard={handleOpenLeaderboard}
                onReviewAnswers={(opts) => handleReviewAnswers(opts)}
              />
            )}

            {activeTab === 'courses' && (
              <CoursesPage
                questions={questions}
                onStartExam={(opts) => handleStartPractice(opts)}
                onReviewAnswers={(opts) => handleReviewAnswers(opts)}
                onOpenLeaderboard={handleOpenLeaderboard}
              />
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
                onOpenCourses={() => handleTabChange('courses')}
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


