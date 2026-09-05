import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  Pencil, 
  Check, 
  Building2, 
  Sparkles, 
  Clock, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Bookmark, 
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  FileText,
  Award,
  Layers,
  Zap,
  Filter,
  Lock
} from 'lucide-react';
import { JobCircular } from '../types';
import { JOB_CIRCULARS_DATA } from '../data/jobCircularsData';
import { toBengaliNumeral, isUserPremium } from '../lib/utils';
import { PremiumEnrollmentModal } from './PremiumEnrollmentModal';

interface JobCircularsPageProps {
  onStartModelTestForCategory?: (categoryName: string) => void;
}

interface ArchiveCardData {
  id: string;
  title: string;
  count: number;
  bgGradient: string;
  logoType?: 'gov' | 'bank' | 'iba' | 'yinyang' | 'check' | 'railway' | 'electricity';
  hasCheckBadge?: boolean;
}

interface ArchiveCategoryGroup {
  id: string;
  name: string;
  bgColorLight: string;
  bgColorDark: string;
  cards: ArchiveCardData[];
}

export const JobCircularsPage: React.FC<JobCircularsPageProps> = ({
  onStartModelTestForCategory
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'archive' | 'circulars'>('archive');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeJobModal, setActiveJobModal] = useState<JobCircular | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [selectedCategoryCard, setSelectedCategoryCard] = useState<ArchiveCardData | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(() => isUserPremium());
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  useEffect(() => {
    const handleSync = () => {
      setIsPremium(isUserPremium());
    };
    window.addEventListener('tamreen_premium_updated', handleSync);
    window.addEventListener('tamreen_premium_status_changed', handleSync);
    window.addEventListener('tamreen_unlocked_posts_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tamreen_premium_updated', handleSync);
      window.removeEventListener('tamreen_premium_status_changed', handleSync);
      window.removeEventListener('tamreen_unlocked_posts_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Category filter tabs data
  const categoryFilters = [
    { id: 'all', label: 'সকল ক্যাটাগরি' },
    { id: 'bcs', label: 'বিসিএস' },
    { id: 'teacher', label: 'টিচার রিক্রুটমেন্ট' },
    { id: 'bank', label: 'ব্যাংক জব' },
    { id: 'iba', label: 'আইবিএ' },
    { id: 'grade_9_20', label: '৯-২০ গ্রেড' },
    { id: 'others', label: 'অন্যান্য' },
  ];

  // Full Archive Categories structure as shown in the app screenshot
  const archiveGroups: ArchiveCategoryGroup[] = [
    {
      id: 'bcs',
      name: 'বিসিএস',
      bgColorLight: 'bg-[#EFF6E0]/90 border-emerald-100',
      bgColorDark: 'dark:bg-emerald-950/20 dark:border-emerald-900/40',
      cards: [
        {
          id: 'bcs-preli',
          title: 'বিসিএস প্রিলি',
          count: 41,
          bgGradient: 'from-[#4F86F7] via-[#3B71E8] to-[#255BD8]',
          hasCheckBadge: true,
          logoType: 'check'
        },
        {
          id: 'bcs-written',
          title: 'বিসিএস রিটেন',
          count: 6,
          bgGradient: 'from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]',
          logoType: 'gov'
        }
      ]
    },
    {
      id: 'teacher',
      name: 'টিচার রিক্রুটমেন্ট',
      bgColorLight: 'bg-[#E3F2FD]/90 border-sky-100',
      bgColorDark: 'dark:bg-sky-950/20 dark:border-sky-900/40',
      cards: [
        {
          id: 'primary-assistant',
          title: 'প্রা. সহকারী শিক্ষক নিয়োগ',
          count: 83,
          bgGradient: 'from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]',
          logoType: 'gov'
        },
        {
          id: 'ntrca-preli',
          title: 'শিক্ষক নিবন্ধন প্রিলিমিনারি',
          count: 5,
          bgGradient: 'from-[#10B981] via-[#059669] to-[#047857]',
          logoType: 'gov'
        }
      ]
    },
    {
      id: 'bank',
      name: 'ব্যাংক জব',
      bgColorLight: 'bg-[#F1F8E9]/90 border-lime-100',
      bgColorDark: 'dark:bg-lime-950/20 dark:border-lime-900/40',
      cards: [
        {
          id: 'bjs',
          title: 'বিজেএস',
          count: 16,
          bgGradient: 'from-[#334155] via-[#1E293B] to-[#0F172A]',
          logoType: 'gov'
        },
        {
          id: 'bank-job',
          title: 'ব্যাংক নিয়োগ',
          count: 43,
          bgGradient: 'from-[#10B981] via-[#047857] to-[#065F46]',
          logoType: 'bank'
        }
      ]
    },
    {
      id: 'iba',
      name: 'আইবিএ',
      bgColorLight: 'bg-[#E0F2F1]/90 border-teal-100',
      bgColorDark: 'dark:bg-teal-950/20 dark:border-teal-900/40',
      cards: [
        {
          id: 'iba-solution',
          title: 'আইবিএ জব সলিউশন',
          count: 8,
          bgGradient: 'from-[#0D9488] via-[#0F766E] to-[#115E59]',
          logoType: 'iba'
        },
        {
          id: 'petrobangla',
          title: 'পেট্রোবাংলা',
          count: 4,
          bgGradient: 'from-[#38BDF8] via-[#0284C7] to-[#0369A1]',
          logoType: 'yinyang'
        }
      ]
    },
    {
      id: 'grade_9_20',
      name: '৯-২০ গ্রেড',
      bgColorLight: 'bg-[#F3E5F5]/90 border-purple-100',
      bgColorDark: 'dark:bg-purple-950/20 dark:border-purple-900/40',
      cards: [
        {
          id: 'psc-9-13',
          title: 'PSC ৯ - ১৩ তম গ্রেড',
          count: 68,
          bgGradient: 'from-[#8B5CF6] via-[#7E22CE] to-[#6B21A8]',
          logoType: 'gov'
        },
        {
          id: 'grade-14-20',
          title: '১৪ - ২০ তম গ্রেড',
          count: 84,
          bgGradient: 'from-[#059669] via-[#047857] to-[#064E3B]',
          logoType: 'gov'
        }
      ]
    },
    {
      id: 'others',
      name: 'অন্যান্য',
      bgColorLight: 'bg-[#E8EAF6]/90 border-indigo-100',
      bgColorDark: 'dark:bg-indigo-950/20 dark:border-indigo-900/40',
      cards: [
        {
          id: 'electricity',
          title: 'বিদ্যুৎ বিভাগ',
          count: 11,
          bgGradient: 'from-[#7C3AED] via-[#6B21A8] to-[#581C87]',
          logoType: 'electricity'
        },
        {
          id: 'yearly-solution',
          title: 'সালভিত্তিক জব সলিউশন',
          count: 11,
          bgGradient: 'from-[#64748B] via-[#475569] to-[#334155]',
          logoType: 'gov'
        },
        {
          id: 'railway',
          title: 'বাংলাদেশ রেলওয়ে',
          count: 15,
          bgGradient: 'from-[#EF4444] via-[#DC2626] to-[#991B1B]',
          logoType: 'railway'
        },
        {
          id: 'social-welfare',
          title: 'সমাজসেবা অধিদপ্তর',
          count: 20,
          bgGradient: 'from-[#8B5CF6] via-[#6D28D9] to-[#4C1D95]',
          logoType: 'gov'
        }
      ]
    }
  ];

  // Filter archive groups based on selected Category and Search query
  const filteredArchiveGroups = archiveGroups
    .filter(group => selectedCategory === 'all' || group.id === selectedCategory)
    .map(group => {
      if (!searchQuery.trim()) return group;
      const matchingCards = group.cards.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...group, cards: matchingCards };
    })
    .filter(group => group.cards.length > 0);

  // Job Circulars Filter
  const filteredJobs = JOB_CIRCULARS_DATA.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleSaveJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs(savedJobs.filter((j) => j !== id));
    } else {
      setSavedJobs([...savedJobs, id]);
    }
  };

  const handleCardClick = (card: ArchiveCardData) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedCategoryCard(card);
    if (onStartModelTestForCategory) {
      onStartModelTestForCategory(card.title);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-4 font-hind pb-28 animate-fade-in">
      
      {/* Search Input Bar (Matches App Screenshot 1 & 2) */}
      <div className="relative shadow-xs rounded-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="প্রশ্নব্যাংক খুঁজুন"
          className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/80 rounded-full text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#046A38] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* TOP TOPIC BUTTONS BAR (Positioned directly under search bar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categoryFilters.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#046A38] text-white border-[#046A38] shadow-sm scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700 hover:border-[#046A38]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      {/* MAIN CONTENT AREA */}
      <div className="space-y-4">
          {filteredArchiveGroups.length > 0 ? (
            filteredArchiveGroups.map((group) => (
              <div
                key={group.id}
                className={`rounded-3xl p-4 sm:p-5 border ${group.bgColorLight} ${group.bgColorDark} space-y-3 transition-all`}
              >
                {/* Group Title Header */}
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-hind">
                  {group.name}
                </h2>

                {/* Grid 2-Columns for Archive Cards (App Exact Match) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {group.cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      className={`relative min-h-[120px] sm:min-h-[140px] rounded-2xl bg-gradient-to-br ${card.bgGradient} p-3.5 sm:p-4 text-white shadow-md hover:shadow-lg transition-all transform active:scale-97 cursor-pointer flex flex-col justify-between overflow-hidden group`}
                    >
                      {/* Top Lock Badge or Check Badge */}
                      {!isPremium ? (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs border border-amber-300">
                          <Lock className="w-3 h-3 text-slate-950" />
                          <span>লকড</span>
                        </div>
                      ) : card.hasCheckBadge ? (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                        </div>
                      ) : null}

                      {/* Card Emblem / Logo Watermark */}
                      <div className="absolute -bottom-2 -right-2 opacity-20 group-hover:scale-110 transition-transform pointer-events-none">
                        {card.logoType === 'bank' && (
                          <div className="w-16 h-16 rounded-full border-4 border-white/40 flex items-center justify-center font-black text-xs">
                            BB
                          </div>
                        )}
                        {card.logoType === 'iba' && (
                          <div className="w-16 h-16 rounded-full border-4 border-white/40 flex items-center justify-center font-black text-xs">
                            IBA
                          </div>
                        )}
                        {card.logoType === 'yinyang' && (
                          <div className="w-16 h-16 rounded-full border-4 border-white/40 flex items-center justify-center font-black text-xs">
                            ☯
                          </div>
                        )}
                        {card.logoType === 'railway' && (
                          <div className="w-16 h-16 rounded-full border-4 border-white/40 flex items-center justify-center font-black text-xs">
                            BR
                          </div>
                        )}
                        {(!card.logoType || card.logoType === 'gov' || card.logoType === 'check' || card.logoType === 'electricity') && (
                          <div className="w-20 h-20 rounded-full border-8 border-white/20 flex items-center justify-center font-black text-lg">
                            🇧🇩
                          </div>
                        )}
                      </div>

                      {/* Main Title */}
                      <div className="space-y-1 relative z-10 pt-1">
                        <h3 className="text-base sm:text-lg font-black tracking-tight font-hind leading-snug drop-shadow-xs">
                          {card.title}
                        </h3>
                      </div>

                      {/* Bottom Pencil Count Badge */}
                      <div className="relative z-10 pt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-slate-900 font-black text-xs sm:text-sm shadow-xs border border-white/50">
                          <Pencil className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                          <span>{toBengaliNumeral(card.count)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                কোনো আর্কাইভ প্রশ্নব্যাংক খুঁজে পাওয়া যায়নি
              </p>
            </div>
          )}
        </div>

      {/* Circular Detail Modal */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveJobModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>পিছনে</span>
              </button>
              <button
                onClick={() => setActiveJobModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                {activeJobModal.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeJobModal.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Building2 className="w-4 h-4 text-[#046A38]" />
                {activeJobModal.organization}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl grid grid-cols-2 gap-3 text-xs text-slate-800 dark:text-slate-200">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">পদবী</p>
                <p className="font-bold">{activeJobModal.designation}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">মোট খালি পদ</p>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">{activeJobModal.vacancyCount}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">আবেদনের শেষ তারিখ</p>
                <p className="font-bold text-rose-700 dark:text-rose-400">{activeJobModal.deadline}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">বেতন স্কেল</p>
                <p className="font-bold">{activeJobModal.salaryRange}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">বিবরণ ও বিবরণী:</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                {activeJobModal.description}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">আবশ্যকীয় যোগ্যতা ও শর্তাবলি:</h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {activeJobModal.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#046A38] shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 justify-between">
              {activeJobModal.applyUrl && (
                <a
                  href={activeJobModal.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#046A38] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>অফিশিয়াল লিংকে আবেদন করুন</span>
                </a>
              )}

              {onStartModelTestForCategory && (
                <button
                  onClick={() => {
                    setActiveJobModal(null);
                    onStartModelTestForCategory(activeJobModal.category);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>এই সার্কুলারের প্রাক-প্রস্তুতি টেস্ট দিন</span>
                </button>
              )}
            </div>
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
