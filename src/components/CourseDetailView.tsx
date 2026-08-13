import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { CourseModule, CourseEnrollmentRecord } from '../types';
import { CourseEnrollmentModal } from './CourseEnrollmentModal';

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDownload = (fileName: string) => {
    showToast(`${fileName} ডাউনলোড সম্পন্ন হয়েছে!`);
  };

  const handleTriggerEnroll = () => {
    setShowEnrollModal(true);
  };

  const handleEnrollSuccess = (enrollment: CourseEnrollmentRecord) => {
    showToast('ভর্তি আবেদন জমা সফল—পেমেন্ট যাচাই করা হচ্ছে!');
    onEnroll(course.id);
  };

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
            <span>{course.badge || 'রেকর্ডেড ব্যাচ'}</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#0D281E] border border-emerald-700/60 flex items-center justify-center text-amber-300 shadow-xs">
            <Landmark className="w-5 h-5 text-emerald-300" />
          </div>
        </div>

        {/* Stats Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 relative z-10">
          <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{course.sheetsCount || 45} শিট</span>
          </div>
          <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{course.examsCount || 30} পরীক্ষা</span>
          </div>
          <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>৭ ফুল মডেল</span>
          </div>
          <div className="bg-[#0D1930]/80 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span>{course.enrolledCount || '৭২২'} জন</span>
          </div>
        </div>

        {/* Banner Title & Subtitle */}
        <div className="pt-2 border-t border-white/10 relative z-10">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-300 mt-1 flex items-center gap-1">
            <span>৯ম শিক্ষক নিয়োগ</span>
            <span>•</span>
            <span className="text-emerald-200">{course.instructor || 'মাওলানা ড. আহমেদ হাসান'}</span>
          </p>
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
          <span>লেকচার শিট</span>
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
          <span>পরীক্ষা</span>
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
            <p className="font-medium">
              {course.title} পদ মূলত এনটিআরসিএ এবং শিক্ষক নিয়োগ পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ কোর্স। এই পদের জন্য একটি পূর্ণাঙ্গ কোর্সে নিচের বিষয়গুলো থাকলে পরীক্ষা ও চাকরি—দুই ক্ষেত্রেই সর্বোচ্চ কার্যকারিতা পাওয়া যাবে।
            </p>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="font-bold text-[#0B132B] dark:text-white text-sm">
                ১. বিষয়ভিত্তিক মূল বিষয়াদি
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-2">
                <li>অধ্যায়ভিত্তিক বিস্তারিত আলোচনা</li>
                <li>বিগত বছরের প্রশ্নের সমাধান</li>
                <li>মাস্টার নোট ও শর্টকাট টিপস</li>
              </ul>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="font-bold text-[#0B132B] dark:text-white text-sm">
                ২. সাধারণ অংশ ও রিভিশন
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-2">
                <li>বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞান</li>
                <li>নমুনা মডেল টেস্ট ও লাইব টেস্ট পর্যালোচনা</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Routine */}
      {activeTab === 'routine' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                কোর্স রুটিন ও সময়সূচি
              </h3>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {course.title}
              </p>
            </div>
          </div>

          {course.isEnrolled ? (
            <button
              onClick={() => handleDownload('কোর্স রুটিন.pdf')}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>রুটিন ডাউনলোড করুন</span>
            </button>
          ) : (
            <button
              onClick={() => onEnroll(course.id)}
              className="w-full py-3 bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:bg-amber-200 cursor-pointer active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>রুটিন ডাউনলোড করুন (লকড)</span>
            </button>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
            <p className="font-medium">
              আপনার <span className="font-bold text-[#0B132B] dark:text-white">{course.title}</span> কোর্স-এর জন্য একটি সুন্দর ও বাস্তবসম্মত ক্লাস ও পরীক্ষার সময়সূচি নিচে দেওয়া হলো।
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="font-bold text-[#0B132B] dark:text-white flex items-center gap-1.5">
                📅 ক্লাসের সময়সূচি
              </p>
              <div className="pl-3 space-y-1 text-slate-600 dark:text-slate-300">
                <p>শনিবার: রাত ৮:০০ – ৯:৩০</p>
                <p>সোমবার: রাত ৮:০০ – ৯:৩০</p>
                <p>বুধবার: রাত ৮:০০ – ৯:৩০</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-1">প্রতি ক্লাসের সময়: ১ ঘণ্টা ৩০ মিনিট</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="font-bold text-[#0B132B] dark:text-white flex items-center gap-1.5">
                📝 পরীক্ষার সময়সূচি
              </p>
              <div className="pl-3 space-y-1 text-slate-600 dark:text-slate-300">
                <p>সাপ্তাহিক কুইজ: প্রতি বৃহস্পতিবার (অনলাইন)</p>
                <p>মাসিক মডেল টেস্ট: প্রতি মাসের শেষ শুক্রবার</p>
                <p>ফাইনাল মডেল পরীক্ষা: কোর্স শেষে পূর্ণাঙ্গ পরীক্ষা</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Syllabus (Exact match to Screenshot 3) */}
      {activeTab === 'syllabus' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                কোর্স সিলেবাস ও নম্বর বণ্টন
              </h3>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {course.title}
              </p>
            </div>
          </div>

          {course.isEnrolled ? (
            <button
              onClick={() => handleDownload('কোর্স সিলেবাস.pdf')}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>সিলেবাস ডাউনলোড করুন</span>
            </button>
          ) : (
            <button
              onClick={() => onEnroll(course.id)}
              className="w-full py-3 bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:bg-amber-200 cursor-pointer active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>সিলেবাস ডাউনলোড করুন</span>
            </button>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
            <p className="font-bold text-[#0B132B] dark:text-white flex items-center gap-1.5">
              📖 {course.title} - সম্পূর্ণ সিলেবাস ও মানবন্টন:
            </p>

            <div className="space-y-1.5 pt-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ১. সাধারণ অংশ (৫০ নম্বর):
              </p>
              <p className="pl-3 text-slate-600 dark:text-slate-400">
                - বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞান।
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ২. বিষয়ভিত্তিক অংশ (৫০ নম্বর):
              </p>
              <p className="pl-3 text-slate-600 dark:text-slate-400">
                - সংশ্লিষ্ট বিষয়ের অধ্যায়ভিত্তিক গুরুত্ব ও প্রস্তুতি নির্দেশনা।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Lecture Sheets (Exact match to Screenshot 1) */}
      {activeTab === 'sheets' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-3 mb-2">
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

          {[
            { name: 'উচ্চতর আরবি সাহিত্য ও বালাগাত নোট.pdf', size: 'PDF Sheet 01' },
            { name: 'তাফসীরে জালালাইন ও বায়জাবী নোট.pdf', size: 'PDF Sheet 02' },
            { name: 'হাদীস শরীফ ও উসূলে হাদীস স্পেশাল.pdf', size: 'PDF Sheet 03' },
            { name: 'ফিকহ ও উসূলে ফিকহ মাস্টার নোট.pdf', size: 'PDF Sheet 04' },
            { name: 'ইসলামী ইতিহাস ও সংস্কৃতি প্রস্তুতি.pdf', size: 'PDF Sheet 05' },
          ].map((sheet, index) => (
            <div
              key={index}
              className="neu-card bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B132B] dark:text-white truncate">
                    {sheet.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {sheet.size}
                  </p>
                </div>
              </div>

              {course.isEnrolled ? (
                <button
                  onClick={() => handleDownload(sheet.name)}
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
          ))}
        </div>
      )}

      {/* Tab 5: Exams (Exact match to Screenshot 2) */}
      {activeTab === 'exams' && (
        <div className="space-y-3">
          {[
            {
              id: 'exam_01',
              title: 'পরীক্ষা ০১',
              topic: 'প্রভাষক আরবি প্রথম পত্র বিশেষ পরীক্ষা',
              date: '১৫ আগস্ট, ২০২৬ (শনিবার)',
              specs: '১০০টি প্রশ্ন • ৬০ মিনিট',
              score: course.isEnrolled ? '10/10' : null
            },
            {
              id: 'exam_02',
              title: 'পরীক্ষা ০২',
              topic: 'তাজবীদ ও কিরাআত মডেল টেস্ট',
              date: '১৮ আগস্ট, ২০২৬ (মঙ্গলবার)',
              specs: '৫০টি প্রশ্ন • ৩০ মিনিট',
              score: null
            },
            {
              id: 'exam_03',
              title: 'পরীক্ষা ০৩',
              topic: 'আরবি ব্যাকরণ ও মাসআলা টেস্ট',
              date: '২২ আগস্ট, ২০২৬ (শনিবার)',
              specs: '৫০টি প্রশ্ন • ৩০ মিনিট',
              score: null
            }
          ].map((exam, idx) => (
            <div
              key={idx}
              className="neu-card bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Badges Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{exam.date}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{exam.specs}</span>
                </div>
              </div>

              {/* Title & Topic Row */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#0B132B] dark:text-white">
                  {exam.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-[#046A38] dark:text-emerald-300 text-xs font-bold">
                    টপিক
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {exam.topic}
                  </span>
                </div>
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
                        examType: exam.topic,
                        questionCount: 50,
                        timeMinutes: 30
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
                        examType: exam.topic
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

              {course.isEnrolled && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic pt-1">
                  * দ্রষ্টব্য: পুনরায় প্র্যাকটিস দিলে নতুন পয়েন্ট যুক্ত হবে না। ১ম চেষ্টার ফলাফল সংরক্ষিত থাকবে।
                </p>
              )}
            </div>
          ))}
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

          {/* Leaderboard Header Banner (Exact match to Screenshot 6) */}
          <div className="bg-gradient-to-r from-[#046A38] to-[#024424] text-white p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                পরীক্ষার বিশেষ মেধা তালিকা - মডেল টেস্ট ১
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                লাইভ মেধা তালিকা • প্রিমিয়াম পরীক্ষায় অংশগ্রহণকারীদের মেধা তালিকা
              </p>
            </div>
          </div>

          {/* Banner Box */}
          <div className="bg-[#046A38]/10 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-2xl text-center">
            <span className="text-xs font-extrabold text-[#046A38] dark:text-emerald-300 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              প্রিমিয়াম পরীক্ষায় অংশগ্রহণকারীদের মেধা তালিকা (বিষয়: মডেল টেস্ট ১)
            </span>
          </div>

          {/* Empty State Card (Exact match to Screenshot 6) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#0B132B] dark:text-white">
                এখনো কোনো পরীক্ষার্থী পরীক্ষা সম্পন্ন করেনি
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                ডিফল্ট তালিকা অপসারণ করা হয়েছে। প্রথম পরীক্ষার্থী হিসেবে আপনি পরীক্ষা দিন এবং মেধা তালিকায় আপনার নাম যুক্ত করুন!
              </p>
            </div>

            <button
              onClick={() => {
                setShowLeaderboardModal(false);
                if (course.isEnrolled) {
                  onStartExam({
                    subject: course.title,
                    examId: 'model_test_1',
                    examType: 'মডেল টেস্ট ১',
                    questionCount: 50,
                    timeMinutes: 30
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
                শিটসহ
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
