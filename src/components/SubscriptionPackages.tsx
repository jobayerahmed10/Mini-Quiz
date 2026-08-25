import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  ChevronUp,
  CreditCard,
  Copy,
  BookOpenCheck,
  BookMarked,
  ScrollText,
  BookText,
  BookOpen,
  Library,
  GraduationCap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CourseEnrollmentRecord } from '../types';
import { submitEnrollmentToSupabase, fetchSubjectPostsFromSupabase } from '../lib/supabase';
import { getUserProfile, toBengaliNumeral, setPendingPosts, unlockPosts } from '../lib/utils';
import { MAIN_SUBJECT_POSTS, MainSubjectPost } from '../lib/subjects';

export interface SubscriptionPackageItem {
  id: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  title: string;
  shortName: string;
  durationLabel: string;
  durationMonths: number;
  price: string;
  regularPrice: string;
  discountPercentage: string;
  badge: string;
  badgeStyle: string;
  highlighted?: boolean;
  features: string[];
  description: string;
}

export const SUBSCRIPTION_PACKAGES_DATA: SubscriptionPackageItem[] = [
  {
    id: 'monthly',
    title: 'মাসিক প্রিমিয়াম প্যাকেজ',
    shortName: 'মাসিক',
    durationLabel: '১ মাস (৩০ দিন)',
    durationMonths: 1,
    price: '৯৯',
    regularPrice: '১৯৯',
    discountPercentage: '৫০% ছাড়',
    badge: 'ট্রায়াল প্যাক',
    badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
    description: 'স্বল্পমেয়াদী ট্রায়াল ও দ্রুত রিভিশন প্রস্তুতি',
    features: [
      'সিলেবাসভিত্তিক অধ্যায় ও টপিক প্রশ্নব্যাংক',
      'প্রতি প্রশ্নের রেফারেন্স ও নির্ভুল ব্যাখ্যা',
      '১০, ২৫ ও ৫০ নম্বরের কাস্টম মডেল টেস্ট',
      '৩০ দিনের ফুল আনলক অ্যাক্সেস'
    ]
  },
  {
    id: 'quarterly',
    title: 'ত্রৈমাসিক প্রিমিয়াম প্যাকেজ',
    shortName: 'ত্রৈমাসিক',
    durationLabel: '৩ মাস (৯০ দিন)',
    durationMonths: 3,
    price: '১৮০',
    regularPrice: '৩৫০',
    discountPercentage: '৪৮% ছাড়',
    badge: 'বাজেট সেভার',
    badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    description: 'ধারাবাহিক অনুশীলন ও পদভিত্তিক পূর্ণ প্রস্তুতি',
    features: [
      'পদের সকল টপিকভিত্তিক ৫,০০০+ প্রশ্ন ও নির্ভুল ব্যাখ্যা',
      'আনলিমিটেড বিষয়ভিত্তিক ও কম্বাইন্ড মডেল টেস্ট',
      'তামরীন AI ডাউট সলভ ও রিয়েলটাইম রেজাল্ট',
      '৯০ দিনের ফুল অ্যাক্সেস'
    ]
  },
  {
    id: 'half_yearly',
    title: 'ষান্মাসিক প্রিমিয়াম প্যাকেজ',
    shortName: 'ষান্মাসিক',
    durationLabel: '৬ মাস (১৮০ দিন)',
    durationMonths: 6,
    price: '২৭০',
    regularPrice: '৫৫০',
    discountPercentage: '৫১% ছাড়',
    badge: 'জনপ্রিয় পছন্দ',
    badgeStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    description: 'নিবিড় প্রস্তুতি ও শিক্ষক নিবন্ধন পূর্ণ সিলেবাস কভার',
    features: [
      'সিলেবাসের সকল টপিকের বিস্তারিত ব্যাখ্যা আনলক',
      '১০০ নম্বরের স্ট্যান্ডার্ড শিক্ষক নিবন্ধন ফুল টেস্ট',
      'ভুল উত্তরের স্বয়ংক্রিয় রিভিশন ও পারফর্ম্যান্স ট্র্যাকিং',
      '১৮০ দিনের ফুল অ্যাক্সেস'
    ]
  },
  {
    id: 'yearly',
    title: 'বাৎসরিক মেম্বারশিপ প্যাকেজ',
    shortName: 'বাৎসরিক',
    durationLabel: '১ বছর (৩৬৫ দিন)',
    durationMonths: 12,
    price: '৩৫০',
    regularPrice: '৭৫০',
    discountPercentage: '৫৩% ছাড়',
    badge: 'সেরা অফার',
    badgeStyle: 'bg-amber-400 text-slate-950 border-amber-500 font-black',
    highlighted: true,
    description: '৩৬৫ দিনের আনলিমিটেড অ্যাক্সেস ও নিশ্চিত সফলতা',
    features: [
      'সিলেবাসের সকল বর্তমান ও নতুন যুক্ত প্রশ্নব্যাংক',
      'আনলিমিটেড কাস্টম ও ফুল-লেংথ ১০০ মার্কস মডেল টেস্ট',
      'তামরীন AI ব্যাকরণ ও অনুবাদ স্মার্ট সলিউশন',
      '৩৬৫ দিনের আনলিমিটেড লাইফটাইম-লাইক অ্যাক্সেস'
    ]
  }
];

const POST_ICON_MAP: Record<string, React.ElementType> = {
  BookOpenCheck,
  BookMarked,
  ScrollText,
  BookText,
  BookOpen,
  Library,
  GraduationCap
};

interface SubscriptionPackagesProps {
  isPremium?: boolean;
  isPending?: boolean;
  pendingTrxId?: string;
  initialSelectedPostId?: string;
  unlockedPostIds?: string[];
  onEnrollmentSuccess?: (record: CourseEnrollmentRecord, selectedPostIds: string[]) => void;
  onClose?: () => void;
}

export const SubscriptionPackages: React.FC<SubscriptionPackagesProps> = ({
  isPremium = false,
  isPending = false,
  pendingTrxId,
  initialSelectedPostId,
  unlockedPostIds = [],
  onEnrollmentSuccess,
  onClose
}) => {
  const currentProfile = getUserProfile();

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

  useEffect(() => {
    fetchSubjectPostsFromSupabase().then((posts) => {
      if (posts && posts.length > 0) {
        setSubjectPosts(posts);
      }
    });
  }, []);

  // Selected package for inline checkout
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly'>('yearly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(true);
  
  // Selected post IDs for purchase (default: initialSelectedPostId or first post)
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>(() => {
    if (initialSelectedPostId) return [initialSelectedPostId];
    return ['assistant_moulvi'];
  });

  // Sync if initialSelectedPostId changes
  useEffect(() => {
    if (initialSelectedPostId && !selectedPostIds.includes(initialSelectedPostId)) {
      setSelectedPostIds(prev => Array.from(new Set([initialSelectedPostId, ...prev])));
    }
  }, [initialSelectedPostId]);

  // Checkout Form State
  const [studentName, setStudentName] = useState<string>(currentProfile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentProfile?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState<boolean>(false);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedPlan = SUBSCRIPTION_PACKAGES_DATA.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PACKAGES_DATA[3];

  const paymentNumber = '01779834999';

  // Toggle post selection
  const handleTogglePost = (postId: string) => {
    setSelectedPostIds((prev) => {
      if (prev.includes(postId)) {
        if (prev.length === 1) {
          // Keep at least one or allow unchecking
          return [];
        }
        return prev.filter((id) => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  };

  const handleSelectAllPosts = () => {
    setSelectedPostIds(subjectPosts.map(p => p.id));
  };

  const handleSelectSinglePost = (postId: string) => {
    setSelectedPostIds([postId]);
  };

  // Price calculations: 1 post = basePrice, 2 posts = 2 * basePrice (Double), etc.
  const basePriceNumber = Number(selectedPlan.price) || 350;
  const selectedCount = Math.max(1, selectedPostIds.length);
  const totalCalculatedAmount = selectedPostIds.length === 0 ? 0 : selectedPostIds.length * basePriceNumber;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleSelectPlan = (planId: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly') => {
    setSelectedPlanId(planId);
    setIsCheckoutOpen(true);
    setStatusMessage(null);
    const el = document.getElementById('inline-checkout-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSubmitInlineOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPostIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে অন্তত একটি পদ নির্বাচন করুন।' });
      return;
    }
    if (!studentName.trim()) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে আপনার নাম প্রদান করুন।' });
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 11) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।' });
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 5) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে সেন্ড মানি করার পর প্রাপ্ত TrxID প্রদান করুন।' });
      return;
    }
    if (!isConfirmedCheckbox) {
      setStatusMessage({ type: 'error', text: 'পেমেন্ট সম্পন্ন করেছেন তা নিশ্চিত করতে বক্সে টিক চিহ্ন দিন।' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const selectedPostNames = subjectPosts
      .filter(p => selectedPostIds.includes(p.id))
      .map(p => p.name);

    const enrollmentRecord: CourseEnrollmentRecord = {
      course_id: `tamreen_pkg_${selectedPlan.id}_${selectedPostIds.join('_')}`,
      course_title: `${selectedPostNames.join(' + ')} (${selectedPlan.title})`,
      student_name: studentName.trim(),
      phone_number: phoneNumber.trim(),
      payment_method: paymentMethod,
      amount: String(totalCalculatedAmount),
      transaction_id: transactionId.trim().toUpperCase(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 1. Submit to Supabase
    const res = await submitEnrollmentToSupabase(enrollmentRecord);

    // 2. Save locally in tamreen_enrollments
    try {
      const existing = JSON.parse(localStorage.getItem('tamreen_enrollments') || '[]');
      const filtered = existing.filter((item: any) => item?.transaction_id !== enrollmentRecord.transaction_id);
      const updated = [res.data || enrollmentRecord, ...filtered];
      localStorage.setItem('tamreen_enrollments', JSON.stringify(updated));
    } catch {}

    // 3. Mark selected posts as pending
    setPendingPosts(selectedPostIds);

    // 4. Also store plan info
    try {
      localStorage.setItem('tamreen_premium_status', 'pending');
      localStorage.setItem('tamreen_premium_plan', selectedPlan.id);
      localStorage.setItem('tamreen_premium_trx', enrollmentRecord.transaction_id);
      window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: 'pending' }));
    } catch {}

    setIsSubmitting(false);
    setStatusMessage({
      type: 'success',
      text: `আপনার নির্বাচিত ${selectedPostIds.length}টি পদের আবেদন সফলভাবে গৃহীত হয়েছে! TrxID: ${enrollmentRecord.transaction_id}`
    });

    if (onEnrollmentSuccess) {
      onEnrollmentSuccess(enrollmentRecord, selectedPostIds);
    }
  };

  return (
    <div className="space-y-5" id="subscription-packages-container">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-amber-50/60 dark:from-[#062013] dark:via-[#0D172A] dark:to-[#1A1705] border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
              <Crown className="w-3 h-3 fill-slate-950" />
              পদভিত্তিক প্যাকেজ
            </span>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              প্রত্যেক পদের জন্য স্বতন্ত্র আনলক সিস্টেম
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-hind">
            পদ নির্বাচন ও মেম্বারশিপ প্ল্যান বেছে নিন
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            একটি ক্রয় করলে বাকিগুলো লক থাকবে। একাধিক পদ সিলেক্ট করলে প্রতি পদের জন্য নির্ধারিত ফি যোগ হবে।
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
            >
              <span>পদ তালিকায় ফিরে যান</span>
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: POST SELECTION SECTION (Checkboxes for 6 Posts) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#046A38] text-white text-[11px] font-black flex items-center justify-center">
                ১
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind">
                যে যে পদ আনলক করতে চান সিলেক্ট করুন:
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              আপনি এক বা একাধিক পদ নির্বাচন করতে পারেন। প্রতিটি পদের জন্য আলাদা প্যাকেজ প্রযোজ্য।
            </p>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAllPosts}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 cursor-pointer transition-all"
            >
              সবগুলো পদ ({toBengaliNumeral(subjectPosts.length)}টি)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPostIds(['assistant_moulvi'])}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-all"
            >
              শুধুমাত্র ১টি পদ
            </button>
          </div>
        </div>

        {/* Post Selectable Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {subjectPosts.map((post) => {
            const isSelected = selectedPostIds.includes(post.id);
            const isAlreadyUnlocked = unlockedPostIds.includes(post.id);
            const IconComponent = POST_ICON_MAP[post.iconName] || GraduationCap;

            return (
              <div
                key={post.id}
                onClick={() => handleTogglePost(post.id)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-[#046A38] dark:border-emerald-500 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${post.gradientClass} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-hind">
                      {post.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      কোড: {post.code}
                    </span>
                  </div>
                </div>

                {/* Checkbox indicator */}
                <div className="shrink-0">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#046A38] text-white shadow-2xs'
                        : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Count & Multiplier Summary Bar */}
        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              নির্বাচিত পদ: <strong className="text-emerald-700 dark:text-emerald-400 text-sm">{toBengaliNumeral(selectedPostIds.length)}টি</strong>
            </span>
            {selectedPostIds.length > 1 && (
              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                (একাধিক পদের জন্য প্রতি পদের প্যাকেজ ফি যোগ হবে)
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {selectedPostIds.length === 1 ? '১টি পদ আনলক হবে' : `${toBengaliNumeral(selectedPostIds.length)}টি পদ একসাথে আনলক হবে`}
          </div>
        </div>
      </div>

      {/* STEP 2: DURATION PLAN SELECTION (4 CARDS) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="w-5 h-5 rounded-full bg-[#046A38] text-white text-[11px] font-black flex items-center justify-center">
            ২
          </span>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind">
            প্যাকেজের মেয়াদ নির্বাচন করুন:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUBSCRIPTION_PACKAGES_DATA.map((pkg) => {
            const isSelected = selectedPlanId === pkg.id;
            const singlePrice = Number(pkg.price);
            const totalForPkg = selectedPostIds.length * singlePrice;

            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPlan(pkg.id)}
                className={`rounded-3xl p-4 flex flex-col justify-between transition-all relative border-2 cursor-pointer ${
                  pkg.highlighted
                    ? 'bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-400 dark:border-amber-500/80 shadow-md ring-2 ring-amber-400/20'
                    : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700'
                } ${isSelected ? 'ring-3 ring-[#046A38] dark:ring-emerald-400 !border-[#046A38]' : ''}`}
              >
                {/* Badge & Discount */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${pkg.badgeStyle}`}>
                    {pkg.badge}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                    {pkg.discountPercentage}
                  </span>
                </div>

                {/* Title & Duration */}
                <div className="space-y-1 mb-2.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white font-hind leading-tight">
                    {pkg.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400" />
                    <span>{pkg.durationLabel}</span>
                  </div>
                </div>

                {/* Price Calculation Box */}
                <div className="py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through mr-1 font-semibold">
                        ৳ {pkg.regularPrice}
                      </span>
                      <span className="text-lg font-black text-[#046A38] dark:text-amber-400 font-hind">
                        ৳ {pkg.price}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium"> / পদ</span>
                    </div>
                  </div>

                  {/* Multiplier result preview */}
                  {selectedPostIds.length > 1 && (
                    <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                      <span>{toBengaliNumeral(selectedPostIds.length)}টি পদের জন্য:</span>
                      <span className="font-black text-xs">৳ {toBengaliNumeral(totalForPkg)}</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(pkg.id);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#046A38] text-white'
                      : pkg.highlighted
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{isSelected ? '✓ নির্বাচিত' : `${pkg.shortName} নির্বাচন করুন`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 3: INLINE CHECKOUT & PAYMENT SUBMISSION FORM */}
      {isCheckoutOpen && (
        <div
          id="inline-checkout-section"
          className="rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 dark:from-[#062013] dark:via-[#0D172A] dark:to-[#0B132B] border-2 border-[#046A38]/50 dark:border-emerald-600/50 shadow-lg space-y-4 animate-scale-up"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B132B] dark:text-white font-hind leading-tight">
                  পেমেন্ট ও অ্যাক্টিভেশন ফরম: {selectedPlan.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  নির্বাচিত পদ: {toBengaliNumeral(selectedPostIds.length)}টি • মেয়াদ: {selectedPlan.durationLabel}
                </p>
              </div>
            </div>

            {/* Total Fee Badge */}
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-right">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">মোট প্রদেয় ফি:</span>
              <span className="text-base sm:text-lg font-black text-[#046A38] dark:text-emerald-300 font-hind">
                ৳ {toBengaliNumeral(totalCalculatedAmount)}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Price breakdown calculation card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">হিসাব বিবরণ:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                প্রতি পদের ফি: ৳ {selectedPlan.price} × {toBengaliNumeral(selectedPostIds.length)}টি পদ = 
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black ml-1">
                  মোট ৳ {toBengaliNumeral(totalCalculatedAmount)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              নির্বাচিত পদসমূহ:{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {MAIN_SUBJECT_POSTS.filter(p => selectedPostIds.includes(p.id)).map(p => p.name).join(', ')}
              </span>
            </div>
          </div>

          {/* 3 Step Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#046A38] text-white rounded-md">
                ধাপ ১: সেন্ড মানি
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                বিকাশ বা নগদ অ্যাপের <strong className="text-emerald-700 dark:text-emerald-400">Send Money</strong> অপশনে যান।
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 block">মোট ফি:</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-hind">
                  ৳ {toBengaliNumeral(totalCalculatedAmount)}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                ধাপ ২: অফিসিয়াল নম্বর
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                নিচের পার্সোনাল নম্বরে সেন্ড মানি করুন:
              </p>
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="text-base font-mono font-black text-[#046A38] dark:text-emerald-300">
                  {paymentNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-2 py-1 rounded-lg bg-[#046A38] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#046A38] text-white rounded-md">
                ধাপ ৩: TrxID সাবমিট
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                সেন্ড মানি সম্পন্ন হলে প্রাপ্ত <strong>TrxID</strong> নিচের বক্সে লিখুন।
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitInlineOrder} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="যেমন: মোঃ যোবায়ের আহমদ"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="যেমন: 01712345678"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
                />
              </div>

              {/* TrxID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  placeholder="যেমন: BLA893KJ2"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-black text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-[#046A38] outline-none"
                />
              </div>
            </div>

            {/* Payment Method Radio */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">পেমেন্ট মাধ্যম:</span>
              <div className="flex items-center gap-3">
                {[
                  { id: 'bkash', label: 'বিকাশ (bKash)', color: 'text-pink-600' },
                  { id: 'nagad', label: 'নগদ (Nagad)', color: 'text-orange-600' },
                  { id: 'rocket', label: 'রকেট (Rocket)', color: 'text-purple-600' },
                ].map((pm) => (
                  <label key={pm.id} className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.id}
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id as any)}
                      className="accent-[#046A38] cursor-pointer"
                    />
                    <span className={pm.color}>{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmedCheckbox}
                  onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
                  className="mt-0.5 accent-[#046A38] rounded-md cursor-pointer"
                />
                <span>
                  আমি <strong>{paymentNumber}</strong> নম্বরে <strong>৳ {toBengaliNumeral(totalCalculatedAmount)}</strong> সেন্ড মানি করেছি এবং ট্রানজেকশন আইডি সঠিক দিয়েছি।
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || selectedPostIds.length === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#046A38] hover:bg-[#03542c] disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all shadow-md mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>তথ্য যাচাই ও আবেদন জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>আবেদন জমা দিন (৳ {toBengaliNumeral(totalCalculatedAmount)} • {toBengaliNumeral(selectedPostIds.length)}টি পদ)</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
