import { SubjectCategory, Question } from '../types';

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    id: 'all',
    name: 'সকল বিষয় (মডেল টেস্ট)',
    code: 'ALL',
    iconName: 'LayoutGrid',
    color: '#3B82F6',
    bgColor: 'bg-blue-900/40 text-blue-200 border-blue-700/50',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-100',
    description: 'NTRCA ও মাদ্রাসা নিবন্ধনের পূর্ণাঙ্গ ১০০ নম্বরের এলোমেলো প্রশ্ন প্র্যাকটিস',
  },
  {
    id: 'quran_tafsir',
    name: 'আল কুরআন ও তাফসির',
    code: 'QURAN',
    iconName: 'BookOpen',
    color: '#10B981',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'পবিত্র কুরআনের সূরা, তাফসির, আয়াত সংখ্যা ও সংশ্লিষ্ট প্রশ্নাবলি',
  },
  {
    id: 'usul_tafsir',
    name: 'উসুলুত তাফসির',
    code: 'USUL_TAFSIR',
    iconName: 'Bookmark',
    color: '#0EA5E9',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-sky-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'তাফসিরের নীতি ও সূত্রসমূহ, শানে নুযূল এবং তাফসির শাস্ত্রের ইতিহাস',
  },
  {
    id: 'al_hadith',
    name: 'আল হাদিস',
    code: 'HADITH',
    iconName: 'BookMarked',
    color: '#F59E0B',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-amber-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'সিহাহ সিত্তা, হাদিস সংকলনের ইতিহাস ও রাসুলুল্লাহ (সা:)-এর বাণী',
  },
  {
    id: 'usul_hadith',
    name: 'উসুলুল হাদিস',
    code: 'USUL_HADITH',
    iconName: 'CheckCircle',
    color: '#E11D48',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-rose-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'হাদিসের প্রকারভেদ (সহীহ, হাসান, জয়ীফ), সনদ ও রাবী শাস্ত্রের মূলনীতি',
  },
  {
    id: 'al_fiqh',
    name: 'আল ফিকহ',
    code: 'FIQH',
    iconName: 'Scale',
    color: '#8B5CF6',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-purple-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'ইসলামী আইন শাস্ত্র, ইবাদাত, মুআমালাত ও চার মাযহাবের বিধিবিধান',
  },
  {
    id: 'usul_fiqh',
    name: 'উসুলুল ফিকহ',
    code: 'USUL_FIQH',
    iconName: 'Compass',
    color: '#14B8A6',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-teal-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'কোরআন, সুন্নাহ, ইজমা ও কিয়াস ভিত্তিক আইনি গবেষণার নীতিমালা',
  },
  {
    id: 'arabic_literature',
    name: 'আরবি ভাষা ও সাহিত্য',
    code: 'ARABIC_LIT',
    iconName: 'Feather',
    color: '#06B6D4',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'জাহেলি, উমাইয়া, আব্বাসীয় ও আধুনিক আরবি কবি ও সাহিত্যিক পরিচিতি',
  },
  {
    id: 'aqeedah',
    name: 'আকিদা সমূহ',
    code: 'AQEEDAH',
    iconName: 'ShieldCheck',
    color: '#F97316',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-orange-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'ইসলামী বিশ্বাস ও ঈমানের মূল স্তম্ভসমূহ, আসমা ওয়াস সিফাত',
  },
  {
    id: 'arabic_grammar',
    name: 'আরবি ব্যাকরণ ও ভাষাগত দক্ষতা',
    code: 'ARABIC_GRAMMAR',
    iconName: 'Languages',
    color: '#10B981',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'নাহু, সরফ, বালাগাত, ফাসাহাত ও আরবি অনুবাদ দক্ষতা',
  },
  {
    id: 'bangla_literature',
    name: 'বাংলা ও সাহিত্য',
    code: 'BANGLA',
    iconName: 'BookOpen',
    color: '#EC4899',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-pink-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'NTRCA ২৫ নম্বর: ব্যাকরণ, সাহিত্যিক পরিচিতি, সন্ধি, সমাস ও কারক',
  },
  {
    id: 'english_literature',
    name: 'ইংরেজি ও সাহিত্য',
    code: 'ENGLISH',
    iconName: 'FileText',
    color: '#3B82F6',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-blue-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'NTRCA ২৫ নম্বর: English Grammar, Idioms, Translation & Literature',
  },
  {
    id: 'math_reasoning',
    name: 'গণিত ও মানসিক দক্ষতা',
    code: 'MATH',
    iconName: 'Calculator',
    color: '#F43F5E',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-rose-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'NTRCA ২৫ নম্বর: বীজগণিত, পাটিগণিত, জ্যামিতি ও মানসিক দক্ষতা',
  },
  {
    id: 'bd_affairs',
    name: 'বাংলাদেশ বিষয়াবলি',
    code: 'BD_AFFAIRS',
    iconName: 'Landmark',
    color: '#EAB308',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-yellow-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'বাংলাদেশের ইতিহাস, মুক্তিযুদ্ধ, সংবিধান, অর্থনীতি ও সাম্প্রতিক তথ্য',
  },
  {
    id: 'int_affairs',
    name: 'আন্তর্জাতিক বিষয়াবলি',
    code: 'INT_AFFAIRS',
    iconName: 'Globe',
    color: '#A855F7',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-purple-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'বিশ্ব রাজনীতি, আন্তর্জাতিক সংস্থা, চুক্তি, রাজধানী ও বিশ্ব ঘটনাবলী',
  },
  {
    id: 'science_ict',
    name: 'বিজ্ঞান ও তথ্য প্রযুক্তি',
    code: 'SCIENCE_ICT',
    iconName: 'Cpu',
    color: '#06B6D4',
    bgColor: 'bg-[#16223D] text-[#E2E8F0] border-slate-700/60',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-[#F8FAFC]',
    description: 'কম্পিউটার, ইন্টারনেট, তথ্যপ্রযুক্তি ও সাধারণ দৈনন্দিন বিজ্ঞান',
  },
];

/**
 * Helper to auto-classify questions into subjects if `subject` field is null or unspecified
 */
export function detectQuestionSubject(question: Question): string {
  if (question.subject && question.subject.trim().length > 0) {
    const norm = question.subject.trim();
    if (norm.includes('কুরআন') || norm.includes('তাফসির')) return 'আল কুরআন ও তাফসির';
    if (norm.includes('উসুলুত তাফসির')) return 'উসুলুত তাফসির';
    if (norm.includes('হাদিস')) return 'আল হাদিস';
    if (norm.includes('উসুলুল হাদিস')) return 'উসুলুল হাদিস';
    if (norm.includes('ফিকহ')) return 'আল ফিকহ';
    if (norm.includes('উসুলুল ফিকহ')) return 'উসুলুল ফিকহ';
    if (norm.includes('আকিদা')) return 'আকিদা সমূহ';
    if (norm.includes('আরবি ব্যাকরণ') || norm.includes('নাহু')) return 'আরবি ব্যাকরণ ও ভাষাগত দক্ষতা';
    if (norm.includes('আরবি')) return 'আরবি ভাষা ও সাহিত্য';
    if (norm.includes('বাংলা')) return 'বাংলা ও সাহিত্য';
    if (norm.includes('ইংরেজি') || norm.toLowerCase().includes('english')) return 'ইংরেজি ও সাহিত্য';
    if (norm.includes('বাংলাদেশ')) return 'বাংলাদেশ বিষয়াবলি';
    if (norm.includes('আন্তর্জাতিক')) return 'আন্তর্জাতিক বিষয়াবলি';
    if (norm.includes('বিজ্ঞান') || norm.includes('কম্পিউটার') || norm.includes('তথ্য')) return 'বিজ্ঞান ও তথ্য প্রযুক্তি';
    if (norm.includes('গণিত') || norm.includes('মানসিক')) return 'গণিত ও মানসিক দক্ষতা';
    return norm;
  }

  const text = (question.question + ' ' + (question.explanation || '')).toLowerCase();

  if (text.includes('কুরআন') || text.includes('সূরা') || text.includes('আয়াত')) return 'আল কুরআন ও তাফসির';
  if (text.includes('হাদিস') || text.includes('বুখারী') || text.includes('মুসলিম')) return 'আল হাদিস';
  if (text.includes('ফিকহ') || text.includes('সালাত') || text.includes('জাকাত')) return 'আল ফিকহ';
  if (text.includes('english') || text.includes('synonym') || text.includes('verb')) return 'ইংরেজি ও সাহিত্য';
  if (text.includes('কম্পিউটার') || text.includes('cpu') || text.includes('বিজ্ঞান')) return 'বিজ্ঞান ও তথ্য প্রযুক্তি';
  if (text.includes('বাংলা') || text.includes('কাব্য') || text.includes('উপন্যাস')) return 'বাংলা ও সাহিত্য';
  if (text.includes('আন্তর্জাতিক') || text.includes('জাতিসংঘ')) return 'আন্তর্জাতিক বিষয়াবলি';
  if (text.includes('গণিত') || text.includes('শতকরা') || text.includes('সংখ্যা')) return 'গণিত ও মানসিক দক্ষতা';

  return 'বাংলাদেশ বিষয়াবলি';
}

