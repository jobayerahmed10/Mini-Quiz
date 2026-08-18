import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  GraduationCap,
  SlidersHorizontal,
  BookOpenCheck,
  Scroll,
  Landmark,
  Globe,
  Clock,
  FileText,
  CheckCircle2,
  Check,
  Play,
  ArrowLeft,
  Download,
  Users,
  Award,
  CreditCard,
  FileCheck2,
  Hourglass,
  RefreshCw,
  Crown,
  Lock
} from 'lucide-react';
import { CourseModule, CourseEnrollmentRecord, Question } from '../types';
import { CourseDetailView } from './CourseDetailView';
import { CourseEnrollmentModal } from './CourseEnrollmentModal';
import { formatCoursePrice } from '../lib/utils';
import {
  fetchCoursesFromSupabase,
  fetchEnrollmentsFromSupabase,
  normalizeCourseCategory,
  subscribeToCoursesTable
} from '../lib/supabase';

interface CoursesPageProps {
  questions?: Question[];
  onSelectCourse?: (courseId: string) => void;
  onStartExam?: (opts: { subject: string; questionCount?: number; timeMinutes?: number; examId?: string; examType?: string }) => void;
  onReviewAnswers?: (opts: { examId?: string; subject?: string; examType?: string }) => void;
  onOpenLeaderboard?: (examId?: string) => void;
}

const INITIAL_COURSES: CourseModule[] = [
  {
    id: 'course-arabic-lecturer',
    title: '১৯তম NTRCA প্রভাষক (আরবি) পূর্ণাঙ্গ প্রস্তুতি ব্যাচ',
    subtitle: 'মাদ্রাসা প্রভাষক আরবি লিখিত ও প্রিলিমিনারি স্পেশাল কোর্স',
    category: 'arabic_lecturer',
    badge: 'প্রভাষক',
    badgeSub: 'আরবি প্রভাষক',
    price: '১২০০',
    accentColor: 'emerald',
    enrolledCount: '৩৮৫',
    classesCount: 45,
    sheetsCount: 32,
    examsCount: 20,
    topics: ['আরবি সাহিত্য ও ইতিহাস', 'বালাগাত ও মানতিক', 'নাহু ও সরফ বিশদ আলোচনা', 'বিগত ১০ বছরের প্রশ্ন সমাধান', '২০টি স্পেশাল মডেল টেস্ট'],
    instructor: 'মাওলানা ড. আব্দুল্লাহ আল-মামুন'
  },
  {
    id: 'course-assistant-moulvi',
    title: '১৯তম NTRCA সহকারী মৌলভী পূর্ণাঙ্গ কোর্স',
    subtitle: 'আল হাদিস, উসুলুল হাদিস, ফিকহ ও আরবি ব্যাকরণ স্পেশাল',
    category: 'assistant_moulvi',
    badge: 'সহকারী মৌলভী',
    badgeSub: 'সহকারী মৌলভী',
    price: '১০০০',
    accentColor: 'amber',
    enrolledCount: '৫২০',
    classesCount: 40,
    sheetsCount: 28,
    examsCount: 16,
    topics: ['কুরআন মাজিদ ও তাজবীদ', 'আল-হাদিস ও উসুলুল হাদিস', 'ফিকহ ও উসুলুল ফিকহ', 'আরবি দ্বিতীয় পত্র ব্যাকরণ', 'স্পেশাল রিভিশন মডেল টেস্ট'],
    instructor: 'মাওলানা মুফতি হাবিবুর রহমান'
  },
  {
    id: 'course-ebtedayi',
    title: 'ইবতেদায়ী মৌলবি ও ক্বারী শিক্ষক স্পেশাল কোর্স',
    subtitle: 'ইবতেদায়ী প্রধান ও সহকারী মৌলবি শিক্ষক নিবন্ধন প্রস্তুতি',
    category: 'ebtedayi',
    badge: 'ইবতেদায়ী',
    badgeSub: 'মৌলবি ও ক্বারী',
    price: '৮৫০',
    accentColor: 'amber',
    enrolledCount: '২৯০',
    classesCount: 35,
    sheetsCount: 22,
    examsCount: 12,
    topics: ['আকাইদ ও ফিকহ প্রস্তুতি', 'তাজবীদ ও কিরাত বিশ্লেষণ', 'বাংলা, ইংরেজি ও গণিত বেসিক', 'অধ্যায়ভিত্তিক প্রশ্ন সমাধান'],
    instructor: 'মাওলানা ক্বারী মাহফুজুর রহমান'
  },
  {
    id: 'course-general-subjects',
    title: 'জেনারেল বিষয় (বাংলা, ইংরেজি, গণিত ও জিকে) ক্র্যাশ কোর্স',
    subtitle: 'স্কুল ও কলেজ পর্যায়ের আবশ্যিক ১০০ নম্বরের পূর্ণাঙ্গ প্রস্তুতি',
    category: 'general',
    badge: 'জেনারেল',
    badgeSub: 'আবশ্যিক বিষয়',
    price: '৯৫০',
    accentColor: 'purple',
    enrolledCount: '৭৫০',
    classesCount: 55,
    sheetsCount: 40,
    examsCount: 25,
    topics: ['বাংলা ব্যাকরণ ও সাহিত্য', 'ইংরেজি গ্রামার ও ভোকাবুলারি', 'পাটিগণিত, বীজগণিত ও জ্যামিতি', 'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি', 'সাম্প্রতিক তথ্য ও মডেল টেস্ট'],
    instructor: 'বিশেষজ্ঞ জেনারেল শিক্ষক প্যানেল'
  }
];

export const CoursesPage: React.FC<CoursesPageProps> = ({
  questions = [],
  onSelectCourse,
  onStartExam,
  onReviewAnswers,
  onOpenLeaderboard
}) => {
  const [courses, setCourses] = useState<CourseModule[]>(() => {
    try {
      const raw = localStorage.getItem('tamreen_courses_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_COURSES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCourseModal, setActiveCourseModal] = useState<CourseModule | null>(null);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<CourseModule | null>(null);
  const [enrollmentModalCourse, setEnrollmentModalCourse] = useState<CourseModule | null>(null);
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRemoteCoursesAndEnrollments = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await fetchCoursesFromSupabase();
      const enrollResult = await fetchEnrollmentsFromSupabase();

      const approvedIds = new Set<string>();
      const pendingIds = new Set<string>();

      (enrollResult.enrollments || []).forEach((e) => {
        if (e.status === 'approved') {
          approvedIds.add(e.course_id);
        } else if (e.status === 'pending') {
          pendingIds.add(e.course_id);
        }
      });

      setPendingCourseIds(pendingIds);

      const map = new Map<string, CourseModule>();

      if (result.courses && result.courses.length > 0) {
        result.courses.forEach((c) => {
          const isApproved = approvedIds.has(c.id) || c.isEnrolled;
          const normalizedCategory = normalizeCourseCategory(c.category);
          map.set(c.id, {
            ...c,
            category: normalizedCategory,
            isEnrolled: isApproved,
            accentColor: isApproved ? 'emerald' : c.accentColor
          });
        });
      }

      const updatedList = Array.from(map.values());
      setCourses(updatedList);
      try {
        localStorage.setItem('tamreen_courses_cache', JSON.stringify(updatedList));
      } catch {}

      if (isManualRefresh) {
        showToast(updatedList.length > 0 ? `${updatedList.length}টি কোর্স লোড হয়েছে!` : 'ডাটাবেস রিফ্রেশ সম্পন্ন');
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load courses dynamically from Supabase & Subscribe to Realtime DB updates
  useEffect(() => {
    loadRemoteCoursesAndEnrollments(false);

    // Realtime Supabase table synchronization
    const unsubscribe = subscribeToCoursesTable(() => {
      loadRemoteCoursesAndEnrollments(false);
    });

    // Auto-refresh when tab gains focus (user returns from Admin panel / Supabase)
    const handleFocus = () => {
      loadRemoteCoursesAndEnrollments(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadRemoteCoursesAndEnrollments]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const subjects = [
    {
      id: 'all',
      name: 'সকল বিষয়',
      icon: SlidersHorizontal,
      colorClass: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    },
    {
      id: 'arabic_lecturer',
      name: 'আরবি প্রভাষক',
      icon: BookOpenCheck,
      colorClass: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    },
    {
      id: 'assistant_moulvi',
      name: 'সহকারী মৌলভী',
      icon: Scroll,
      colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
    },
    {
      id: 'ebtedayi',
      name: 'ইবতেদায়ী মৌলবি',
      icon: Landmark,
      colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      id: 'general',
      name: 'জেনারেল বিষয়',
      icon: Globe,
      colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300'
    }
  ];

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter((c) => {
        const norm = normalizeCourseCategory(c.category);
        return c.category === selectedCategory || norm === selectedCategory;
      });

  const handleOpenEnrollment = (course: CourseModule) => {
    setEnrollmentModalCourse(course);
    if (activeCourseModal) setActiveCourseModal(null);
  };

  const handleEnrollmentSuccess = (enrollment: CourseEnrollmentRecord) => {
    setPendingCourseIds((prev) => new Set([...Array.from(prev), enrollment.course_id]));
    showToast('ভর্তি আবেদন জমা সফল—পেমেন্ট যাচাই করা হচ্ছে!');
  };

  const handleEnrollCourse = (courseId: string) => {
    const target = courses.find((c) => c.id === courseId);
    if (target) {
      handleOpenEnrollment(target);
    }
  };

  // If a course detail view is active, render CourseDetailView directly!
  if (selectedCourseForDetail) {
    return (
      <CourseDetailView
        course={selectedCourseForDetail}
        questions={questions}
        onBack={() => setSelectedCourseForDetail(null)}
        onStartExam={(opts) => {
          if (onStartExam) onStartExam(opts);
        }}
        onReviewAnswers={(opts) => {
          if (onReviewAnswers) onReviewAnswers(opts);
        }}
        onOpenLeaderboard={(examId) => {
          if (onOpenLeaderboard) onOpenLeaderboard(examId);
        }}
        onEnroll={(courseId) => handleEnrollCourse(courseId)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 mb-28 space-y-5 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#046A38] text-white px-4 py-2 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-[#046A38] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>তামরীন একাডেমি</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            আমাদের কোর্স সমূহ
          </h1>
        </div>

        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xs text-white rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
          <GraduationCap className="w-6 h-6 text-emerald-100" />
        </div>
      </div>

      {/* Subject Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
            বিষয় নির্বাচন করুন
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadRemoteCoursesAndEnrollments(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer"
              title="সুপাবেজ থেকে রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing || isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিফ্রেশ'}</span>
            </button>

            <span className="text-[11px] sm:text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full">
              {filteredCourses.length}টি কোর্স সহজলভ্য
            </span>
          </div>
        </div>

        {/* Horizontal Scrollable Row of Subject Buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
          {subjects.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedCategory === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedCategory(sub.id)}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer min-w-[100px] sm:min-w-[115px] shrink-0 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${sub.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold ${isSelected ? 'text-[#0B132B] dark:text-white font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                  {sub.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Cards List */}
      <div className="space-y-3">
        {filteredCourses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-[#046A38] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/60">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                বর্তমানে কোনো কোর্স পাওয়া যায়নি
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {selectedCategory !== 'all' 
                  ? 'এই ক্যাটাগরিতে কোনো কোর্স নেই। সকল বিষয় নির্বাচন করে দেখতে পারেন।' 
                  : 'সুপাবেজ ডাটাবেসে নতুন কোর্স যুক্ত হলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।'}
              </p>
            </div>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 bg-[#046A38] hover:bg-[#03522b] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
              >
                সকল কোর্স দেখুন
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map((course) => {
          const isEnrolled = course.isEnrolled;

          const borderAccentClass = isEnrolled
            ? 'border-l-[5px] border-l-[#046A38]'
            : course.accentColor === 'amber'
            ? 'border-l-[5px] border-l-amber-500'
            : 'border-l-[5px] border-l-purple-600';

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourseForDetail(course)}
              className={`neu-card rounded-2xl p-2.5 sm:p-3 transition-all flex flex-row items-center justify-between gap-2.5 sm:gap-3.5 cursor-pointer hover:shadow-md hover:scale-[1.005] active:scale-[0.99] group ${borderAccentClass}`}
            >
              {/* Left Badge Box */}
              <div
                className={`w-24 sm:w-28 shrink-0 rounded-xl p-2 flex flex-col items-center justify-center text-center border self-stretch ${
                  isEnrolled
                    ? 'bg-[#EBF7F2] dark:bg-slate-800/80 border-emerald-100 dark:border-slate-700/50'
                    : 'bg-[#FFFDF2] dark:bg-slate-800/80 border-amber-200/60 dark:border-slate-700/50'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center shadow-2xs mb-1 ${
                    isEnrolled ? 'bg-[#046A38]' : 'bg-[#0D1930]'
                  }`}
                >
                  <Landmark className={`w-3.5 h-3.5 ${isEnrolled ? 'text-emerald-100' : 'text-amber-400'}`} />
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap mb-0.5 text-white ${
                    isEnrolled ? 'bg-[#046A38]' : 'bg-[#0D1930]'
                  }`}
                >
                  {course.badge}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[85px] sm:max-w-[100px] border-b-2 border-emerald-600/70 pb-0.5">
                  {course.badgeSub}
                </span>
              </div>

              {/* Middle & Right Content */}
              <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                <div>
                  <h3 className="text-xs sm:text-base font-black text-[#0B132B] dark:text-white leading-tight truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Enrolled Students Pill */}
                  {!isEnrolled && course.enrolledCount && (
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70">
                      <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>{course.enrolledCount} জন ভর্তি</span>
                    </div>
                  )}

                  {/* Stats Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {course.classesCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {course.classesCount < 10 && course.classesCount > 0
                            ? `0${course.classesCount}`
                            : course.classesCount === 0
                            ? '00'
                            : course.classesCount}{' '}
                          ক্লাস
                        </span>
                      </span>
                    )}
                    {course.sheetsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>{course.sheetsCount} শিট</span>
                      </span>
                    )}
                    {course.examsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                        <span>{course.examsCount} পরীক্ষা</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                  {isEnrolled ? (
                    <>
                      <div className="px-2.5 py-0.5 rounded-lg bg-[#E8F8F5] dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>ভর্তি সম্পন্ন</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourseForDetail(course);
                        }}
                        className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>প্রবেশ করুন</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-xs sm:text-base font-black text-[#0B132B] dark:text-white">
                        {formatCoursePrice(course.price)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEnrollment(course);
                          }}
                          className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white text-[10px] sm:text-xs font-bold cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3 text-amber-300" />
                          <span>ভর্তি হন</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseForDetail(course);
                          }}
                          className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-[#0D1930] hover:bg-[#16274a] text-white text-[10px] sm:text-xs font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          বিস্তারিত
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Course Enrollment Modal */}
      {enrollmentModalCourse && (
        <CourseEnrollmentModal
          course={enrollmentModalCourse}
          onClose={() => setEnrollmentModalCourse(null)}
          onSuccess={handleEnrollmentSuccess}
        />
      )}

      {/* Course Detail Modal */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveCourseModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <span>পিছনে</span>
              </button>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md">
                {activeCourseModal.badge}
              </span>
            </div>

            <h3 className="text-lg font-black text-[#0B132B] dark:text-white">
              {activeCourseModal.title}
            </h3>

            {/* Enrolled Count Pill inside Modal */}
            {activeCourseModal.enrolledCount && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{activeCourseModal.enrolledCount} জন পরীক্ষার্থী ইতোমধ্যে এনরোল করেছেন</span>
              </div>
            )}

            {/* Content Summary */}
            <div className="grid grid-cols-3 gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-center">
              <div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">মোট ক্লাস</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{activeCourseModal.classesCount || '0'}টি</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">লেকচার শিট</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{activeCourseModal.sheetsCount || '0'}টি</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">মডেল টেস্ট</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{activeCourseModal.examsCount || '0'}টি</span>
              </div>
            </div>

            {/* Topics */}
            {activeCourseModal.topics && activeCourseModal.topics.length > 0 && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-[#0B132B] dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>কোর্স ফিচারসমূহ:</span>
                </p>
                {activeCourseModal.topics.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-1">
              {activeCourseModal.isEnrolled ? (
                <>
                  <button
                    onClick={() => {
                      alert('কোর্সের ফ্রি পিডিএফ লেকচার নোট আপনার ডিভাইসে ডাউনলোড শুরু হয়েছে!');
                      setActiveCourseModal(null);
                    }}
                    className="flex-1 py-2.5 bg-[#046A38] hover:bg-[#03522b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    লেকচার শিট ডাউনলোড
                  </button>
                  <button
                    onClick={() => setActiveCourseModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEnrollCourse(activeCourseModal.id)}
                    className="flex-1 py-2.5 bg-[#046A38] hover:bg-[#03522b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    এখনই ভর্তি হন ({formatCoursePrice(activeCourseModal.price)})
                  </button>
                  <button
                    onClick={() => setActiveCourseModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
