import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { CourseModule } from '../types';

interface CoursesPageProps {
  onSelectCourse?: (courseId: string) => void;
}

const INITIAL_COURSES: CourseModule[] = [
  {
    id: 'assistant_moulvi_subjective',
    title: 'সহকারী মৌলভী সাবজেক্টিভ কোর্স',
    category: 'assistant_moulvi',
    badge: 'রেকর্ড ব্যাচ',
    badgeSub: 'সহকারী মৌলভী...',
    classesCount: 36,
    sheetsCount: 36,
    examsCount: 20,
    isEnrolled: true,
    accentColor: 'emerald',
    enrolledCount: '1280',
    price: '৮৫০',
    topics: [
      'আল কুরআন, তাফসির ও সিহাহ সিত্তা',
      'ফিকহ ও উসুলুল ফিকহ স্পেশাল নোট',
      '৩৬টি এক্সক্লুসিভ পিডিএফ হ্যান্ডনোট',
      '২০টি লাইভ ও আর্কাইভ সলভ পরীক্ষা'
    ]
  },
  {
    id: 'arabic_lecturer_subjective',
    title: 'আরবি প্রভাষক সাবজেক্টিভ কোর্স',
    category: 'arabic_lecturer',
    badge: 'রেকর্ড ব্যাচ',
    badgeSub: 'আরবি প্রভাষক...',
    classesCount: 42,
    sheetsCount: 45,
    examsCount: 30,
    isEnrolled: false,
    accentColor: 'purple',
    enrolledCount: '722',
    price: '৯৫০',
    topics: [
      '৪২টি হাই-ডেফিনিশন সাবজেক্টিভ ক্লাস',
      'আরবি সাহিত্য, বালাগাত ও মানতিক',
      '৪৫টি মাস্টার লেকচার শিট ও হ্যান্ডনোট',
      '৩০টি বিসিএস ও প্রভাষক আদলে পরীক্ষা'
    ]
  },
  {
    id: 'ebtedayi_qari_course',
    title: 'ইবতেদায়ী মৌলবি ও কারী শিক্ষক কোর্স',
    category: 'ebtedayi',
    badge: 'ফ্রি এক্সাম ব্যাচ',
    badgeSub: 'ইবতেদায়ী মৌলবি ...',
    classesCount: 28,
    sheetsCount: 25,
    examsCount: 18,
    isEnrolled: false,
    accentColor: 'amber',
    enrolledCount: '1850',
    price: '৫০০',
    topics: [
      'তাজবিদ ও কেরাত বিশেষ প্রশ্নব্যাংক',
      'উসুলুত তাফসির ও আরবি ব্যাকরণ',
      '২৫টি স্পেশাল হ্যান্ডনোট লেকচার শিট',
      '১৮টি পূর্ণাঙ্গ সলভ মডেল টেস্ট'
    ]
  },
  {
    id: 'general_master_course',
    title: 'জেনারেল সাবজেক্ট মাস্টারকোর্স (বাংলা, ইংরেজি, গণিত)',
    category: 'general',
    badge: 'রেকর্ড ব্যাচ',
    badgeSub: 'জেনারেল সাবজেক্ট...',
    classesCount: 40,
    sheetsCount: 40,
    examsCount: 25,
    isEnrolled: false,
    accentColor: 'purple',
    enrolledCount: '3400',
    price: '৬৫০',
    topics: [
      'বাংলা ব্যাকরণ ও সাহিত্য মাস্টার ক্লাস',
      'English Grammar & Vocabulary Shortcut',
      'গাণিতিক যুক্তি ও সাধারণ জ্ঞান শিট',
      '২৫টি এক্সক্লুসিভ রিয়েল এক্সাম'
    ]
  },
  {
    id: 'ebtedayi_qari_batch1',
    title: 'ইবতেদায়ি ক্বারী এক্সাম ব্যাচ-১',
    category: 'ebtedayi',
    badge: 'এক্সাম ব্যাচ-১',
    badgeSub: 'ইবতেদায়ী কারী',
    classesCount: 0,
    sheetsCount: 30,
    examsCount: 30,
    isEnrolled: true,
    accentColor: 'emerald',
    enrolledCount: '920',
    price: '৪৫০',
    topics: [
      '৩০টি স্পেশাল লেকচার শিট',
      '৩০টি বিষয়ভিত্তিক ও পূর্ণাঙ্গ মডেল টেস্ট',
      'মেরিট পজিশন ও নেগেটিভ মার্কিং এনালাইসিস'
    ]
  },
  {
    id: 'assistant_moulvi_batch1',
    title: 'সহকারী মৌলভী এক্সাম ব্যাচ- ১',
    category: 'assistant_moulvi',
    badge: 'এক্সাম ব্যাচ-১',
    badgeSub: 'সহকারী মৌলভী',
    classesCount: 15,
    sheetsCount: 36,
    examsCount: 34,
    isEnrolled: false,
    accentColor: 'amber',
    enrolledCount: '1450',
    price: '৫৫০',
    topics: [
      '১৫টি স্পেশাল গাইডেন্স ও সলভ ক্লাস',
      '৩৬টি পিডিএফ হ্যান্ডনোট শিট',
      '৩৪টি সরাসরি ও আর্কাইভ পরীক্ষা'
    ]
  },
  {
    id: 'arabic_lecturer_batch1',
    title: 'আরবি প্রভাষক এক্সাম ব্যাচ- ১',
    category: 'arabic_lecturer',
    badge: 'এক্সাম ব্যাচ-১',
    badgeSub: 'আরবি প্রভাষক',
    classesCount: 20,
    sheetsCount: 25,
    examsCount: 30,
    isEnrolled: false,
    accentColor: 'purple',
    enrolledCount: '2150',
    price: '৬৫০',
    topics: [
      '২০টি সলভ ও প্রাকটিস ক্লাস',
      '২৫টি বিশেষ হ্যান্ডনোট শিট',
      '৩০টি পূর্ণাঙ্গ মেগা মডেল টেস্ট'
    ]
  }
];

export const CoursesPage: React.FC<CoursesPageProps> = ({ onSelectCourse }) => {
  const [courses, setCourses] = useState<CourseModule[]>(INITIAL_COURSES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCourseModal, setActiveCourseModal] = useState<CourseModule | null>(null);

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
    : courses.filter((c) => c.category === selectedCategory);

  const handleEnrollCourse = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true, accentColor: 'emerald' } : c))
    );
    if (activeCourseModal && activeCourseModal.id === courseId) {
      setActiveCourseModal({ ...activeCourseModal, isEnrolled: true, accentColor: 'emerald' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 mb-28 space-y-5">
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
          <span className="text-[11px] sm:text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full">
            {filteredCourses.length}টি কোর্স সহজলভ্য
          </span>
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

      {/* Course Cards List (Neumorphic Style matching Screenshot) */}
      <div className="space-y-3">
        {filteredCourses.map((course) => {
          const isEnrolled = course.isEnrolled;

          // Determine border accent line based on status / accent color
          const borderAccentClass = isEnrolled
            ? 'border-l-[5px] border-l-[#046A38]'
            : course.accentColor === 'amber'
            ? 'border-l-[5px] border-l-amber-500'
            : 'border-l-[5px] border-l-purple-600';

          return (
            <div
              key={course.id}
              className={`neu-card rounded-2xl p-2.5 sm:p-3 transition-all flex flex-row items-center justify-between gap-2.5 sm:gap-3.5 ${borderAccentClass}`}
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
                  <h3 className="text-xs sm:text-base font-black text-[#0B132B] dark:text-white leading-tight truncate">
                    {course.title}
                  </h3>

                  {/* Enrolled Students Pill (Only for Unenrolled Courses) */}
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
                      {/* Enrolled View Buttons */}
                      <div className="px-2.5 py-0.5 rounded-lg bg-[#E8F8F5] dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>ভর্তি সম্পন্ন</span>
                      </div>

                      <button
                        onClick={() => {
                          if (onSelectCourse) {
                            onSelectCourse(course.id);
                          } else {
                            setActiveCourseModal(course);
                          }
                        }}
                        className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>প্রবেশ করুন</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Unenrolled View Price & Details Button */}
                      <div className="text-xs sm:text-base font-black text-[#0B132B] dark:text-white">
                        ৳{course.price || '৯৫০'}
                      </div>

                      <button
                        onClick={() => setActiveCourseModal(course)}
                        className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-[#0D1930] hover:bg-[#16274a] text-white text-[10px] sm:text-xs font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        বিস্তারিত
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                    এখনই ভর্তি হন (৳{activeCourseModal.price || '৯৫০'})
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
