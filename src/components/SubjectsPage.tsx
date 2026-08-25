import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap,
  BookOpen, 
  Users, 
  Volume2, 
  Layers, 
  Search, 
  Sparkles,
  Clock,
  ListOrdered,
  X,
  Check,
  ArrowLeft,
  Crown,
  Lock,
  ChevronRight,
  Zap,
  CheckCircle2,
  HelpCircle,
  BookOpenCheck
} from 'lucide-react';
import { MAIN_SUBJECT_POSTS, MainSubjectPost } from '../lib/subjects';
import { isUserPremium, setUserPremium, toBengaliNumeral, getUserProfile } from '../lib/utils';
import { fetchEnrollmentsFromSupabase } from '../lib/supabase';
import { SubscriptionPackages } from './SubscriptionPackages';
import { CourseEnrollmentRecord } from '../types';

interface SubjectsPageProps {
  onSelectSubject: (options: { subject: string; questionCount?: number; timeMinutes?: number }) => void;
  onOpenCourses?: () => void;
}

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  Users,
  Volume2,
  Layers,
  BookOpenCheck
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onSelectSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<MainSubjectPost | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);
  
  // Premium status state: 'approved' | 'pending' | 'none' | 'rejected'
  const [premiumStatus, setPremiumStatus] = useState<'approved' | 'pending' | 'none' | 'rejected'>(() => {
    if (isUserPremium()) return 'approved';
    const cachedStatus = localStorage.getItem('tamreen_premium_status');
    if (cachedStatus === 'pending') return 'pending';
    if (cachedStatus === 'rejected') return 'rejected';
    return 'none';
  });

  const isPremium = premiumStatus === 'approved';
  const isPending = premiumStatus === 'pending';

  // Modals and Inline View State
  const [showInlinePackages, setShowInlinePackages] = useState<boolean>(false);
  const [pendingTrxId, setPendingTrxId] = useState<string>(() => localStorage.getItem('tamreen_premium_trx') || '');

  // Check enrollment from Supabase & LocalStorage
  const checkRemotePremiumStatus = useCallback(async () => {
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

      // Find premium application with complete null-safety
      const premiumApp = allEnrollments.find(e => {
        if (!e) return false;
        const cId = String(e.course_id || '').toLowerCase();
        const cTitle = String(e.course_title || '');
        const ePhone = String(e.phone_number || '').trim();

        const isPremiumCourseId = cId.startsWith('tamreen_premium') || cId === 'tamreen_premium_package';
        const isPremiumCourseTitle = cTitle.includes('বিষয়ভিত্তিক') || cTitle.includes('প্রিমিয়াম');
        const isUserMatch = Boolean(userPhone && ePhone && (ePhone === userPhone || ePhone.includes(userPhone) || userPhone.includes(ePhone)));

        return isPremiumCourseId || isPremiumCourseTitle || (isUserMatch && isPremiumCourseId);
      });

      if (premiumApp) {
        if (premiumApp.status === 'approved') {
          setPremiumStatus('approved');
          setUserPremium(true);
          localStorage.setItem('tamreen_premium_status', 'approved');
        } else if (premiumApp.status === 'pending') {
          setPremiumStatus('pending');
          setUserPremium(false);
          localStorage.setItem('tamreen_premium_status', 'pending');
          if (premiumApp.transaction_id) {
            setPendingTrxId(premiumApp.transaction_id);
            localStorage.setItem('tamreen_premium_trx', premiumApp.transaction_id);
          }
        } else if (premiumApp.status === 'rejected') {
          setPremiumStatus('rejected');
          setUserPremium(false);
          localStorage.setItem('tamreen_premium_status', 'rejected');
        }
      } else {
        // Fallback to local isUserPremium
        if (isUserPremium()) {
          setPremiumStatus('approved');
        } else {
          const localStatus = localStorage.getItem('tamreen_premium_status');
          if (localStatus === 'pending') setPremiumStatus('pending');
          else setPremiumStatus('none');
        }
      }
    } catch (err) {
      console.error('Error verifying premium status:', err);
    }
  }, []);

  useEffect(() => {
    checkRemotePremiumStatus();

    const handlePremiumUpdate = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setPremiumStatus(e.detail ? 'approved' : 'none');
      } else if (typeof e.detail === 'string') {
        setPremiumStatus(e.detail as any);
      } else {
        checkRemotePremiumStatus();
      }
    };

    window.addEventListener('tamreen_premium_updated', handlePremiumUpdate);
    window.addEventListener('tamreen_premium_status_changed', handlePremiumUpdate);
    window.addEventListener('tamreen_enrollments_updated', checkRemotePremiumStatus);

    return () => {
      window.removeEventListener('tamreen_premium_updated', handlePremiumUpdate);
      window.removeEventListener('tamreen_premium_status_changed', handlePremiumUpdate);
      window.removeEventListener('tamreen_enrollments_updated', checkRemotePremiumStatus);
    };
  }, [checkRemotePremiumStatus]);

  // Filter the 5 main categories based on search
  const filteredPosts = MAIN_SUBJECT_POSTS.filter(post => {
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

  const handlePostClick = (post: MainSubjectPost) => {
    if (isPending) {
      setShowInlinePackages(true);
      setTimeout(() => {
        const el = document.getElementById('subscription-packages-container');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    if (!isPremium) {
      setShowInlinePackages(true);
      setTimeout(() => {
        const el = document.getElementById('subscription-packages-container');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    setSelectedPost(post);
  };

  const handleStartExamFromModal = () => {
    if (!selectedPost) return;
    onSelectSubject({
      subject: selectedPost.name,
      questionCount,
      timeMinutes,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 mb-24 space-y-5">
      
      {/* 1. TOP GREEN THEMED STATUS CARD */}
      <div className="neu-card !rounded-3xl p-5 sm:p-7 relative overflow-hidden border border-emerald-300/70 dark:border-emerald-700/50 bg-gradient-to-b from-[#F0FDF4]/90 via-[#F8FAFC]/90 to-white dark:from-[#06291C]/60 dark:via-[#0A1A2F]/80 dark:to-[#0B132B]">
        
        {/* Pills Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill 1: Status Pill (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setShowInlinePackages(prev => !prev);
                setTimeout(() => {
                  const el = document.getElementById('subscription-packages-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className={`text-xs font-black px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-xs border cursor-pointer hover:scale-[1.03] active:scale-95 transition-all ${
                isPremium
                  ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-[#064E3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                  : isPending
                  ? 'bg-amber-100/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-700 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>সক্রিয় প্যাকেজ: বাৎসরিক প্যাকেজ (সক্রিয়)</span>
                </>
              ) : isPending ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>পেমেন্ট যাচাইাধীন (Pending)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ফ্রি একাউন্ট (প্যাকেজ আনলক করুন)</span>
                </>
              )}
            </button>

            {/* Pill 2: 5 Post Categories Badge */}
            <button
              type="button"
              onClick={() => {
                setShowInlinePackages(true);
                setTimeout(() => {
                  const el = document.getElementById('subscription-packages-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="text-xs font-black px-3.5 py-1.5 bg-emerald-100/90 dark:bg-emerald-950/80 text-[#064E3B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-full inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.03] active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>মাদ্রাসা ও নিবন্ধন বিশেষ প্রস্তুতি</span>
            </button>
          </div>
        </div>

        {/* Heading in Bold Green */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#064E3B] dark:text-emerald-400 font-hind tracking-tight leading-snug">
          বিষয়ভিত্তিক ও পদভিত্তিক প্রস্তুতি
        </h1>

        {/* Description Text */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
          {isPremium ? (
            'আপনার প্রিমিয়াম মেম্বারশিপের আওতায় আরবি প্রভাষক, সহকারী মৌলভী, ইবতেদায়ি মৌলভী, ইবতেদায়ি কারী ও জেনারেল বিষয়ের ৫,০০০+ প্রশ্নব্যাংক সম্পূর্ণ আনলক রয়েছে। নিচের যেকোনো ক্যাটাগরিতে ক্লিক করে অনুশীলন শুরু করুন।'
          ) : isPending ? (
            `আপনার বিকাশ/নগদ TrxID (${pendingTrxId || 'যাচাইাধীন'}) ডাটাবেসে সফলভাবে জমা হয়েছে। এডমিন প্যানেল থেকে অনুমোদন করলেই সকল বিষয়ের পূর্ণাঙ্গ প্রশ্নব্যাংক সক্রিয় হয়ে যাবে।`
          ) : (
            'আপনার অ্যাকাউন্টে বর্তমানে বিষয়ভিত্তিক প্রশ্নব্যাংক লক রয়েছে। মাসিক, ত্রৈমাসিক, ষান্মাসিক বা বাৎসরিক প্রিমিয়াম প্যাকেজ বেছে নিয়ে বিকাশ/নগদে ফি পাঠিয়ে TrxID প্রদান করুন। এডমিন অনুমোদন করলেই সম্পূর্ণ প্রশ্নব্যাংক আনলক হয়ে যাবে।'
          )}
        </p>

        {/* Divider & Bottom Status Strip */}
        <div className="mt-4 pt-3.5 border-t border-emerald-200/70 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] dark:text-emerald-300">
            {isPremium ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>সকল বিষয়ের প্রশ্ন ও ব্যাখ্যা সম্পূর্ণ আনলকড</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">(প্রিমিয়াম মেম্বারশিপ সক্রিয়)</span>
              </>
            ) : isPending ? (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 animate-spin">
                  <Clock className="w-2.5 h-2.5" />
                </div>
                <span className="text-amber-800 dark:text-amber-300">
                  আবেদন স্ট্যাটাস: পেন্ডিং (এডমিন যাচাই চলছে)
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span className="text-amber-800 dark:text-amber-300">বিষয়ভিত্তিক প্রশ্নব্যাংক বর্তমানে লক করা</span>
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
                {showInlinePackages
                  ? 'প্যাকেজ লুকান'
                  : isPremium
                  ? 'প্যাকেজ বিবরণ'
                  : isPending
                  ? 'পেমেন্ট তথ্য ও প্যাকেজ'
                  : 'প্যাকেজসমূহ দেখুন ও আনলক করুন'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEW: DIRECT SUBSCRIPTION PACKAGES OR 5 BUTTONS LIST */}
      {showInlinePackages ? (
        <SubscriptionPackages
          isPremium={isPremium}
          isPending={isPending}
          pendingTrxId={pendingTrxId || undefined}
          onClose={() => setShowInlinePackages(false)}
          onEnrollmentSuccess={(record) => {
            setPendingTrxId(record.transaction_id);
            setPremiumStatus('pending');
          }}
        />
      ) : (
        <>
          {/* 3. NEUMORPHIC INSET SEARCH BAR */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পদ বা বিষয় খুঁজুন (যেমন: আরবি প্রভাষক, সহকারী মৌলভী, তাজবীদ, গণিত)..."
              className="neu-inset w-full !rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
            />
          </div>

          {/* 4. THE 5 PROFESSIONAL NEUMORPHIC BUTTONS / CARDS */}
          <div className="space-y-3.5 sm:space-y-4">
            {filteredPosts.map((post) => {
              const IconComponent = ICON_COMPONENTS[post.iconName] || BookOpen;

              return (
                <div
                  key={post.id}
                  id={`subject-card-${post.id}`}
                  onClick={() => handlePostClick(post)}
                  className={`neu-card !rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group border relative overflow-hidden ${
                    isPremium 
                      ? 'border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400/70 hover:shadow-lg' 
                      : isPending
                      ? 'border-amber-300/80 dark:border-amber-800/80 hover:border-amber-400'
                      : 'border-slate-200/70 dark:border-slate-800/70 hover:border-amber-400/60'
                  }`}
                >
                  {/* Subtle Top Gradient Accent Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${post.accentGradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

                  {/* Left & Middle Container */}
                  <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0 flex-1">
                    
                    {/* 3D Neumorphic Icon Box */}
                    <div 
                      className={`neu-icon-box w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center shrink-0 border ${post.lightBg} ${post.darkBg} group-hover:scale-105 transition-transform shadow-xs`}
                    >
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>

                    {/* Title, Badge & Subtitle */}
                    <div className="min-w-0 flex-1 space-y-1">
                      
                      {/* Badge Pill */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{post.badge}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                          • {post.tagline}
                        </span>
                      </div>

                      {/* Main Title */}
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-hind leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {post.name}
                      </h2>

                      {/* Subtitle / Topics Overview */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {post.subtitle}
                      </p>

                      {/* Micro Topic Chips */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        {post.topics.slice(0, 3).map((t, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
                          >
                            {t}
                          </span>
                        ))}
                        {post.topics.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            +{toBengaliNumeral(post.topics.length - 3)}টি টপিক
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Button (Neumorphic) */}
                  <div className="shrink-0 flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                    {isPremium ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                        className="neu-pill !rounded-2xl w-full sm:w-auto px-4 sm:px-5 py-2.5 text-[#046A38] dark:text-emerald-300 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        <Zap className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>অনুশীলন শুরু</span>
                        <ChevronRight className="w-4 h-4 text-[#046A38] dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ) : isPending ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                        className="neu-pill !rounded-2xl w-full sm:w-auto px-4 sm:px-4.5 py-2.5 text-amber-800 dark:text-amber-300 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400/80 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/50 hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>যাচাইাধীন</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                        className="neu-pill !rounded-2xl w-full sm:w-auto px-4 sm:px-4.5 py-2.5 text-amber-800 dark:text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>লক করা (আনলক করুন)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 5. QUESTION COUNT & TIME LIMIT CONFIG MODAL (Unlocked State) */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="neu-card max-w-md w-full p-6 relative shadow-2xl space-y-5 bg-white dark:bg-[#121E36] border border-emerald-200/80 dark:border-emerald-800/60">
            
            {/* Header with Top-Left Back Button and Right Close Button */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>পিছনে</span>
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Post Title */}
            <div>
              <span className="text-[11px] font-bold text-[#064E3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {selectedPost.badge}
              </span>
              <h3 className="text-xl font-black text-[#064E3B] dark:text-emerald-400 mt-1.5 font-hind">
                {selectedPost.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                {selectedPost.subtitle}
              </p>
            </div>

            {/* Questions Count Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>কতটি প্রশ্ন প্র্যাকটিস করতে চান?</span>
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

            {/* Time Limit Config */}
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
              onClick={handleStartExamFromModal}
              className="w-full py-3.5 rounded-2xl bg-[#046A38] hover:bg-[#03532B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>অনুশীলন শুরু করুন ({toBengaliNumeral(questionCount)} প্রশ্ন • {toBengaliNumeral(timeMinutes)} মিনিট)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
