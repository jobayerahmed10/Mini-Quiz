import React, { useState } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  BookMarked, 
  CheckCircle, 
  Scale, 
  Compass, 
  Feather, 
  ShieldCheck, 
  Languages, 
  FileText, 
  Calculator, 
  Landmark, 
  Globe, 
  Cpu, 
  Search, 
  Play, 
  Sparkles,
  HelpCircle,
  Clock,
  ListOrdered,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import { SUBJECT_CATEGORIES } from '../lib/subjects';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; questionCount?: number; timeMinutes?: number }) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Bookmark,
  BookMarked,
  CheckCircle,
  Scale,
  Compass,
  Feather,
  ShieldCheck,
  Languages,
  FileText,
  Calculator,
  Landmark,
  Globe,
  Cpu,
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onSelectSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);

  const fifteenSubjects = SUBJECT_CATEGORIES.filter(s => s.id !== 'all');

  const filteredSubjects = fifteenSubjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenSubjectModal = (subjectName: string) => {
    setSelectedSubject(subjectName);
  };

  const handleStartExamFromModal = () => {
    if (!selectedSubject) return;
    onSelectSubject({
      subject: selectedSubject,
      questionCount,
      timeMinutes,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 mb-24 space-y-6">
      {/* Header Banner */}
      <div className="neu-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-full inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              ১৫টি বিষয়ভিত্তিক বিশেষ প্রস্তুতি
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B] dark:text-white">
              বিষয়ভিত্তিক প্রস্তুতি ও অনুশীলন
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              নিচের বিষয়ের বাটন সমূহে ক্লিক করে আপনার সুবিধামতো প্রশ্ন সংখ্যা ও সময়সীমা সেট করুন।
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedSubject('সকল বিষয়');
              setQuestionCount(100);
              setTimeMinutes(60);
            }}
            className="neu-btn px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shrink-0 shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>সব বিষয়ের ১০০ প্রশ্নের টেস্ট</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="বিষয় খুঁজুন (যেমন: ফিকহ, আরবি ব্যাকরণ, গণিত, কুরআন)..."
          className="w-full bg-white dark:bg-[#121E36] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#0B132B] dark:focus:border-amber-400 shadow-xs"
        />
      </div>

      {/* 15 Subjects Button Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSubjects.map((sub, idx) => {
          const IconComponent = ICON_MAP[sub.iconName] || BookOpen;
          const isSelected = selectedSubject === sub.name;

          return (
            <button
              key={sub.id}
              onClick={() => handleOpenSubjectModal(sub.name)}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'neu-btn-active bg-[#0B132B] text-white'
                  : 'neu-btn text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSelected ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0B132B] dark:text-amber-400'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black leading-tight">
                    {sub.name}
                  </h2>
                  <p className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {sub.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${
                  isSelected ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}>
                  বাটন #{idx + 1}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Question Count & Time Limit Options Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="neu-card max-w-md w-full p-6 relative shadow-2xl space-y-5 bg-white dark:bg-[#121E36]">
            {/* Header with Top-Left Back Button and Right Close Button */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>পিছনে</span>
              </button>
              <button
                onClick={() => setSelectedSubject(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Title */}
            <div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                নির্বাচিত বিষয়
              </span>
              <h3 className="text-xl font-black text-[#0B132B] dark:text-white mt-1">
                {selectedSubject}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                অনুশীলন শুরু করার আগে আপনার পছন্দমতো সময় ও প্রশ্ন নির্বাচন করুন
              </p>
            </div>

            {/* Option 1: Question Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-[#0B132B] dark:text-amber-400" />
                <span>প্রশ্ন সংখ্যা নির্ধারণ করুন:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((num) => {
                  const isCountSelected = questionCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isCountSelected
                          ? 'bg-[#0B132B] border-[#0B132B] text-amber-400 shadow-xs'
                          : 'neu-btn text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {num}টি
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option 2: Time Limit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0B132B] dark:text-amber-400" />
                <span>সময় সীমা নির্ধারণ করুন (মিনিট):</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((mins) => {
                  const isTimeSelected = timeMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeMinutes(mins)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isTimeSelected
                          ? 'bg-[#0B132B] border-[#0B132B] text-amber-400 shadow-xs'
                          : 'neu-btn text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {mins}মি.
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Exam Button */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleStartExamFromModal}
                className="w-full py-3.5 bg-[#0B132B] hover:bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>পরীক্ষা শুরু করুন ({questionCount}টি প্রশ্ন, {timeMinutes} মিনিট)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
