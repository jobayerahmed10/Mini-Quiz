import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Globe2, 
  Sprout, 
  Scale, 
  Monitor, 
  BookMarked,
  Sparkles,
  Loader2,
  Newspaper,
  BookOpen,
  Calculator,
  Atom,
  Compass,
  ShieldCheck,
  Cpu,
  Brain,
  Feather,
  PenTool
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchMockCurriculumFromSupabase, subscribeToQuestionsRealtime } from '../lib/mockTopicService';
import { isUserPremium } from '../lib/utils';
import { getSubjectPriority, getCanonicalSubjectName, getIconType } from '../lib/subjects';
import { getCache, setCache } from '../lib/cache';
import { PremiumEnrollmentModal } from './PremiumEnrollmentModal';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; topic?: string; questionCount?: number; timeMinutes?: number; isMockFlow?: boolean } | string) => void;
  onOpenCourses?: () => void;
  initialSubTab?: 'mock' | 'quick';
  onStartMockFlow?: (subjectName: string) => void;
}

interface SubjectItem {
  id: string | number;
  name: string;
  iconType?: string;
  code?: string;
  totalQuestions?: number;
}

const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: 'ca', name: 'কারেন্ট অ্যাফেয়ার্স', iconType: 'news' },
  { id: 'bn', name: 'বাংলা সাহিত্য', iconType: 'bn1' },
  { id: 'bn_grammar', name: 'বাংলা ভাষা ও ব্যাকরণ', iconType: 'bn2' },
  { id: 'eng_lit', name: 'English Literature', iconType: 'eng_lit' },
  { id: 'eng_lang', name: 'English Grammar', iconType: 'eng_lang' },
  { id: 'bd_affairs', name: 'বাংলাদেশ বিষয়াবলি', iconType: 'bd' },
  { id: 'intl_affairs', name: 'আন্তর্জাতিক বিষয়াবলি', iconType: 'intl' },
  { id: 'math', name: 'গাণিতিক যুক্তি', iconType: 'math' },
  { id: 'general_sci', name: 'সাধারণ বিজ্ঞান', iconType: 'science' },
  { id: 'geo', name: 'ভূগোল ও দুর্যোগ ব্যবস্থাপনা', iconType: 'geo' },
  { id: 'ethics', name: 'নৈতিকতা, মূল্যবোধ ও সুশাসন', iconType: 'ethics' },
  { id: 'ict', name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', iconType: 'ict' },
  { id: 'mental', name: 'মানসিক দক্ষতা', iconType: 'mental' },
];

const SubjectIcon: React.FC<{ type?: string; name: string }> = ({ type, name }) => {
  const resolvedType = getIconType(name, type) || type;

  switch (resolvedType) {
    case 'news': // 1. কারেন্ট অ্যাফেয়ার্স (Cyan blue badge with globe & NEWS text)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#00A0E9] text-white flex flex-col items-center justify-center shrink-0 shadow-xs overflow-hidden select-none">
          <Globe className="w-4.5 h-4.5 stroke-[2.2] text-white mt-0.5" />
          <span className="text-[7px] font-black leading-none bg-[#006BB8] text-white px-1 py-[1px] rounded-[2px] mt-[1px] tracking-tighter uppercase">
            NEWS
          </span>
        </div>
      );

    case 'bn1': // 2. বাংলা সাহিত্য (Bold red 'অ।')
    case 'bangla':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none font-hind font-black text-2xl sm:text-3xl text-[#E03131]">
          <span>অ</span>
          <span className="text-[#E03131] text-xl sm:text-2xl font-bold ml-[1px]">।</span>
        </div>
      );

    case 'bn2': // 3. বাংলা ভাষা ও ব্যাকরণ (Orange-red badge with white 'অঃ')
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-b from-[#FF5E36] to-[#E02B00] text-white flex items-center justify-center shrink-0 shadow-xs font-hind font-black text-lg sm:text-xl select-none">
          <span>অঃ</span>
        </div>
      );

    case 'eng_lit': // 4. English Literature (Bold purple italic 'a✍')
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none font-serif italic font-black text-2xl sm:text-3xl text-[#7C3AED]">
          <span>a</span>
          <span className="text-sm font-sans not-italic text-[#9333EA] ml-[1px]">✍</span>
        </div>
      );

    case 'eng_lang': // 5. English Grammar (Purple badge with 'Aa')
    case 'english':
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs select-none">
          <span className="bg-white/20 px-1.5 py-0.5 rounded font-sans font-black text-xs sm:text-sm tracking-tight text-white border border-white/30">
            Aa
          </span>
        </div>
      );

    case 'bd': // 6. বাংলাদেশ বিষয়াবলি (Concentric green/white/red ring badge)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#006A4E] p-[3px] flex items-center justify-center shadow-xs">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-[2px]">
              <div className="w-full h-full rounded-full bg-[#F42A41]" />
            </div>
          </div>
        </div>
      );

    case 'intl': // 7. আন্তর্জাতিক বিষয়াবলি (Magenta globe)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none text-[#E11D48]">
          <Globe2 className="w-7 h-7 stroke-[2.2]" />
        </div>
      );

    case 'math': // 8. গাণিতিক যুক্তি (ক্যালকুলেটর ব্যাজ আইকন)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[#D946EF] to-[#A21CAF] text-white flex items-center justify-center shrink-0 shadow-xs select-none">
          <Calculator className="w-5.5 h-5.5 stroke-[2.2] text-white" />
        </div>
      );

    case 'science': // 9. সাধারণ বিজ্ঞান (Green sprout)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none text-[#65A30D]">
          <Sprout className="w-7 h-7 stroke-[2.2]" />
        </div>
      );

    case 'geo': // 10. ভূগোল ও দুর্যোগ ব্যবস্থাপনা (Blue globe)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none text-[#2563EB]">
          <Globe className="w-7 h-7 stroke-[2.2]" />
        </div>
      );

    case 'ethics': // 11. নৈতিকতা, মূল্যবোধ ও সুশাসন (Purple scale)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none text-[#9333EA]">
          <Scale className="w-7 h-7 stroke-[2.2]" />
        </div>
      );

    case 'ict': // 12. কম্পিউটার ও তথ্যপ্রযুক্তি (Indigo/purple monitor)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 select-none text-[#6366F1]">
          <Monitor className="w-7 h-7 stroke-[2.2]" />
        </div>
      );

    case 'mental': // 13. মানসিক দক্ষতা (Gradient ribbon bookmark)
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-gradient-to-b from-[#3B82F6] via-[#8B5CF6] to-[#EC4899] text-white flex items-center justify-center shrink-0 shadow-xs select-none">
          <BookMarked className="w-5.5 h-5.5 stroke-[2.2] text-white" />
        </div>
      );

    default:
      // Fallback if name matches math in any way
      if (name?.toLowerCase().includes('গণিত') || name?.toLowerCase().includes('গাণিতিক') || name?.toLowerCase().includes('math')) {
        return (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[#D946EF] to-[#A21CAF] text-white flex items-center justify-center shrink-0 shadow-xs select-none">
            <Calculator className="w-5.5 h-5.5 stroke-[2.2] text-white" />
          </div>
        );
      }
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#046A38] text-white flex items-center justify-center shrink-0 font-bold text-base">
          {name?.[0] || 'ব'}
        </div>
      );
  }
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ 
  onSelectSubject, 
  onOpenCourses,
  initialSubTab = 'mock',
  onStartMockFlow,
}) => {
  const [activeTab, setActiveTab] = useState<'mock' | 'quick'>(initialSubTab);
  const [subjects, setSubjects] = useState<SubjectItem[]>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Fetch subjects & curriculum with question counts from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchSubjects() {
      try {
        const curriculumData = await fetchMockCurriculumFromSupabase();
        if (!isMounted) return;

        if (curriculumData && curriculumData.length > 0) {
          const mapped: SubjectItem[] = curriculumData.map((c) => ({
            id: c.id,
            name: c.name,
            iconType: getIconType(c.name, c.iconType) || c.iconType,
            totalQuestions: c.totalQuestions || 0,
          }));

          mapped.sort((a, b) => getSubjectPriority(a.name) - getSubjectPriority(b.name));

          setSubjects(mapped);
          setCache('subjects_page_list_v4', mapped);
        }
      } catch (err) {
        console.error('Error loading curriculum subjects:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSubjects();

    const unsubscribe = subscribeToQuestionsRealtime(() => {
      if (isMounted) {
        fetchSubjects();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleCardClick = (subject: SubjectItem) => {
    if (onStartMockFlow) {
      onStartMockFlow(subject.name);
      return;
    }
    onSelectSubject({
      subject: subject.name,
      questionCount: 25,
      timeMinutes: 30,
      isMockFlow: true,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 mb-24 space-y-4 font-hind">
      <div className="text-center pt-1 pb-1">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
          মক পরীক্ষা
        </h2>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#046A38] animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            বিষয়গুলো লোড হচ্ছে...
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {subjects.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 border-b-[3px] border-b-[#046A38] rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-2 sm:gap-3 group relative overflow-hidden"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <SubjectIcon type={item.iconType} name={item.name} />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-[#046A38] dark:group-hover:text-emerald-400 transition-colors truncate">
                    {item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Enrollment Modal */}
      <PremiumEnrollmentModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};
