import React, { useState } from 'react';
import { 
  FileCheck2, 
  Clock, 
  Target, 
  Play, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  BookOpen,
  Zap,
  Check
} from 'lucide-react';
import { SUBJECT_CATEGORIES } from '../lib/subjects';

interface ExamPageProps {
  onStartExam: (options: {
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  }) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({ onStartExam }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);

  const examPresets = [
    {
      id: 'full_prelim',
      title: '১৮তম ও ১৯তম NTRCA প্রিলিমিনারি পূর্ণাঙ্গ টেস্ট',
      subject: 'সকল বিষয়',
      questionCount: 100,
      timeMinutes: 60,
      description: '১০০ নম্বরের পূর্ণাঙ্গ ১০০টি প্রশ্ন। ১০০ মার্কস ও ১ ঘণ্টা নেগেটিভ মার্কিং সহ আসল পরীক্ষার অনুভূতি।',
      badge: 'অফিসিয়াল ফরম্যাট',
      icon: Award,
    },
    {
      id: 'madrasa_special',
      title: 'মাদ্রাসা বিশেষ বিষয় প্রাকটিস টেস্ট',
      subject: 'আল কুরআন ও তাফসির',
      questionCount: 30,
      timeMinutes: 25,
      description: 'কুরআন, হাদিস, ফিকহ, আরবি ব্যাকরণ ও আকিদার বিশেষ প্রশ্নাবলি।',
      badge: 'মাদ্রাসা স্পেশাল',
      icon: BookOpen,
    },
    {
      id: 'speed_test',
      title: '১৫ মিনিটে ২৫ নম্বরের কুইক স্পিড টেস্ট',
      subject: 'সকল বিষয়',
      questionCount: 25,
      timeMinutes: 15,
      description: 'দ্রুত রিভিশন ও সময় সচেতনতার জন্য ২৫ প্রশ্নের দ্রুত কুইজ।',
      badge: 'কুইক স্পিড',
      icon: Zap,
    },
  ];

  const handleLaunchCustom = () => {
    onStartExam({
      subject: selectedSubject,
      questionCount,
      timeMinutes,
      examType: 'কাস্টম মডেল টেস্ট',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 mb-24 space-y-6">
      {/* Banner */}
      <div className="neu-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-full inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              লাইভ কুইজ ও প্রিলিমিনারি মডেল টেস্ট
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B] dark:text-white">
              পরীক্ষা দিন & প্রস্তুতি যাচাই করুন
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              স্বয়ংক্রিয় টাইমার, নেগেটিভ মার্কিং (-০.৫০) এবং বিস্তারিত সমাধানসহ মডেল টেস্ট
            </p>
          </div>

          <button
            onClick={() => onStartExam({
              subject: 'সকল বিষয়',
              questionCount: 100,
              timeMinutes: 60,
              examType: '১০০ মার্কস লাইভ মডেল টেস্ট'
            })}
            className="neu-btn px-6 py-3.5 rounded-2xl bg-[#0B132B] text-white font-black text-sm flex items-center gap-2 cursor-pointer shrink-0 shadow-md transition-all active:scale-95"
          >
            <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>১০০ মার্কস পরীক্ষা শুরু করুন</span>
          </button>
        </div>
      </div>

      {/* Featured Exam Presets */}
      <div>
        <h2 className="text-lg font-black text-[#0B132B] dark:text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#0B132B] dark:text-amber-400" />
          পপুলার মডেল টেস্ট সমূহ:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examPresets.map((preset) => {
            return (
              <div
                key={preset.id}
                className="neu-card p-5 flex flex-col justify-between hover:border-amber-400/60 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-full">
                      {preset.badge}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-[#0B132B] dark:text-amber-400" />
                      <span>{preset.timeMinutes} মিনিট</span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-[#0B132B] dark:text-white group-hover:text-amber-400 transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    {preset.questionCount}টি প্রশ্ন
                  </span>
                  <button
                    onClick={() => onStartExam({
                      subject: preset.subject,
                      questionCount: preset.questionCount,
                      timeMinutes: preset.timeMinutes,
                      examType: preset.title,
                    })}
                    className="neu-btn px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>শুরু করুন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Exam Builder */}
      <div className="neu-card p-6 relative overflow-hidden">
        <h2 className="text-lg font-black text-[#0B132B] dark:text-white mb-1 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-[#0B132B] dark:text-amber-400" />
          নিজের পছন্দমতো পরীক্ষা সেটআপ করুন:
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
          আপনার সুবিধামতো বিষয়, প্রশ্ন সংখ্যা ও সময় নির্ধারণ করে কাস্টম টেস্ট তৈরি করুন
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              বিষয় নির্বাচন করুন:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D172A] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-[#0B132B] dark:focus:border-amber-400"
            >
              <option value="সকল বিষয়">সকল বিষয় (মডেল টেস্ট)</option>
              {SUBJECT_CATEGORIES.filter(s => s.id !== 'all').map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              প্রশ্ন সংখ্যা:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                    questionCount === num
                      ? 'bg-[#0B132B] border-[#0B132B] text-amber-400 shadow-xs'
                      : 'neu-btn text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {num}টি
                </button>
              ))}
            </div>
          </div>

          {/* Time Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              সময়সীমা (মিনিট):
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimeMinutes(mins)}
                  className={`py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border ${
                    timeMinutes === mins
                      ? 'bg-[#0B132B] border-[#0B132B] text-amber-400 shadow-xs'
                      : 'neu-btn text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {mins}মি
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>প্রতি ভুল উত্তরের জন্য ০.৫০ নম্বর কাটা যাবে</span>
          </div>

          <button
            onClick={handleLaunchCustom}
            className="neu-btn px-8 py-3.5 bg-[#0B132B] text-white rounded-2xl font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>কাস্টম পরীক্ষা শুরু করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
