import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Landmark,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Calendar,
  Bookmark,
  BookOpen,
  RotateCcw,
  Trophy,
  Download,
  Play,
  X,
  CreditCard,
  Award,
  Lock,
  RefreshCw,
  FolderOpen,
  HelpCircle
} from 'lucide-react';
import { CourseModule, CourseEnrollmentRecord, CourseSheet, CourseExam } from '../types';
import { CourseEnrollmentModal } from './CourseEnrollmentModal';
import {
  fetchCourseSheetsFromSupabase,
  fetchCourseExamsFromSupabase,
  subscribeToCourseDetails
} from '../lib/supabase';

interface CourseDetailViewProps {
  course: CourseModule;
  onBack: () => void;
  onStartExam: (opts: { subject: string; questionCount?: number; timeMinutes?: number; examId?: string; examType?: string }) => void;
  onReviewAnswers: (opts: { examId?: string; subject?: string; examType?: string }) => void;
  onOpenLeaderboard: (examId?: string) => void;
  onEnroll: (courseId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  onBack,
  onStartExam,
  onReviewAnswers,
  onOpenLeaderboard,
  onEnroll
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'routine' | 'syllabus' | 'sheets' | 'exams' | 'leaderboard'>('details');
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Supabase data state
  const [sheets, setSheets] = useState<CourseSheet[]>([]);
  const [exams, setExams] = useState<CourseExam[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);
  const [isLoadingExams, setIsLoadingExams] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoadingSheets(true);
    setIsLoadingExams(true);
    try {
      const [sheetRes, examRes] = await Promise.all([
        fetchCourseSheetsFromSupabase(course.id, course.title),
        fetchCourseExamsFromSupabase(course.id, course.title)
      ]);
      setSheets(sheetRes.sheets || []);
      setExams(examRes.exams || []);
    } catch (e) {
      console.error('Error loading course assets:', e);
    } finally {
      setIsLoadingSheets(false);
      setIsLoadingExams(false);
    }
  }, [course.id, course.title]);

  useEffect(() => {
    loadData();

    // Subscribe to realtime database changes on course_exams, course_sheets, courses
    const unsubscribe = subscribeToCourseDetails(() => {
      loadData();
    });

    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadData]);

  const handleDownload = (fileName: string, fileUrl?: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
      showToast(`${fileName} ডাউনলোড শুরু হয়েছে!`);
    } else {
      showToast(`${fileName} ডাউনলোড শুরু হচ্ছে...`);
    }
  };

  const handleTriggerEnroll = () => {
    setShowEnrollModal(true);
  };

  const handleEnrollSuccess = (_enrollment: CourseEnrollmentRecord) => {
    showToast('ভর্তি আবেদন জমা সফল—পেমেন্ট যাচাই করা হচ্ছে!');
    onEnroll(course.id);
  };

  const sheetsCount = course.sheetsCount && course.sheetsCount > 0 ? course.sheetsCount : sheets.length;
  const examsCount = course.examsCount && course.examsCount > 0 ? course.examsCount : exams.length;
  const classesCount = course.classesCount || 0;
  const enrolledCount = course.enrolledCount || '০';

  return (
    <div className={`max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-fade-in ${!course.isEnrolled ? 'pb-24' : ''}`}>
      {/* Course Enrollment 5-Step Modal */}
      {showEnrollModal && (
        <CourseEnrollmentModal
          course={course}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#046A38] text-white px-4 py-2 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#046A38]" />
          <span>হোমে ফিরুন</span>
        </button>

        {course.isEnrolled ? (
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#E8F8F5] dark:bg-emerald-950/60 text-[#046A38] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs">
            <Check className="w-4 h-4 text-[#046A38] dark:text-emerald-400" />
            <span>ভর্তি সক্রিয়</span>
          </div>
        ) : (
          <button
            onClick={handleTriggerEnroll}
            className="px-4 py-2 rounded-2xl bg-[#046A38] hover:bg-[#03522b] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>ভর্তি হন (৳{course.price || '৯৫০'})</span>
          </button>
        )}
      </div>

      {/* Main Course Banner Header Card */}
      <div className="bg-gradient-to-br from-[#063b22] via-[#046A38] to-[#02331b] rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-emerald-800/50 relative overflow-hidden space-y-4">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
            <span>{course.badge || 'স্পেশাল ব্যাচ'}</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#0D281E] border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
            <Landmark className="w-5 h-5 text-emerald-300" />
          </div>
        </div>

        {/* Stats Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 relative z-10">
          {sheetsCount > 0 && (
            <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sheetsCount} শিট</span>
            </div>
          )}
          {examsCount > 0 && (
            <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{examsCount} পরীক্ষা</span>
            </div>
          )}
          {classesCount > 0 && (
            <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{classesCount} ক্লাস</span>
            </div>
          )}
          <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>{enrolledCount} জন</span>
          </div>
        </div>

        {/* Banner Title & Subtitle */}
        <div className="pt-2 border-t border-white/10 relative z-10">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {course.title}
          </h1>
          {course.instructor ? (
            <p className="text-xs sm:text-sm font-bold text-amber-300 mt-1 flex items-center gap-1.5">
              <span>প্রভাষক/উস্তাদ:</span>
              <span className="text-emerald-200">{course.instructor}</span>
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-medium text-emerald-200 mt-1">
              {course.badgeSub || 'এনটিআরসিএ ও শিক্ষক নিয়োগ প্রস্তুতি ব্যাচ'}
            </p>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'details'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>কোর্স সম্পর্কে বিস্তারিত</span>
        </button>

        <button
          onClick={() => setActiveTab('routine')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'routine'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>রুটিন</span>
        </button>

        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'syllabus'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>সিলেবাস</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'sheets'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>লেকচার শিট {sheets.length > 0 ? `(${sheets.length})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'exams'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>পরীক্ষা {exams.length > 0 ? `(${exams.length})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-[#046A38] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>লিডারবোর্ড</span>
        </button>
      </div>

      {/* Tab Content Display Area */}

      {/* Tab 1: Details */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] dark:bg-emerald-950/60 text-[#046A38] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                কোর্স সম্পর্কে বিস্তারিত
              </h3>
              <p className="text-xs font-bold text-[#046A38] dark:text-emerald-400">
                {course.title}
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
            {/* Quick Specs Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">কোর্স ধরণ</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{course.badge || 'স্পেশাল ব্যাচ'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">প্রভাষক/উস্তাদ</span>
                <span className="font-bold text-[#046A38] dark:text-emerald-400">{course.instructor || 'অভিজ্ঞ প্যানেল'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">ভর্তি ফি</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">৳{course.price || '০'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">মোট ক্লাস</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{classesCount}টি</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">লেকচার শিট</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sheetsCount}টি</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">মডেল টেস্ট/পরীক্ষা</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{examsCount}টি</span>
              </div>
            </div>

            {course.subtitle && (
              <p className="font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                {course.subtitle}
              </p>
            )}

            {course.description && (
              <div className="whitespace-pre-line leading-relaxed bg-white dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {course.description}
              </div>
            )}

            {course.topics && course.topics.length > 0 && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">মূল আলোচ্য বিষয়সমূহ:</p>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-2">
                  {course.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Routine */}
      {activeTab === 'routine' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {course.routine ? (
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
              {Array.isArray(course.routine) ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {course.routine.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              ) : (
                <div className="whitespace-pre-line leading-relaxed">{course.routine}</div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm space-y-2">
              <Calendar className="w-8 h-8 mx-auto opacity-40" />
              <p>রুটিন শীঘ্রই আপডেট করা হবে</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Syllabus */}
      {activeTab === 'syllabus' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {course.syllabus ? (
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
              {Array.isArray(course.syllabus) ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {course.syllabus.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              ) : (
                <div className="whitespace-pre-line leading-relaxed">{course.syllabus}</div>
              )}
            </div>
          ) : course.topics && course.topics.length > 0 ? (
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {course.topics.map((topic, idx) => (
                  <li key={idx}>{topic}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm space-y-2">
              <Bookmark className="w-8 h-8 mx-auto opacity-40" />
              <p>সিলেবাস শীঘ্রই আপডেট করা হবে</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Lecture Sheets */}
      {activeTab === 'sheets' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] dark:bg-emerald-950/60 text-[#046A38] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                  লেকচার শিট ও পিডিএফ নোট
                </h3>
                <p className="text-xs font-bold text-[#046A38] dark:text-emerald-400">
                  {course.title}
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={isLoadingSheets}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {isLoadingSheets ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">
              লেকচার শিট লোড হচ্ছে...
            </div>
          ) : sheets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-40" />
              <p>লেকচার শিট শীঘ্রই আপডেট করা হবে</p>
            </div>
          ) : (
            sheets.map((sheet, index) => (
              <div
                key={sheet.id || index}
                className="neu-card bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#0B132B] dark:text-white truncate">
                      {sheet.title || sheet.name || `লেকচার শিট ${index + 1}`}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {sheet.size || 'PDF Sheet'}
                    </p>
                  </div>
                </div>

                {course.isEnrolled ? (
                  <button
                    onClick={() => handleDownload(sheet.title || sheet.name || 'লেকচার শিট.pdf', sheet.file_url)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডাউনলোড</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onEnroll(course.id)}
                    className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
                    title="কোর্সে ভর্তি হয়ে আনলক করুন"
                  >
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#0B132B] dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
              <span>কোর্স মডেল টেস্ট ও পরীক্ষা তালিকা</span>
            </h3>
            <button
              onClick={loadData}
              disabled={isLoadingExams}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExams ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {isLoadingExams ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              পরীক্ষা তালিকা লোড হচ্ছে...
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl py-12 px-4 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 opacity-40" />
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                পরীক্ষা শীঘ্রই আপডেট করা হবে
              </p>
            </div>
          ) : (
            exams.map((exam, idx) => (
              <div
                key={exam.id || idx}
                className="neu-card bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Badges Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {exam.date && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{exam.date}</span>
                    </div>
                  )}

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{exam.specs || `${exam.question_count || 50}টি প্রশ্ন • ${exam.time_minutes || 30} মিনিট`}</span>
                  </div>
                </div>

                {/* Title & Topic Row */}
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                    {exam.title}
                  </h3>
                  {exam.topic && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-[#046A38] dark:text-emerald-300 text-xs font-bold">
                        টপিক
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {exam.topic}
                      </span>
                    </div>
                  )}
                </div>

                {!course.isEnrolled ? (
                  <div className="space-y-3 pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>লকড</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">কোর্সে ভর্তি হয়ে পরীক্ষাটি আনলক করুন</span>
                      </div>

                      <button
                        onClick={() => onEnroll(course.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                      >
                        আনলক করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons Row (When enrolled) */
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() =>
                        onStartExam({
                          subject: course.title,
                          examId: exam.id,
                          examType: exam.topic || exam.title,
                          questionCount: exam.question_count || 50,
                          timeMinutes: exam.time_minutes || 30
                        })
                      }
                      className="py-2 px-2.5 rounded-xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>প্র্যাকটিস</span>
                    </button>

                    <button
                      onClick={() =>
                        onReviewAnswers({
                          examId: exam.id,
                          subject: course.title,
                          examType: exam.topic || exam.title
                        })
                      }
                      className="py-2 px-2.5 rounded-xl border border-sky-300/80 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 hover:bg-sky-100 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>উত্তরমালা</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowLeaderboardModal(true);
                      }}
                      className="py-2 px-2.5 rounded-xl border border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>মেধা তালিকা</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 6: Leaderboard Section */}
      {(activeTab === 'leaderboard' || showLeaderboardModal) && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative">
          {showLeaderboardModal && (
            <button
              onClick={() => setShowLeaderboardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Leaderboard Header Banner */}
          <div className="bg-gradient-to-r from-[#046A38] to-[#024424] text-white p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                {course.title} - মেধা তালিকা
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                লাইভ মেধা তালিকা • পরীক্ষায় অংশগ্রহণকারীদের ফলাফল ও র‍্যাংকিং
              </p>
            </div>
          </div>

          {/* Empty State Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#0B132B] dark:text-white">
                এখনো কোনো পরীক্ষার্থী পরীক্ষা সম্পন্ন করেনি
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                প্রথম পরীক্ষার্থী হিসেবে আপনি পরীক্ষা সম্পন্ন করে মেধা তালিকায় নাম যুক্ত করুন!
              </p>
            </div>

            {exams.length > 0 && (
              <button
                onClick={() => {
                  setShowLeaderboardModal(false);
                  if (course.isEnrolled) {
                    onStartExam({
                      subject: course.title,
                      examId: exams[0].id,
                      examType: exams[0].topic || exams[0].title,
                      questionCount: exams[0].question_count || 50,
                      timeMinutes: exams[0].time_minutes || 30
                    });
                  } else {
                    onEnroll(course.id);
                  }
                }}
                className="px-6 py-2.5 rounded-2xl bg-[#046A38] hover:bg-[#03522b] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{course.isEnrolled ? 'এখনই পরীক্ষা দিন' : 'ভর্তি হয়ে পরীক্ষা দিন'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating/Fixed Bottom Enrollment Bar for Unenrolled State */}
      {!course.isEnrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:px-6 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-[#0B132B] dark:text-white">
                ৳{course.price || '৯৫০'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                কোর্স ফি
              </span>
            </div>

            <button
              onClick={handleTriggerEnroll}
              className="px-5 py-2.5 rounded-xl bg-[#0D1930] hover:bg-[#16274a] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>ভর্তি হন</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
