import { useState, useEffect, useCallback } from 'react';
import { Header, FontFamilyType } from './components/Header';
import { HomePage } from './components/HomePage';
import { PracticePage } from './components/PracticePage';
import { ResultPage } from './components/ResultPage';
import { ExamPage } from './components/ExamPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { CoursesPage } from './components/CoursesPage';
import { UstadAiPage } from './components/UstadAiPage';
import { BlogPage } from './components/BlogPage';
import { JobCircularsPage } from './components/JobCircularsPage';
import { SubjectsPage } from './components/SubjectsPage';
import { ProfileModal } from './components/ProfileModal';
import { ProfilePage } from './components/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { UserRegistrationModal } from './components/UserRegistrationModal';
import { AuthModal } from './components/AuthModal';
import { SharedExamEntranceCard } from './components/SharedExamEntranceCard';
import { RegistrationPromptModal } from './components/RegistrationPromptModal';
import { QuestionDetailPage } from './components/QuestionDetailPage';
import { Question, PageRoute, QuizResult, UserAnswer, TabRoute } from './types';
import { SAMPLE_QUESTIONS } from './data/sampleQuestions';
import { 
  fetchPublishedQuestions, 
  fetchExamsFromSupabase, 
  saveLeaderboardEntryToSupabase, 
  submitExamResultToSupabase, 
  fetchUserCompletedExamsFromSupabase,
  LeaderboardEntry,
  supabaseGetSession,
  supabaseGetUser,
  supabaseOnAuthStateChange,
  syncUserProfileFromSupabase,
  subscribeToExamsAndQuestionsTable
} from './lib/supabase';
import { 
  getStudentStats, 
  saveQuizResultToStats, 
  StudentStats, 
  addCompletedExamId, 
  saveExamResult, 
  getExamResult, 
  getUserProfile, 
  getUserUniqueId, 
  UserProfile, 
  isUserRegistered, 
  saveUserProfile, 
  clearUserProfile,
  saveExamToHistory,
  saveWrongAnswersFromQuiz,
  resetExamAttemptCache,
  incrementTotalExamsCount,
  getUserRollNumber
} from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [activeQuestionSlug, setActiveQuestionSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem('miniquiz_questions_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_QUESTIONS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
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

  // Authentication & Registration Gating State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showRegPromptModal, setShowRegPromptModal] = useState<boolean>(false);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<TabRoute | null>(null);

  // Big Card Landing State for Shared Exams
  const [sharedExamData, setSharedExamData] = useState<{
    examId?: string;
    title: string;
    subject?: string;
    category?: string;
    instructor?: string;
    institution?: string;
    timeMinutes?: number;
    questionCount?: number;
    negativeMark?: string | number;
  } | null>(null);

  // Direct Exam Deep-linking & Auth Modal State
  const [showDirectRegModal, setShowDirectRegModal] = useState<boolean>(false);
  const [pendingDirectExamOpts, setPendingDirectExamOpts] = useState<{
    examId?: string;
    subject: string;
    questionCount?: number;
    timeMinutes?: number;
    examType?: string;
  } | null>(null);

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

  // Persist and apply Font & Harakat settings globally across the entire DOM
  useEffect(() => {
    const fontMap: Record<FontFamilyType, { family: string; arabicFamily: string; className: string }> = {
      hind: {
        family: "'Hind Siliguri', system-ui, -apple-system, sans-serif",
        arabicFamily: "'Amiri', 'Hind Siliguri', serif",
        className: 'font-hind',
      },
      noto: {
        family: "'Noto Serif Bengali', serif",
        arabicFamily: "'Amiri', 'Noto Serif Bengali', serif",
        className: 'font-noto',
      },
      tiro: {
        family: "'Tiro Bangla', serif",
        arabicFamily: "'Amiri', 'Tiro Bangla', serif",
        className: 'font-tiro',
      },
      anek: {
        family: "'Anek Bangla', system-ui, sans-serif",
        arabicFamily: "'Amiri', 'Anek Bangla', serif",
        className: 'font-anek',
      },
      amiri: {
        family: "'Amiri', 'Hind Siliguri', serif",
        arabicFamily: "'Amiri', serif",
        className: 'font-amiri',
      },
      scheherazade: {
        family: "'Scheherazade New', 'Hind Siliguri', serif",
        arabicFamily: "'Scheherazade New', serif",
        className: 'font-scheherazade',
      },
      cairo: {
        family: "'Cairo', 'Hind Siliguri', sans-serif",
        arabicFamily: "'Cairo', sans-serif",
        className: 'font-cairo',
      },
    };

    const selected = fontMap[fontFamily] || fontMap.hind;
    
    // Set root CSS variables for dynamic CSS inheritance
    document.documentElement.style.setProperty('--app-font-family', selected.family);
    document.documentElement.style.setProperty('--app-arabic-font', selected.arabicFamily);
    document.body.style.fontFamily = selected.family;

    // Remove old font classes and add the active one to body & root
    const allFontClasses = ['font-hind', 'font-noto', 'font-tiro', 'font-anek', 'font-amiri', 'font-scheherazade', 'font-cairo'];
    document.documentElement.classList.remove(...allFontClasses);
    document.body.classList.remove(...allFontClasses);
    document.documentElement.classList.add(selected.className);
    document.body.classList.add(selected.className);

    localStorage.setItem('miniquiz_fontfamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const sizeMap = {
      normal: '100%',
      medium: '108%',
      large: '116%',
    };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '100%';
    localStorage.setItem('miniquiz_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('miniquiz_showharakat', String(showHarakat));
  }, [showHarakat]);

  // Robust session management strictly handled by Supabase Auth
  useEffect(() => {
    let isMounted = true;

    // 1. Initial session check on mount via supabase.auth.getSession
    supabaseGetSession().then(async (session) => {
      if (!isMounted) return;
      if (session?.user) {
        // Synchronize the profile once upon successful authentication
        const synced = await syncUserProfileFromSupabase(session.user);
        if (synced && isMounted) {
          saveUserProfile(
            synced.full_name,
            synced.phone,
            synced.avatar_url,
            true,
            synced.email
          );
          window.dispatchEvent(new Event('tamreen_profile_updated'));
          window.dispatchEvent(new Event('tamreen_auth_status_changed'));
        }
      }
    });

    // 2. Continuous session management via supabase.auth.onAuthStateChange
    const unsubscribe = supabaseOnAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (
        session?.user &&
        (event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED')
      ) {
        const synced = await syncUserProfileFromSupabase(session.user);
        if (synced && isMounted) {
          saveUserProfile(
            synced.full_name,
            synced.phone,
            synced.avatar_url,
            true,
            synced.email
          );
          window.dispatchEvent(new Event('tamreen_profile_updated'));
          window.dispatchEvent(new Event('tamreen_auth_status_changed'));
        }
      } else if (event === 'SIGNED_OUT') {
        clearUserProfile();
        setQuizResult(null);
        setCurrentPage('home');
        setActiveTab('home');
        setShowProfileModal(false);
      }
    });

    // 3. Listen to auth changes and broadcast logout
    const handleAuthChange = () => {
      const isReg = isUserRegistered();
      if (!isReg) {
        setQuizResult(null);
        setShowProfileModal(false);
        setCurrentPage((prev) => (prev === 'profile' ? 'home' : prev));
        setActiveTab((prev) => (prev === 'profile' ? 'home' : prev));
      }
    };
    window.addEventListener('tamreen_auth_status_changed', handleAuthChange);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('tamreen_auth_status_changed', handleAuthChange);
    };
  }, []);

  // Listen to profile updates & exam completion to keep studentStats in sync
  useEffect(() => {
    // Initial sync of completed exams from Supabase
    fetchUserCompletedExamsFromSupabase().catch(() => {});

    const handleSyncStats = () => {
      setStudentStats(getStudentStats());
      fetchUserCompletedExamsFromSupabase().catch(() => {});
    };
    window.addEventListener('tamreen_profile_updated', handleSyncStats);
    window.addEventListener('tamreen_exam_completed', handleSyncStats);
    return () => {
      window.removeEventListener('tamreen_profile_updated', handleSyncStats);
      window.removeEventListener('tamreen_exam_completed', handleSyncStats);
    };
  }, []);

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

  // Realtime subscribe to database/local changes of exams/questions
  useEffect(() => {
    const unsubscribe = subscribeToExamsAndQuestionsTable(() => {
      loadQuestions();
    });
    return () => {
      unsubscribe();
    };
  }, [loadQuestions]);

  // Deep Link support: Auto-detect /q/:slug or ?q=... or ?exam=... in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const qParam = urlParams.get('q');
    const examQuery = urlParams.get('exam') || urlParams.get('examId') || urlParams.get('test');

    if (pathname.startsWith('/q/')) {
      const slug = pathname.replace('/q/', '').trim();
      if (slug) {
        setActiveQuestionSlug(slug);
        setCurrentPage('question_detail');
      }
    } else if (qParam) {
      setActiveQuestionSlug(qParam);
      setCurrentPage('question_detail');
    }

    if (examQuery) {
      fetchExamsFromSupabase().then((res) => {
        const examsList = res.exams || [];
        const found = examsList.find(
          (e) => e.id === examQuery || e.title === examQuery || e.subject === examQuery
        );

        if (found) {
          setSharedExamData({
            examId: found.id,
            title: found.title,
            subject: found.subject,
            category: found.subject.includes('বাংলা') ? 'BENGALI LESSON' : 'EXAM LESSON',
            instructor: 'প্রভাষক আরবি',
            institution: 'আত-তামরীন একাডেমি',
            timeMinutes: found.time_minutes || 5,
            questionCount: found.question_count || 20,
            negativeMark: '-০.২৫',
          });
        } else {
          setSharedExamData({
            examId: examQuery,
            title: examQuery,
            subject: examQuery,
            category: examQuery.includes('বাংলা') ? 'BENGALI LESSON' : 'EXAM LESSON',
            instructor: 'প্রভাষক আরবি',
            institution: 'আত-তামরীন একাডেমি',
            timeMinutes: 5,
            questionCount: 20,
            negativeMark: '-০.২৫',
          });
        }
      });
    }
  }, []);

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
      } else if (e.state && e.state.examInProgress) {
        setCurrentPage('practice');
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
    // Count only questions where an option was selected but was incorrect
    const wrongCount = userAnswers.filter((a) => a.selectedOption !== null && !a.isCorrect).length;
    const negativeMarks = Number((wrongCount * 0.25).toFixed(2));
    const calculatedScore = Math.max(0, Number((correctCount - negativeMarks).toFixed(2)));
    const finalScore = wrongCount > 0 ? calculatedScore : correctCount;
    const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

    const examId = activeExamId || selectedSubject || 'general';
    const examTitle = activeExamTitle || (typeof activeExamId === 'string' && activeExamId !== selectedSubject ? activeExamId : selectedSubject) || 'বাংলা মডেল টেস্ট';

    const result: QuizResult = {
      totalQuestions,
      correctCount,
      wrongCount,
      score: finalScore,
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

    // Increment user total exams count
    incrementTotalExamsCount();

    // Create & save Leaderboard Entry & Exam Result
    const userProfile = getUserProfile();
    const isRegistered = isUserRegistered();
    const rawName = userProfile?.name?.trim();
    const isGuest = !isRegistered;
    const effectiveName = rawName || (isRegistered ? 'শিক্ষার্থী' : 'গেস্ট পরীক্ষার্থী');
    const guestName = isGuest ? effectiveName : undefined;
    const userAvatar = userProfile?.avatar;
    const userRoll = userProfile?.roll_number || userProfile?.student_id || (isRegistered ? getUserRollNumber(userProfile?.phone) : undefined);
    const authUuid = (userProfile as any)?.id;
    const userId = isRegistered 
      ? (authUuid || userRoll || getUserUniqueId()) 
      : `guest_${(rawName || 'guest').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const isFreeExam = !String(activeExamId || '').toLowerCase().includes('paid');

    const entry: LeaderboardEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exam_id: examId,
      exam_title: examTitle,
      user_id: userId,
      user_name: effectiveName,
      guest_name: guestName,
      full_name: effectiveName,
      is_guest: isGuest,
      user_avatar: userAvatar,
      score: finalScore,
      total_questions: totalQuestions,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy: percentage,
      created_at: new Date().toISOString(),
      roll_number: userRoll,
      student_id: userRoll,
    };

    saveLeaderboardEntryToSupabase(entry);

    // Also persist structured exam result to Supabase exam_results & profiles
    submitExamResultToSupabase({
      exam_id: examId,
      exam_title: examTitle,
      is_free: isFreeExam,
      user_id: userId,
      full_name: effectiveName,
      guest_name: guestName,
      is_guest: isGuest,
      avatar_url: userAvatar,
      score: finalScore,
      total_marks: totalQuestions,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      time_taken_seconds: timeTakenSeconds,
      submitted_at: entry.created_at,
      roll_number: userRoll,
      student_id: userRoll,
    } as any).then((res) => {
      // Mark specific active exam as completed and persist result
      if (activeExamId) {
        addCompletedExamId(activeExamId);
        saveExamResult(activeExamId, result);
      }
      if (activeExamTitle) {
        addCompletedExamId(activeExamTitle);
        saveExamResult(activeExamTitle, result);
      }
      if (selectedSubject) {
        saveExamResult(selectedSubject, result);
      }
      saveExamResult('latest_exam_result', result);

      // Save to real full exam history and wrong answers bank
      saveExamToHistory(result);
      saveWrongAnswersFromQuiz(result);

      const updatedStats = saveQuizResultToStats(correctCount, totalQuestions);
      setStudentStats(updatedStats);

      // Redirect to Leaderboard Page upon successful insert
      handleOpenLeaderboard(examId);
    });
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

  const handleStartPractice = (subjectOrOpts: string | { subject: string; topic?: string; questionCount?: number; timeMinutes?: number; examId?: string; examType?: string } = 'সকল বিষয়') => {
    // Unique Attempt Isolation: Completely reset quiz result state on clicking/starting any exam
    setQuizResult(null);

    if (typeof subjectOrOpts === 'string') {
      setSelectedSubject(subjectOrOpts);
      setSelectedTopic(undefined);
      setExamQuestionCount(undefined);
      setExamTimeMinutes(30);
      setActiveExamId(undefined);
      setActiveExamTitle(subjectOrOpts);
    } else {
      setSelectedSubject(subjectOrOpts.subject);
      setSelectedTopic(subjectOrOpts.topic);
      setExamQuestionCount(subjectOrOpts.questionCount);
      setExamTimeMinutes(subjectOrOpts.timeMinutes || 30);
      const eId = subjectOrOpts.examId;
      const eType = subjectOrOpts.examType;
      setActiveExamId(eId || eType);
      const title = subjectOrOpts.topic
        ? `${subjectOrOpts.subject} (${subjectOrOpts.topic})`
        : (eType || subjectOrOpts.subject);
      setActiveExamTitle(title);
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
        onOpenProfile={() => navigateWithHistory('profile')}
        onOpenLogin={() => setShowAuthModal(true)}
        onOpenLeaderboard={handleOpenLeaderboard}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-12">
        {currentPage === 'question_detail' && activeQuestionSlug && (
          <QuestionDetailPage
            slugOrId={activeQuestionSlug}
            onNavigateHome={handleNavigateHome}
            onStartPractice={(subject, topic) => {
              if (subject) setSelectedSubject(subject);
              if (topic) setSelectedTopic(topic);
              setCurrentPage('practice');
            }}
            showHarakat={showHarakat}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            onNavigateHome={handleNavigateHome}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenCourses={() => {
              setCurrentPage('home');
              setActiveTab('courses');
            }}
            onStartPractice={(subject?: string, topic?: string) => {
              if (subject) setSelectedSubject(subject);
              if (topic) setSelectedTopic(topic);
              setCurrentPage('practice');
            }}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            fontFamily={fontFamily}
            onChangeFontFamily={setFontFamily}
            showHarakat={showHarakat}
            onChangeShowHarakat={setShowHarakat}
          />
        )}

        {currentPage === 'practice' && (
          <PracticePage
            questions={questions}
            initialSubject={selectedSubject}
            initialTopic={selectedTopic}
            targetQuestionCount={examQuestionCount}
            timeMinutes={examTimeMinutes}
            examId={activeExamId}
            examTitle={activeExamTitle}
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
            onReviewAnswers={(opts) => handleReviewAnswers(opts)}
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
                onStartExam={(opts) => {
                  // If opening an entrance preview, show the card or start directly
                  handleStartPractice(opts);
                }}
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

            {(activeTab === 'blogs' || (activeTab as any) === 'circulars') && (
              <BlogPage searchQuery={searchQuery} />
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

      {/* Big Card Landing Modal for Shared Exam Links */}
      {sharedExamData && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
          onClick={() => setSharedExamData(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
            <SharedExamEntranceCard
              examId={sharedExamData.examId}
              title={sharedExamData.title}
              subject={sharedExamData.subject}
              category={sharedExamData.category}
              instructor={sharedExamData.instructor}
              institution={sharedExamData.institution}
              timeMinutes={sharedExamData.timeMinutes}
              questionCount={sharedExamData.questionCount}
              negativeMark={sharedExamData.negativeMark}
              onClose={() => setSharedExamData(null)}
              onReviewAnswers={() => {
                const targetExam = sharedExamData;
                setSharedExamData(null);
                handleReviewAnswers({
                  subject: targetExam.subject || 'সকল বিষয়',
                  examId: targetExam.examId,
                  examType: targetExam.title,
                  timeMinutes: targetExam.timeMinutes || 5,
                  questionCount: targetExam.questionCount || 20,
                });
              }}
              onOpenLeaderboard={() => {
                const targetExam = sharedExamData;
                setSharedExamData(null);
                handleOpenLeaderboard(targetExam.examId || targetExam.title);
              }}
              onStartExam={(studentName) => {
                const targetExam = sharedExamData;
                setSharedExamData(null);
                handleStartPractice({
                  subject: targetExam.subject || 'সকল বিষয়',
                  examId: targetExam.examId,
                  examType: targetExam.title,
                  timeMinutes: targetExam.timeMinutes || 5,
                  questionCount: targetExam.questionCount || 20,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Registration Prompt Modal for Locked / Study Tabs */}
      <RegistrationPromptModal
        isOpen={showRegPromptModal}
        onClose={() => {
          setShowRegPromptModal(false);
          setPendingTabAfterAuth(null);
        }}
        onConfirm={() => {
          setShowRegPromptModal(false);
          setShowAuthModal(true);
        }}
      />

      {/* Primary Authentication & Registration Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
        }}
        initialMode="login"
        onAuthSuccess={(profile) => {
          setShowAuthModal(false);
          if (pendingTabAfterAuth) {
            navigateWithHistory('home', pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          }
        }}
      />

      {/* Direct Exam Access Registration Modal */}
      <UserRegistrationModal
        isOpen={showDirectRegModal}
        onClose={() => {
          setShowDirectRegModal(false);
          setPendingDirectExamOpts(null);
        }}
        initialMode="register"
        title="পরীক্ষা শুরু করতে অ্যাকাউন্ট তৈরি করুন"
        onSaveSuccess={(profile: UserProfile) => {
          setShowDirectRegModal(false);
          if (pendingDirectExamOpts) {
            handleStartPractice(pendingDirectExamOpts);
            setPendingDirectExamOpts(null);
          }
        }}
      />

      {/* Bottom Neumorphic Sticky Nav Bar */}
      {currentPage !== 'practice' && !showAuthModal && !showDirectRegModal && !showRegPromptModal && !sharedExamData && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadCircularsCount={3}
        />
      )}
    </div>
  );
}


