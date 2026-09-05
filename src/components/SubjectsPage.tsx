import React, { useState } from 'react';
import { 
  Globe, 
  Globe2, 
  Sprout, 
  Scale, 
  Monitor, 
  BookMarked 
} from 'lucide-react';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; topic?: string; questionCount?: number; timeMinutes?: number } | string) => void;
  onOpenCourses?: () => void;
  initialSubTab?: 'mock' | 'quick';
}

interface SubjectItem {
  id: string;
  name: string;
  iconType: string;
}

const MOCK_EXAM_SUBJECTS: SubjectItem[] = [
  { id: 'ca', name: 'কারেন্ট অ্যাফেয়ার্স', iconType: 'news' },
  { id: 'bn', name: 'বাংলা', iconType: 'bn1' },
  { id: 'bn_grammar', name: 'বাংলা ভাষা ও ব্যাকরণ', iconType: 'bn2' },
  { id: 'eng_lit', name: 'English Literature', iconType: 'eng_lit' },
  { id: 'eng_lang', name: 'English Language', iconType: 'eng_lang' },
  { id: 'math', name: 'গাণিতিক', iconType: 'math' },
  { id: 'general_sci', name: 'সাধারণ', iconType: 'science' },
  { id: 'bd_affairs', name: 'বাংলাদেশ বিষয়াবলি', iconType: 'bd' },
  { id: 'intl_affairs', name: 'আন্তর্জাতিক বিষয়াবলি', iconType: 'intl' },
  { id: 'geo', name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', iconType: 'geo' },
  { id: 'ethics', name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', iconType: 'ethics' },
  { id: 'ict', name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', iconType: 'ict' },
  { id: 'mental', name: 'মানসিক', iconType: 'mental' },
];

const QUICK_PRACTICE_SUBJECTS: SubjectItem[] = [
  { id: 'ca', name: 'কারেন্ট অ্যাফেয়ার্স', iconType: 'news' },
  { id: 'bn_lit', name: 'বাংলা সাহিত্য', iconType: 'bn1' },
  { id: 'bn_grammar', name: 'বাংলা ভাষা ও ব্যাকরণ', iconType: 'bn2' },
  { id: 'eng_lit', name: 'English Literature', iconType: 'eng_lit' },
  { id: 'eng_lang', name: 'English Language', iconType: 'eng_lang' },
  { id: 'math_logic', name: 'গাণিতিক যুক্তি', iconType: 'math' },
  { id: 'gen_science', name: 'সাধারণ বিজ্ঞান', iconType: 'science' },
  { id: 'bd_affairs', name: 'বাংলাদেশ বিষয়াবলি', iconType: 'bd' },
  { id: 'intl_affairs', name: 'আন্তর্জাতিক বিষয়াবলি', iconType: 'intl' },
  { id: 'geo', name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', iconType: 'geo' },
  { id: 'ethics', name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', iconType: 'ethics' },
  { id: 'ict', name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', iconType: 'ict' },
  { id: 'mental_skill', name: 'মানসিক দক্ষতা', iconType: 'mental' },
];

const SubjectIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'news':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#00A0E9] text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
          <Globe className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[7.5px] font-black leading-none bg-[#0070B8] px-1 py-0.2 rounded mt-0.5 tracking-tighter uppercase">NEWS</span>
        </div>
      );
    case 'bn1':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-2xs font-hind">
          অ।
        </div>
      );
    case 'bn2':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-2xs font-hind">
          অঃ
        </div>
      );
    case 'eng_lit':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-2xs">
          <span className="font-serif italic font-black text-lg">a</span>
          <span className="text-xs ml-0.5">✍</span>
        </div>
      );
    case 'eng_lang':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-2xs">
          <span className="bg-white/20 px-1.5 py-0.5 rounded-md font-sans font-black tracking-tight">Aa</span>
        </div>
      );
    case 'math':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-600 text-white flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-2xs font-mono">
          √x
        </div>
      );
    case 'science':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Sprout className="w-5 h-5 text-white stroke-[2.2]" />
        </div>
      );
    case 'bd':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
          <div className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full bg-[#006A4E] flex items-center justify-center shadow-xs">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#F42A41]"></div>
          </div>
        </div>
      );
    case 'intl':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Globe2 className="w-5.5 h-5.5 text-white stroke-[2.2]" />
        </div>
      );
    case 'geo':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Globe className="w-5.5 h-5.5 text-white stroke-[2.2]" />
        </div>
      );
    case 'ethics':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Scale className="w-5.5 h-5.5 text-white stroke-[2.2]" />
        </div>
      );
    case 'ict':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Monitor className="w-5.5 h-5.5 text-white stroke-[2.2]" />
        </div>
      );
    case 'mental':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <BookMarked className="w-5.5 h-5.5 text-white stroke-[2.2]" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Globe className="w-5.5 h-5.5" />
        </div>
      );
  }
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ 
  onSelectSubject, 
  initialSubTab = 'mock' 
}) => {
  const [activeTab, setActiveTab] = useState<'mock' | 'quick'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleCardClick = (subjectName: string) => {
    onSelectSubject({
      subject: subjectName,
      questionCount: 25,
      timeMinutes: activeTab === 'quick' ? 15 : 30,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 mb-24 space-y-4">
      {/* Top Navigation Tabs Switcher */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 border-b border-slate-200/80 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('mock')}
          className={`relative py-2.5 text-lg sm:text-xl font-black font-hind transition-colors cursor-pointer select-none ${
            activeTab === 'mock'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
          }`}
        >
          <span>মক পরীক্ষা</span>
          {activeTab === 'mock' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#046A38] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          className={`relative py-2.5 text-lg sm:text-xl font-black font-hind transition-colors cursor-pointer select-none ${
            activeTab === 'quick'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
          }`}
        >
          <span>দ্রুত প্র্যাকটিস</span>
          {activeTab === 'quick' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#046A38] rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: MOCK EXAM VIEW (মক পরীক্ষা) */}
      {activeTab === 'mock' && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center pt-1 pb-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind tracking-tight">
              বিষয় ভিত্তিক
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {MOCK_EXAM_SUBJECTS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.name)}
                className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 border-b-[3px] border-b-[#046A38] rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-3 sm:gap-3.5 group"
              >
                <SubjectIcon type={item.iconType} />
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 font-hind leading-snug group-hover:text-[#046A38] dark:group-hover:text-emerald-400 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QUICK PRACTICE VIEW (দ্রুত প্র্যাকটিস) */}
      {activeTab === 'quick' && (
        <div className="space-y-3 animate-fade-in pt-1">
          <div className="flex flex-col gap-3 sm:gap-3.5">
            {QUICK_PRACTICE_SUBJECTS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.name)}
                className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:scale-[1.005] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-4 group"
              >
                <SubjectIcon type={item.iconType} />
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-hind group-hover:text-[#046A38] dark:group-hover:text-emerald-400 transition-colors">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
