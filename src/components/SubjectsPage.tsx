import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap,
  BookOpen, 
  BookMarked,
  BookText,
  ScrollText,
  Library,
  BookOpenCheck,
  Search, 
  Sparkles,
  Clock,
  ListOrdered,
  X,
  Check,
  ArrowLeft,
  Crown,
  Lock,
  Zap,
  CheckCircle2,
  HelpCircle,
  Layers,
  Flame,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { MAIN_SUBJECT_POSTS, MainSubjectPost } from '../lib/subjects';
import { 
  isUserPremium, 
  setUserPremium, 
  toBengaliNumeral, 
  getUserProfile, 
  getUnlockedPostIds, 
  isPostUnlocked, 
  getPendingPostIds, 
  isPostPending,
  unlockPosts 
} from '../lib/utils';
import { fetchEnrollmentsFromSupabase, fetchSubjectPostsFromSupabase } from '../lib/supabase';
import { SubscriptionPackages } from './SubscriptionPackages';
import { CourseEnrollmentRecord } from '../types';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; topic?: string; questionCount?: number; timeMinutes?: number }) => void;
  onOpenCourses?: () => void;
}

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  BookOpenCheck,
  BookMarked,
  ScrollText,
  BookText,
  BookOpen,
  Library,
  GraduationCap
};

const TOPIC_ICONS = [
  BookOpenCheck,
  BookMarked,
  ScrollText,
  BookText,
  BookOpen,
  Library,
  GraduationCap,
  Bookmark
];

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onSelectSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic posts from Supabase or built-in default
  const [subjectPosts, setSubjectPosts] = useState<MainSubjectPost[]>(() => {
    try {
      const cached = localStorage.getItem('tamreen_custom_subject_posts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MAIN_SUBJECT_POSTS;
  });

  // Unlocked & Pending Posts
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>(() => getUnlockedPostIds());
  const [pendingPosts, setPendingPostsState] = useState<string[]>(() => getPendingPostIds());

  // Global premium fallback
  const [isGlobalPremium, setIsGlobalPremium] = useState<boolean>(() => isUserPremium());

  // Navigation inside post: when a post is clicked and unlocked, show its topics
  const [selectedPostForTopics, setSelectedPostForTopics] = useState<MainSubjectPost | null>(null);

  // Active topic & exam config modal state
  const [selectedTopicForExam, setSelectedTopicForExam] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);
  
  // Modals & Inline View State
  const [showInlinePackages, setShowInlinePackages] = useState<boolean>(false);
  const [preselectedPostForPurchase, setPreselectedPostForPurchase] = useState<string | undefined>(undefined);
  const [pendingTrxId, setPendingTrxId] = useState<string>(() => localStorage.getItem('tamreen_premium_trx') || '');

  // Refresh unlocked posts state
  const refreshAccessState = useCallback(() => {
    const unlocked = getUnlockedPostIds();
    setUnlockedPosts(unlocked);
    const pending = getPendingPostIds();
    setPendingPostsState(pending);
    setIsGlobalPremium(isUserPremium());
  }, []);

  // Check enrollment from Supabase & LocalStorage
  const checkRemoteEnrollments = useCallback(async () => {
    try {
      const res = await fetchEnrollmentsFromSupabase();
      const user = getUserProfile();
      const userPhone = user?.phone?.trim();

      const allEnrollments: CourseEnrollmentRecord[] = res.enrollments || [];
      
      // Also check local
      try {
        const local = JSON.parse(localStorage.getItem('tamreen_enrollments') || '[]');
        if (Array.isArray(local)) {
          local.forEach(l => {
            if (!allEnrollments.some(e => e.transaction_id === l.transaction_id)) {
              allEnrollments.push(l);
            }
          });
        }
      } catch {}

      // Find user enrollments
      const newlyUnlocked: string[] = [];
      const newlyPending: string[] = [];

      allEnrollments.forEach((e) => {
        if (!e) return;
        const cId = String(e.course_id || '').toLowerCase();
        const cTitle = String(e.course_title || '');

        MAIN_SUBJECT_POSTS.forEach((post) => {
          const isPostMatch = cId.includes(post.id) || cTitle.includes(post.name) || cTitle.includes(post.code);
          const isGlobalMatch = cId.startsWith('tamreen_premium') || cId.includes('all') || cTitle.includes('১৫টি বিষয়ভিত্তিক');

          if (isPostMatch || isGlobalMatch) {
            if (e.status === 'approved') {
              newlyUnlocked.push(post.id);
            } else if (e.status === 'pending') {
              newlyPending.push(post.id);
              if (e.transaction_id) {
                setPendingTrxId(e.transaction_id);
              }
            }
          }
        });
      });

      if (newlyUnlocked.length > 0) {
        unlockPosts(newlyUnlocked);
        refreshAccessState();
      }
    } catch (err) {
      console.error('Error verifying post enrollments:', err);
    }
  }, [refreshAccessState]);

  useEffect(() => {
    checkRemoteEnrollments();

    // Fetch dynamic subject posts from Supabase
    fetchSubjectPostsFromSupabase().then((posts) => {
      if (posts && posts.length > 0) {
        setSubjectPosts(posts);
      }
    });

    const handleUnlockedUpdate = () => {
      refreshAccessState();
    };

    window.addEventListener('tamreen_unlocked_posts_updated', handleUnlockedUpdate);
    window.addEventListener('tamreen_premium_updated', handleUnlockedUpdate);
    window.addEventListener('tamreen_premium_status_changed', handleUnlockedUpdate);
    window.addEventListener('tamreen_enrollments_updated', checkRemoteEnrollments);

    return () => {
      window.removeEventListener('tamreen_unlocked_posts_updated', handleUnlockedUpdate);
      window.removeEventListener('tamreen_premium_updated', handleUnlockedUpdate);
      window.removeEventListener('tamreen_premium_status_changed', handleUnlockedUpdate);
      window.removeEventListener('tamreen_enrollments_updated', checkRemoteEnrollments);
    };
  }, [checkRemoteEnrollments, refreshAccessState]);

  // Check if a specific post is unlocked
  const isPostActive = (postId: string) => {
    return unlockedPosts.includes(postId);
  };

  const isPostAwaitingApproval = (postId: string) => {
    return pendingPosts.includes(postId) && !unlockedPosts.includes(postId);
  };

  // Filter the special exam posts based on search
  const filteredPosts = subjectPosts.filter(post => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      post.name.toLowerCase().includes(query) ||
      post.badge.toLowerCase().includes(query) ||
      post.subtitle.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.topics.some(t => t.toLowerCase().includes(query))
    );
  });

  // Handle clicking on a post card
  const handlePostCardClick = (post: MainSubjectPost) => {
    if (isPostActive(post.id)) {
      // Unlocked: Enter topics view!
      setSelectedPostForTopics(post);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Locked or Pending: Open package purchase with this post pre-selected
      setPreselectedPostForPurchase(post.id);
      setShowInlinePackages(true);
      setTimeout(() => {
        const el = document.getElementById('subscription-packages-container');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Start exam from modal (specific topic or all topics)
  const handleStartExam = () => {
    if (!selectedPostForTopics) return;
    
    onSelectSubject({
      subject: selectedPostForTopics.name,
      topic: selectedTopicForExam || undefined,
      questionCount,
      timeMinutes,
    });

    setSelectedTopicForExam(null);
  };

  // Quick Unlock Demo helper for user satisfaction
  const handleInstantUnlockDemo = (postId: string) => {
    unlockPosts([postId]);
    refreshAccessState();
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 mb-24 space-y-5">
      
      {/* 1. TOP STATUS / SUMMARY CARD */}
      <div className="neu-card !rounded-3xl p-5 sm:p-7 relative overflow-hidden border border-emerald-300/70 dark:border-emerald-700/50 bg-gradient-to-b from-[#F0FDF4]/90 via-[#F8FAFC]/90 to-white dark:from-[#06291C]/60 dark:via-[#0A1A2F]/80 dark:to-[#0B132B]">
        
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowInlinePackages(prev => !prev);
                setTimeout(() => {
                  const el = document.getElementById('subscription-packages-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="text-xs font-black px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs border cursor-pointer hover:scale-[1.02] active:scale-95 transition-all bg-emerald-100/90 dark:bg-emerald-950/80 text-[#064E3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {unlockedPosts.length > 0
                  ? `আপনার আনলককৃত পদ: ${toBengaliNumeral(unlockedPosts.length)}টি`
                  : 'পদভিত্তিক সাবস্ক্রিপশন (আনলক করুন)'}
              </span>
            </button>

            <span className="text-xs font-black px-3 py-1.5 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>মাদ্রাসা ও নিবন্ধন স্পেশাল</span>
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#064E3B] dark:text-emerald-400 font-hind tracking-tight leading-snug">
          {selectedPostForTopics ? selectedPostForTopics.name : 'পদভিত্তিক স্পেশাল প্রস্তুতি'}
        </h1>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
          {selectedPostForTopics ? (
            <span>
              সিলেবাসের যেকোনো টপিক বাটনে ক্লিক করে সেই নির্দিষ্ট টপিকের উপর মডেল টেস্ট দিন। অথবা সম্পূর্ণ সিলেবাস সমন্বয় করে ফুল টেস্ট দিন।
            </span>
          ) : (
            <span>
              প্রত্যেক পদের জন্য আলাদা আলাদা প্যাকেজ। একটি ক্রয় করলে বাকিগুলো লক থাকবে। একাধিক পদ সিলেক্ট করলে নির্ধারিত প্যাকেজ ফি যোগ হবে।
            </span>
          )}
        </p>

        {/* Bottom Strip */}
        <div className="mt-4 pt-3.5 border-t border-emerald-200/70 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] dark:text-emerald-300">
            {unlockedPosts.length > 0 ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>
                  {toBengaliNumeral(unlockedPosts.length)}টি পদ সম্পূর্ণ সক্রিয় ও টপিকভিত্তিক টেস্ট চালু আছে
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span className="text-amber-800 dark:text-amber-300">
                  পছন্দের পদটি নির্বাচন করে আনলক করুন
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowInlinePackages(prev => !prev);
                setTimeout(() => {
                  const el = document.getElementById('subscription-packages-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="neu-pill !rounded-2xl px-4 py-2 text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 active:scale-95 transition-all shadow-xs border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {showInlinePackages ? 'প্যাকেজ লুকান' : 'নতুন পদ আনলক করুন'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEW 1: SUBSCRIPTION PACKAGES PURCHASE */}
      {showInlinePackages ? (
        <SubscriptionPackages
          isPremium={isGlobalPremium}
          isPending={pendingPosts.length > 0}
          pendingTrxId={pendingTrxId || undefined}
          initialSelectedPostId={preselectedPostForPurchase}
          unlockedPostIds={unlockedPosts}
          onClose={() => setShowInlinePackages(false)}
          onEnrollmentSuccess={(record, posts) => {
            setPendingTrxId(record.transaction_id);
            setPendingPostsState(prev => Array.from(new Set([...prev, ...posts])));
          }}
        />
      ) : selectedPostForTopics ? (
        
        /* 3. CONDITIONAL VIEW 2: INSIDE UNLOCKED POST - SYLLABUS TOPICS AS BUTTONS */
        <div className="space-y-5 animate-fade-in">
          
          {/* Post Header with Back Button */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedPostForTopics(null)}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#046A38] dark:text-emerald-400 stroke-[2.5]" />
              <span>← সকল পদে ফিরে যান</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>আনলকড পদ</span>
              </span>
            </div>
          </div>

          {/* Master Full-Length Combined Model Test Button */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-[#046A38] to-teal-700 text-white shadow-md space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 inline-flex items-center gap-1 shadow-2xs mb-1">
                  <Flame className="w-3 h-3 fill-slate-950" />
                  মাস্টার মডেল টেস্ট
                </span>
                <h3 className="text-base sm:text-lg font-black font-hind leading-snug">
                  {selectedPostForTopics.name} - সম্পূর্ণ সিলেবাস কম্বাইন্ড টেস্ট
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  সকল টপিকের সমন্বয়ে পূর্ণাঙ্গ শিক্ষক নিবন্ধন প্রশ্নের আদলে তৈরি মডেল টেস্ট।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTopicForExam(null); // All topics
                  setQuestionCount(50);
                  setTimeMinutes(30);
                  // Open modal for config
                  const modalTrigger = true;
                }}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shrink-0"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>ফুল মডেল টেস্ট শুরু করুন</span>
              </button>
            </div>
          </div>

          {/* Syllabus Topics Section Header */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-[#046A38] dark:text-emerald-400" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind">
                  সিলেবাসের টপিকসমূহ (যেকোনো টপিক বাটনে ক্লিক করে পরীক্ষা দিন)
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                মোট {toBengaliNumeral(selectedPostForTopics.topics.length)}টি টপিক
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              নির্দিষ্ট বিষয়ে নিজেকে যাচাই করতে নিচের যেকোনো টপিক নির্বাচন করুন:
            </p>
          </div>

          {/* TOPIC BUTTONS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {selectedPostForTopics.topics.map((topicName, idx) => {
              const TopicIcon = TOPIC_ICONS[idx % TOPIC_ICONS.length] || BookOpen;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedTopicForExam(topicName);
                    setQuestionCount(25);
                    setTimeMinutes(20);
                  }}
                  className="p-4 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md active:scale-98 transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#046A38] dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-[#046A38] group-hover:text-white transition-all shadow-2xs">
                      <TopicIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 block mb-0.5">
                        টপিক {toBengaliNumeral(idx + 1)}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-hind group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                        {topicName}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 group-hover:bg-[#046A38] group-hover:text-white px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all">
                    <span>পরীক্ষা</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* 4. CONDITIONAL VIEW 3: 6 POST CARDS 2-COLUMN GRID */
        <>
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="স্পেশাল এক্সাম বা বিষয় খুঁজুন (যেমন: আরবি প্রভাষক, সহকারী মৌলভী, জেনারেল)..."
              className="neu-inset w-full !rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
            />
          </div>

          {/* 6 SUBJECT POSTS 2-COLUMN GRID */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {filteredPosts.map((post) => {
              const isUnlocked = isPostActive(post.id);
              const isPending = isPostAwaitingApproval(post.id);
              const IconComponent = ICON_COMPONENTS[post.iconName] || GraduationCap;

              return (
                <div
                  key={post.id}
                  id={`subject-card-${post.id}`}
                  onClick={() => handlePostCardClick(post)}
                  className={`neu-card !rounded-2xl sm:!rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group relative border min-h-[145px] sm:min-h-[175px] ${
                    isUnlocked
                      ? 'border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-500 shadow-xs'
                      : isPending
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
                  }`}
                >
                  {/* Top-Right Status Badge / Lock Indicator */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5">
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                        <span className="hidden sm:inline">আনলকড</span>
                      </span>
                    ) : isPending ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                        <span className="hidden sm:inline">পেন্ডিং</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-700/80 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                        <Lock className="w-3 h-3 fill-amber-500/30 text-amber-600" />
                        <span className="hidden sm:inline">লক করা</span>
                      </span>
                    )}
                  </div>

                  {/* Icon */}
                  <div 
                    className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl ${post.gradientClass} flex items-center justify-center text-white shadow-md group-hover:scale-108 group-hover:shadow-xl active:scale-95 transition-all duration-300 my-1`}
                  >
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.2] drop-shadow-xs" />
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 font-hind tracking-normal leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors px-1">
                    {post.name}
                  </h3>

                  {/* Action prompt */}
                  <span className={`text-[11px] font-black mt-1.5 inline-flex items-center gap-1 ${
                    isUnlocked 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {isUnlocked ? 'টপিকসমূহ দেখুন →' : 'প্যাক আনলক করুন 🔒'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 5. TOPIC EXAM CONFIGURATION MODAL */}
      {(selectedTopicForExam !== null || (selectedPostForTopics && false)) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="neu-card max-w-md w-full p-6 relative shadow-2xl space-y-5 bg-white dark:bg-[#121E36] border border-emerald-200/80 dark:border-emerald-800/60">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  মডেল টেস্ট কনফিগারেশন
                </span>
              </div>
              <button
                onClick={() => setSelectedTopicForExam(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Topic Info */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                {selectedPostForTopics?.name}
              </span>
              <h3 className="text-base font-black text-[#064E3B] dark:text-emerald-300 mt-0.5 font-hind">
                {selectedTopicForExam || 'সকল টপিক সমন্বিত পূর্ণাঙ্গ মডেল টেস্ট'}
              </h3>
            </div>

            {/* Question Count Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>কতটি প্রশ্ন অনুশীলন করতে চান?</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                      questionCount === num
                        ? 'bg-[#046A38] text-white border-[#046A38] shadow-md scale-102'
                        : 'neu-pill text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-400'
                    }`}
                  >
                    {toBengaliNumeral(num)}টি
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>সময়সীমা (মিনিট)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeMinutes(mins)}
                    className={`py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                      timeMinutes === mins
                        ? 'bg-[#046A38] text-white border-[#046A38] shadow-md scale-102'
                        : 'neu-pill text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-400'
                    }`}
                  >
                    {toBengaliNumeral(mins)} মিনিট
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartExam}
              className="w-full py-3.5 rounded-2xl bg-[#046A38] hover:bg-[#03532B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>
                পরীক্ষা শুরু করুন ({toBengaliNumeral(questionCount)} প্রশ্ন • {toBengaliNumeral(timeMinutes)} মিনিট)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
