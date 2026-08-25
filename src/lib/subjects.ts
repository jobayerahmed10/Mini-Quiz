import { SubjectCategory, Question } from '../types';

export interface MainSubjectPost {
  id: string;
  name: string;
  code: string;
  tagline: string;
  subtitle: string;
  badge: string;
  iconName: string;
  themeColor: string;
  accentGradient: string;
  gradientClass: string;
  topics: string[];
  description: string;
}

export const MAIN_SUBJECT_POSTS: MainSubjectPost[] = [
  {
    id: 'arabic_lecturer',
    name: 'আরবি প্রভাষক প্রস্তুতি',
    code: '৩০০',
    tagline: 'মাদ্রাসা ও কলেজ পর্যায় (প্রভাষক পদ)',
    badge: 'প্রভাষক আরবি • কোড: ৩০০',
    subtitle: 'আরবি সাহিত্য, বালাগাত, মানতিক, উচ্চতর নাহু-সরফ, তাফসির ও উসুলুল ফিকহ',
    iconName: 'BookOpenCheck',
    themeColor: '#6366F1',
    accentGradient: 'from-[#6366F1] to-[#4338CA]',
    gradientClass: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
    topics: ['আরবি সাহিত্য ও ইতিহাস', 'ইলমুল বালাগাত ও মানতিক', 'উচ্চতর নাহু ও সরফ', 'তাফসির ও উসুলুত তাফসির', 'হাদিস ও উসুলুল হাদিস', 'ফিকহ ও উসুলুল ফিকহ'],
    description: 'NTRCA কলেজ ও মাদ্রাসা শিক্ষক নিবন্ধন: আরবি প্রভাষক (পদ কোড: ৩০০) এর পূর্ণাঙ্গ বিষয়ভিত্তিক প্রশ্নব্যাংক ও প্রস্তুতি।',
  },
  {
    id: 'assistant_moulvi',
    name: 'সহকারী মৌলভী প্রস্তুতি',
    code: '৩১১',
    tagline: 'মাদ্রাসা আলিম ও দাখিল পর্যায়',
    badge: 'সহকারী শিক্ষক • কোড: ৩১১',
    subtitle: 'আল কুরআন ও তাফসির, আল হাদিস শরিফ, ফিকহ ও ফাতওয়া, আরবি ব্যাকরণ ও ইসলামী শিক্ষা',
    iconName: 'BookMarked',
    themeColor: '#8B5CF6',
    accentGradient: 'from-[#8B5CF6] to-[#6D28D9]',
    gradientClass: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-800 shadow-purple-500/25',
    topics: ['আল কুরআন ও তাফসির', 'আল হাদিস শরিফ', 'আল ফিকহ ও ফাতওয়া', 'আরবি ব্যাকরণ (নাহু-সরফ)', 'আকিদা ও কালামশাস্ত্র', 'ইসলামের ইতিহাস ও সংস্কৃতি'],
    description: 'NTRCA মাদ্রাসা নিবন্ধন: সহকারী মৌলভী (পদ কোড: ৩১১) এর পূর্ণাঙ্গ বিষয়ভিত্তিক প্রশ্নব্যাংক ও মডেল টেস্ট।',
  },
  {
    id: 'assistant_moulvi_qari',
    name: 'সহকারী মৌলভী কারী প্রস্তুতি',
    code: '৩১১-ক',
    tagline: 'সহকারী মৌলভী ও ক্বারী শিক্ষক',
    badge: 'সহকারী মৌলভী কারী • বিশেষ',
    subtitle: 'ইলমুত তাজবীদ, কুরআন তেলাওয়াত উসুল, মাখরাজ-সিফাত, আরবি ব্যাকরণ ও ফিকহ',
    iconName: 'ScrollText',
    themeColor: '#EC4899',
    accentGradient: 'from-[#EC4899] to-[#BE185D]',
    gradientClass: 'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-700 shadow-pink-500/25',
    topics: ['ইলমুত তাজবীদ ও ক্বিরাআত', 'মাখরাজ ও সিফাতুল হুরুফ', 'আল কুরআন ও হাদিস শরিফ', 'আরবি ব্যাকরণ ও ফিকহ'],
    description: 'NTRCA সহকারী মৌলভী কারী পদের বিশেষ প্রশ্নব্যাংক ও পূর্ণাঙ্গ তাজবীদ-দ্বীনিয়্যাত অনুশীলন।',
  },
  {
    id: 'ebtedayee_moulvi',
    name: 'ইবতেদায়ী মৌলভী প্রস্তুতি',
    code: '৩১২',
    tagline: 'ইবতেদায়ী মাদ্রাসা পর্যায়',
    badge: 'ইবতেদায়ী প্রধান/মৌলভী • কোড: ৩১২',
    subtitle: 'প্রাথমিক দ্বীনিয়্যাত, কুরআন মজিদ, তাজবীদ, আকাইদ ও ফিকহের মৌলিক বিধানাবলী',
    iconName: 'BookText',
    themeColor: '#0EA5E9',
    accentGradient: 'from-[#0EA5E9] to-[#0369A1]',
    gradientClass: 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 shadow-sky-500/25',
    topics: ['কুরআন মাজিদ ও তাজবীদ', 'হাদিস শরিফ ও সুন্নাহ', 'মৌলিক ফিকহ ও মাসআলা', 'আকাইদ ও দ্বীনিয়্যাত', 'সহজ আরবি ব্যাকরণ'],
    description: 'NTRCA ইবতেদায়ি মাদ্রাসা শিক্ষক নিবন্ধন: ইবতেদায়ী মৌলভী (পদ কোড: ৩১২) এর সিলেবাসভিত্তিক অনুশীলন।',
  },
  {
    id: 'ebtedayee_qari',
    name: 'ইবতেদায়ী কারী প্রস্তুতি',
    code: '৩১৩',
    tagline: 'ইবতেদায়ী কারী ও তাজবীদ শিক্ষক',
    badge: 'ইবতেদায়ী কারী • কোড: ৩১৩',
    subtitle: 'ইলমুত তাজবীদ, মাখরাজ ও সিফাত, ক্বিরাআত উসুল, হিফজুল কুরআন ও প্রয়োজনীয় মাসআলা',
    iconName: 'BookOpen',
    themeColor: '#10B981',
    accentGradient: 'from-[#10B981] to-[#047857]',
    gradientClass: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 shadow-emerald-500/25',
    topics: ['ইলমুত তাজবীদ (মাখরাজ-সিফাত)', 'ক্বিরাআত ও তিলাওয়াত উসুল', 'কুরআন হিফজ ও নাজেরা', 'প্রাথমিক ফিকহ ও মাসআলা', 'ইসলামী আদব ও শিষ্টাচার'],
    description: 'NTRCA ইবতেদায়ি মাদ্রাসা শিক্ষক নিবন্ধন: ইবতেদায়ী কারী (পদ কোড: ৩১৩) এর পূর্ণাঙ্গ তাজবীদ ও প্রশ্নব্যাংক অনুশীলন।',
  },
  {
    id: 'general_subjects',
    name: 'জেনারেল প্রস্তুতি',
    code: 'আবশ্যিক',
    tagline: 'স্কুল, কলেজ ও মাদ্রাসা সকল পর্যায়',
    badge: 'আবশ্যিক জেনারেল বিষয় • ১০০ নম্বর',
    subtitle: 'বাংলা ভাষা ও সাহিত্য, ইংরেজি ভাষা, সাধারণ গণিত ও মানসিক দক্ষতা, সাধারণ জ্ঞান ও আইসিটি',
    iconName: 'Library',
    themeColor: '#A855F7',
    accentGradient: 'from-[#A855F7] to-[#7E22CE]',
    gradientClass: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-purple-500/25',
    topics: ['বাংলা ভাষা ও সাহিত্য', 'ইংরেজি ভাষা ও গ্রামার', 'সাধারণ গণিত ও মানসিক দক্ষতা', 'বাংলাদেশ বিষয়াবলি', 'আন্তর্জাতিক বিষয়াবলি', 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)'],
    description: 'NTRCA স্কুল, কলেজ ও মাদ্রাসা প্রিলিমিনারি আবশ্যিক বিষয়: বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের পূর্ণাঙ্গ প্রস্তুতি।',
  },
];

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    id: 'all',
    name: 'সকল বিষয় (মডেল টেস্ট)',
    code: 'ALL',
    iconName: 'LayoutGrid',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'NTRCA ও মাদ্রাসা নিবন্ধনের পূর্ণাঙ্গ ১০০ নম্বরের এলোমেলো প্রশ্ন প্র্যাকটিস',
  },
  {
    id: 'quran_tafsir',
    name: 'আল কুরআন ও তাফসির',
    code: 'QURAN',
    iconName: 'BookOpen',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'পবিত্র কুরআনের সূরা, তাফসির, আয়াত সংখ্যা ও সংশ্লিষ্ট প্রশ্নাবলি',
  },
  {
    id: 'usul_tafsir',
    name: 'উসুলুত তাফসির',
    code: 'USUL_TAFSIR',
    iconName: 'Bookmark',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'তাফসিরের নীতি ও সূত্রসমূহ, শানে নুযূল এবং তাফসির শাস্ত্রের ইতিহাস',
  },
  {
    id: 'al_hadith',
    name: 'আল হাদিস',
    code: 'HADITH',
    iconName: 'FileText',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'সিহাহ সিত্তা, হাদিস সংকলনের ইতিহাস ও রাসুলুল্লাহ (সা:)-এর বাণী',
  },
  {
    id: 'usul_hadith',
    name: 'উসুলুল হাদিস',
    code: 'USUL_HADITH',
    iconName: 'CheckCircle',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'হাদিসের প্রকারভেদ (সহীহ, হাসান, জয়ীফ), সনদ ও রাবী শাস্ত্রের মূলনীতি',
  },
  {
    id: 'al_fiqh',
    name: 'আল ফিকহ ও ফাতওয়া',
    code: 'FIQH',
    iconName: 'Scale',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'ইবাদাত, মুয়ামালাত, মুয়াশারাত ও ইসলামিক আইনশাস্ত্র',
  },
  {
    id: 'usul_fiqh',
    name: 'উসুলুল ফিকহ',
    code: 'USUL_FIQH',
    iconName: 'Compass',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'ফিকহের উসুল, আদিল্লায়ে আরবাআ এবং ইজতিহাদ',
  },
  {
    id: 'arabic_grammar',
    name: 'আরবি ব্যাকরণ (নাহু ও সরফ)',
    code: 'ARABIC_GRAMMAR',
    iconName: 'Feather',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'ইলমুন নাহু ও ইলমুস সরফের নিয়মাবলি ও তারকীব',
  },
  {
    id: 'arabic_literature',
    name: 'আরবি ভাষা ও সাহিত্য',
    code: 'ARABIC_LIT',
    iconName: 'Languages',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'জাহেলি, উমাইয়া, আব্বাসীয় ও আধুনিক আরবি কবি ও সাহিত্যিক পরিচিতি',
  },
  {
    id: 'aqeedah',
    name: 'আকিদা ও কালামশাস্ত্র',
    code: 'AQEEDAH',
    iconName: 'ShieldCheck',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'তাওহিদ, রিসালাত, আখিরাত ও আকিদাগত সমাধান',
  },
  {
    id: 'islamic_history',
    name: 'ইসলামের ইতিহাস ও সংস্কৃতি',
    code: 'ISLAMIC_HISTORY',
    iconName: 'Landmark',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'খোলাফায়ে রাশেদিন ও মুসলিম সভ্যতার ইতিহাস',
  },
  {
    id: 'bangla_literature',
    name: 'বাংলা ভাষা ও সাহিত্য',
    code: 'BANGLA',
    iconName: 'BookOpen',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'ব্যাকরণ, প্রমিত বাংলা ও বাংলা সাহিত্যের যুগবিভাগ',
  },
  {
    id: 'english_literature',
    name: 'ইংরেজি ভাষা ও ব্যাকরণ',
    code: 'ENGLISH',
    iconName: 'FileText',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'Grammar, Vocabulary, Translation & Parts of Speech',
  },
  {
    id: 'math_reasoning',
    name: 'সাধারণ গণিত ও মানসিক দক্ষতা',
    code: 'MATH',
    iconName: 'Calculator',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'পাটিগণিত, বীজগণিত, জ্যামিতি ও লজিক্যাল রিজনিং',
  },
  {
    id: 'bd_int_affairs',
    name: 'বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি',
    code: 'BD_INT_AFFAIRS',
    iconName: 'Globe',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'ভৌগোলিক তথ্য, সংবিধান ও সাম্প্রতিক সাধারণ জ্ঞান',
  },
  {
    id: 'science_ict',
    name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    code: 'SCIENCE_ICT',
    iconName: 'Cpu',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    description: 'কম্পিউটার, ইন্টারনেট, ডেটাবেস ও ডিজিটাল প্রযুক্তি',
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

