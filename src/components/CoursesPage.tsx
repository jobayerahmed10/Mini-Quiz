import React, { useState } from 'react';
import { BookOpen, GraduationCap, Clock, Award, CheckCircle2, ChevronRight, FileText, Download, Sparkles, Filter } from 'lucide-react';
import { CourseModule } from '../types';

interface CoursesPageProps {
  onSelectCourse?: (courseId: string) => void;
}

const COURSES_DATA: CourseModule[] = [
  {
    id: 'madrasa_special',
    title: 'মাদ্রাসা শিক্ষক নিবন্ধন ১০০% স্পেশাল কোর্স',
    subtitle: 'ইবতেদায়ী, দাখিল, আলিম ও মৌলভী পদের জন্য বিশেষ প্রস্তুতি',
    category: 'মাদ্রাসা স্পেশাল',
    duration: '৪৫ দিন',
    lessonsCount: 48,
    enrolledCount: '১২,৪৫০+ পরীক্ষার্থী',
    rating: 4.9,
    iconName: 'BookOpen',
    badge: 'সর্বোচ্চ জনপ্রিয়',
    topics: [
      'আল কুরআন ও উসুলুত তাফসির নোটস',
      'সিহাহ সিত্তা ও উসুলুল হাদিস শটকাট',
      'চার মাযহাবের ফিকহ ও উসুলুল ফিকহ',
      'আরবি ব্যাকরণ (নাহু ও সরফ) স্পেশাল ট্রিকস',
      'আকিদা ও ইসলামী বিশ্বকোষ'
    ],
    pdfAvailable: true,
  },
  {
    id: 'prelim_crash',
    title: '১৯তম NTRCA প্রিলিমিনারি ১০০ মার্কস ক্র্যাশ কোর্স',
    subtitle: 'বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞান সম্পূর্ণ সিলেবাস কাভারেজ',
    category: 'সাধারণ সিলেবাস',
    duration: '৬০ দিন',
    lessonsCount: 65,
    enrolledCount: '১৮,২০০+ পরীক্ষার্থী',
    rating: 4.8,
    iconName: 'GraduationCap',
    badge: 'পূর্ণাঙ্গ সিলেবাস',
    topics: [
      'বাংলা ব্যাকরণ ও ২৫ নম্বর রিভিশন',
      'English Grammar & Vocabulary (25 Marks)',
      'গণিত শর্টকাট কৌশল ও জ্যামিতি (25 Marks)',
      'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি (25 Marks)',
      'বিগত ১০ বছরের প্রশ্ন সমাধান'
    ],
    pdfAvailable: true,
  },
  {
    id: 'school_college',
    title: 'স্কুল ও কলেজ পর্যায় শিক্ষক নিয়োগ প্রস্তুতি',
    subtitle: 'স্কুল, স্কুল-২ ও কলেজ নিবন্ধনের লিখিত ও প্রিলি গাইডলাইন',
    category: 'স্কুল-কলেজ',
    duration: '৩০ দিন',
    lessonsCount: 36,
    enrolledCount: '৯,৮০০+ পরীক্ষার্থী',
    rating: 4.7,
    iconName: 'Award',
    badge: 'ফাস্ট ট্র্যাক',
    topics: [
      'স্কুল ও কলেজ পর্যায়ের পদভিত্তিক সিলেবাস বিশ্লেষণ',
      'মাস্টার ক্লাস ও বিগত প্রিলিমিনারি এনালাইসিস',
      'নেগেটিভ মার্কিং এড়ানোর গোল্ডেন রুলস',
      'টাইম ম্যানেজমেন্ট ও মডেল টেস্ট প্র্যাকটিস'
    ],
    pdfAvailable: true,
  },
  {
    id: 'viva_written',
    title: 'মৌলভী ও সহকারী শিক্ষক ভাইভা ও লিখিত বিশেষ গাইড',
    subtitle: 'ভাইভা বোর্ডের কমন প্রশ্ন, বিষয়ভিত্তিক উপস্থাপনা ও ডেমো টিচিং',
    category: 'ভাইভা ও লিখিত',
    duration: '১৫ দিন',
    lessonsCount: 20,
    enrolledCount: '৬,৫০০+ পরীক্ষার্থী',
    rating: 4.9,
    iconName: 'Award',
    badge: 'মৌখিক পরীক্ষা',
    topics: [
      'মাদ্রাসা বোর্ডের ভাইভা অভিজ্ঞতা ও কমন প্রশ্ন',
      'আরবি অনুচ্ছেদ পড়া ও তাৎক্ষণিক অনুবাদ',
      'শিক্ষাদান পদ্ধতি (Pedagogy) ও শ্রেণি ব্যবস্থাপনা',
      'বোর্ড চ্যালেঞ্জ ও ভাইভা ম্যানারস'
    ],
    pdfAvailable: true,
  }
];

export const CoursesPage: React.FC<CoursesPageProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCourseModal, setActiveCourseModal] = useState<CourseModule | null>(null);

  const categories = [
    { id: 'all', name: 'সকল কোর্স' },
    { id: 'মাদ্রাসা স্পেশাল', name: 'মাদ্রাসা স্পেশাল' },
    { id: 'সাধারণ সিলেবাস', name: 'প্রিলিমিনারি ১০০ মার্কস' },
    { id: 'স্কুল-কলেজ', name: 'স্কুল ও কলেজ' },
    { id: 'ভাইভা ও লিখিত', name: 'ভাইভা ও লিখিত' },
  ];

  const filteredCourses = selectedCategory === 'all' 
    ? COURSES_DATA 
    : COURSES_DATA.filter(c => c.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 mb-24 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-[#0B132B] border border-slate-300 rounded-full inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              প্রস্তুতির সেরা মাস্টারকোর্স
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B]">
              শিক্ষক নিবন্ধন ও মাদ্রাসা নিয়োগ কোর্সসমূহ
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              অভিজ্ঞ উস্তাদ ও বিষয়ভিত্তিক বিশেষজ্ঞদের তৈরি লেকচার শিট, হ্যান্ডনোট ও শর্টকাট কৌশল
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <Filter className="w-4 h-4 text-[#0B132B] shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-[#0B132B] border-[#0B132B] text-white shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:border-[#0B132B] hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#0B132B] transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-[#0B132B] border border-slate-300 rounded-full">
                  {course.badge}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-[#0B132B]" />
                  <span>{course.duration}</span>
                </div>
              </div>

              <h2 className="text-lg font-black text-[#0B132B] group-hover:text-amber-700 transition-colors">
                {course.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {course.subtitle}
              </p>

              {/* Topics List */}
              <div className="mt-4 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {course.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {course.enrolledCount}
              </span>
              <button
                onClick={() => setActiveCourseModal(course)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0B132B] text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <span>ভিউ কোর্স</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Course Detail Modal */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-300 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-[#0B132B]">{activeCourseModal.title}</h3>
            <p className="text-xs text-slate-600">{activeCourseModal.subtitle}</p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800">
              <p className="font-bold text-[#0B132B] mb-2">কোর্স আউটলাইন & কন্টেন্ট:</p>
              {activeCourseModal.topics.map((t, idx) => (
                <p key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {t}
                </p>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  alert('কোর্সের ফ্রি পিডিএফ লেকচার নোট আপনার ডিভাইসে ডাউনলোড শুরু হয়েছে!');
                  setActiveCourseModal(null);
                }}
                className="flex-1 py-3 bg-[#0B132B] hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-400" />
                ফ্রি নোটস ডাউনলোড
              </button>
              <button
                onClick={() => setActiveCourseModal(null)}
                className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
