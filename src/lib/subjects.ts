import { SubjectCategory, Question } from '../types';

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    id: 'all',
    name: 'সকল বিষয়',
    code: 'ALL',
    iconName: 'LayoutGrid',
    color: '#2D4B3E',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
    description: 'সকল বিষয় থেকে একসাথে এলোমেলো প্রশ্ন অনুশীলন করুন',
  },
  {
    id: 'bangla',
    name: 'বাংলা ভাষা ও সাহিত্য',
    code: 'BANGLA',
    iconName: 'BookOpen',
    color: '#059669',
    bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
    description: 'ব্যাকরণ, সাহিত্য, প্রবাদ প্রবচন ও কবি সাহিত্যিক পরিচিতি',
  },
  {
    id: 'english',
    name: 'ইংরেজি ভাষা ও সাহিত্য',
    code: 'ENGLISH',
    iconName: 'Languages',
    color: '#2563EB',
    bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    description: 'English Grammar, Vocabulary, Literature & Idioms',
  },
  {
    id: 'bangladesh',
    name: 'বাংলাদেশ বিষয়াবলী',
    code: 'BD_AFFAIRS',
    iconName: 'Landmark',
    color: '#D97706',
    bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-950',
    description: 'বাংলাদেশের ইতিহাস, ভূগোল, অর্থনীতি, সংবিধান ও বর্তমান অর্জন',
  },
  {
    id: 'international',
    name: 'আন্তর্জাতিক বিষয়াবলী',
    code: 'INT_AFFAIRS',
    iconName: 'Globe',
    color: '#9333EA',
    bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    description: 'বিশ্ব রাজনীতি, আন্তর্জাতিক সংস্থা, চুক্তি ও সমসাময়িক খবরাখবর',
  },
  {
    id: 'science',
    name: 'সাধারণ বিজ্ঞান',
    code: 'SCIENCE',
    iconName: 'Atom',
    color: '#0284C7',
    bgColor: 'bg-sky-50 text-sky-700 border-sky-200',
    borderColor: 'border-sky-300',
    textColor: 'text-sky-900',
    description: 'পদার্থ, রসায়ন, জীববিজ্ঞান, স্বাস্থ্য ও পরিবেশ বিজ্ঞান',
  },
  {
    id: 'computer',
    name: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
    code: 'ICT',
    iconName: 'Cpu',
    color: '#0D9488',
    bgColor: 'bg-teal-50 text-teal-700 border-teal-200',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-900',
    description: 'কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং, ইন্টারনেট ও প্রোগ্রামিং',
  },
  {
    id: 'math',
    name: 'গণিত ও মানসিক দক্ষতা',
    code: 'MATH',
    iconName: 'Calculator',
    color: '#E11D48',
    bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-900',
    description: 'বীজগণিত, পাটিগণিত, জ্যামিতি ও লজিক্যাল রিজনিং',
  },
];

/**
 * Helper to auto-classify questions into subjects if `subject` field is null or unspecified
 */
export function detectQuestionSubject(question: Question): string {
  if (question.subject && question.subject.trim().length > 0) {
    const norm = question.subject.trim();
    // Match with existing categories
    if (norm.includes('বাংলা') || norm.toLowerCase().includes('bangla')) return 'বাংলা ভাষা ও সাহিত্য';
    if (norm.includes('ইংরেজি') || norm.toLowerCase().includes('english')) return 'ইংরেজি ভাষা ও সাহিত্য';
    if (norm.includes('বাংলাদেশ')) return 'বাংলাদেশ বিষয়াবলী';
    if (norm.includes('আন্তর্জাতিক') || norm.toLowerCase().includes('international')) return 'আন্তর্জাতিক বিষয়াবলী';
    if (norm.includes('বিজ্ঞান') || norm.toLowerCase().includes('science')) return 'সাধারণ বিজ্ঞান';
    if (norm.includes('কম্পিউটার') || norm.includes('তথ্যপ্রযুক্তি') || norm.toLowerCase().includes('computer') || norm.toLowerCase().includes('ict')) return 'কম্পিউটার ও তথ্যপ্রযুক্তি';
    if (norm.includes('গণিত') || norm.includes('মানসিক') || norm.toLowerCase().includes('math')) return 'গণিত ও মানসিক দক্ষতা';
    return norm;
  }

  const text = (question.question + ' ' + (question.explanation || '')).toLowerCase();

  if (text.includes('english') || text.includes('synonym') || text.includes('antonym') || text.includes('verb') || text.includes('noun') || text.includes('sentence') || text.includes('spelling') || text.includes('idiom') || text.includes('plural') || text.includes('meaning of')) {
    return 'ইংরেজি ভাষা ও সাহিত্য';
  }
  if (text.includes('কম্পিউটার') || text.includes('cpu') || text.includes('ram') || text.includes('ip') || text.includes('ইন্টারনেট') || text.includes('হার্ডডিস্ক') || text.includes('সফটওয়্যার') || text.includes('সোশ্যাল মিডিয়া') || text.includes('ওয়েবসাইট')) {
    return 'কম্পিউটার ও তথ্যপ্রযুক্তি';
  }
  if (text.includes('বাংলা') || text.includes('কাব্য') || text.includes('উপন্যাস') || text.includes('ব্যাকরণ') || text.includes('রবীন্দ্রনাথ') || text.includes('নজরুল') || text.includes('সোনার তরী') || text.includes('সন্ধি') || text.includes('সমাস') || text.includes('কারক')) {
    return 'বাংলা ভাষা ও সাহিত্য';
  }
  if (text.includes('আন্তর্জাতিক') || text.includes('জাতিসংঘ') || text.includes('ইউনেস্কো') || text.includes('ন্যাটো') || text.includes('বিশ্বব্যাংক') || text.includes('দেশ') || text.includes('মহাদেশ') || text.includes('মুদ্রা')) {
    return 'আন্তর্জাতিক বিষয়াবলী';
  }
  if (text.includes('সূর্য') || text.includes('মানবদেহ') || text.includes('ত্বক') || text.includes('হাইড্রোজেন') || text.includes('অক্সিজেন') || text.includes('উদ্ভিদ') || text.includes('কোষ') || text.includes('ভিটামিন') || text.includes('গ্যাস')) {
    return 'সাধারণ বিজ্ঞান';
  }
  if (text.includes('গণিত') || text.includes('সংখ্যা') || text.includes('শতকরা') || text.includes('অনুপাত') || text.includes('সমীকরণ') || text.includes('ত্রিভুজ') || text.includes('কোণ') || text.includes('লাভ-ক্ষতি')) {
    return 'গণিত ও মানসিক দক্ষতা';
  }

  return 'বাংলাদেশ বিষয়াবলী';
}
