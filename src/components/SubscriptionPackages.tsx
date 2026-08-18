import React, { useState } from 'react';
import {
  Crown,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Copy
} from 'lucide-react';
import { CourseEnrollmentRecord } from '../types';
import { submitEnrollmentToSupabase } from '../lib/supabase';
import { getUserProfile } from '../lib/utils';

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
      '১৫টি বিষয়ের অধ্যায়ভিত্তিক প্রশ্নব্যাংক',
      'প্রতি প্রশ্নের ব্যাখ্যাসহ বিস্তারিত সমাধান',
      '১০, ২৫ ও ৫০ নম্বরের কাস্টম মডেল টেস্ট',
      '৩০ দিনের ফুল অ্যাক্সেস'
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
    description: 'ধারাবাহিক অনুশীলন ও বিষয়ভিত্তিক পূর্ণ প্রস্তুতি',
    features: [
      '১৫টি বিষয়ের ৫,০০০+ প্রশ্ন ও নির্ভুল ব্যাখ্যা',
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
    description: 'নিবিড় প্রস্তুতি ও এনটিআরসিএ পূর্ণাঙ্গ সিলেবাস কভার',
    features: [
      '১৫টি বিষয়ের সকল প্রশ্ন ও ব্যাখ্যা আনলক',
      '১০০ নম্বরের স্ট্যান্ডার্ড শিক্ষক নিবন্ধন ফুল টেস্ট',
      'ভুল উত্তরের স্বয়ংক্রিয় রিভিশন ও ট্র্যাকিং',
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
      '১৫টি বিষয়ের সকল বর্তমান ও নতুন যুক্ত প্রশ্নব্যাংক',
      'আনলিমিটেড কাস্টম ও ফুল-লেংথ ১০০ মার্কস মডেল টেস্ট',
      'তামরীন AI ব্যাকরণ ও অনুবাদ স্মার্ট সলিউশন',
      '৩৬৫ দিনের আনলিমিটেড লাইফটাইম-লাইক অ্যাক্সেস'
    ]
  }
];

interface SubscriptionPackagesProps {
  isPremium?: boolean;
  isPending?: boolean;
  pendingTrxId?: string;
  onEnrollmentSuccess?: (record: CourseEnrollmentRecord) => void;
  onClose?: () => void;
}

export const SubscriptionPackages: React.FC<SubscriptionPackagesProps> = ({
  isPremium = false,
  isPending = false,
  pendingTrxId,
  onEnrollmentSuccess,
  onClose
}) => {
  const currentProfile = getUserProfile();

  // Selected package for inline checkout
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly'>('yearly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  
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

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleSelectPlan = (planId: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly') => {
    setSelectedPlanId(planId);
    setIsCheckoutOpen(true);
    setStatusMessage(null);
    // Smooth scroll to checkout if already opened
    const el = document.getElementById('inline-checkout-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSubmitInlineOrder = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const enrollmentRecord: CourseEnrollmentRecord = {
      course_id: `tamreen_premium_${selectedPlan.id}`,
      course_title: `১৫টি বিষয়ভিত্তিক প্রিমিয়াম প্রস্তুতি (${selectedPlan.title})`,
      student_name: studentName.trim(),
      phone_number: phoneNumber.trim(),
      payment_method: paymentMethod,
      amount: selectedPlan.price,
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

    // 3. Mark locally as pending
    try {
      localStorage.setItem('tamreen_premium_status', 'pending');
      localStorage.setItem('tamreen_premium_plan', selectedPlan.id);
      localStorage.setItem('tamreen_premium_trx', enrollmentRecord.transaction_id);
      window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: 'pending' }));
    } catch {}

    setIsSubmitting(false);
    setStatusMessage({
      type: 'success',
      text: `আপনার ${selectedPlan.title}-এর আবেদন সফলভাবে গৃহীত হয়েছে! TrxID: ${enrollmentRecord.transaction_id}`
    });

    if (onEnrollmentSuccess) {
      onEnrollmentSuccess(enrollmentRecord);
    }
  };

  return (
    <div className="space-y-4" id="subscription-packages-container">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-amber-50/60 dark:from-[#062013] dark:via-[#0D172A] dark:to-[#1A1705] border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
              <Crown className="w-3 h-3 fill-slate-950" />
              মেম্বারশিপ প্যাকেজ
            </span>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              ১৫টি বিষয়ের পূর্ণাঙ্গ প্রশ্নব্যাংক আনলক
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-hind">
            আপনার সুবিধাজনক মেম্বারশিপ প্ল্যান বেছে নিন
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            যেকোনো প্ল্যান বেছে নিয়ে সরাসরি বিকাশ/নগদে ফি পাঠিয়ে TrxID প্রদান করে সক্রিয় করুন।
          </p>
        </div>

        {/* Global Access Status Indicator and Back Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isPremium ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-black">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>প্রিমিয়াম সক্রিয়</span>
            </div>
          ) : isPending ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>আবেদন জমা আছে ({pendingTrxId || 'যাচাইাধীন'})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>ফ্রি মোড</span>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
            >
              <span>বিষয় তালিকায় ফিরে যান</span>
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Cards Grid - Data Driven Rendering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {SUBSCRIPTION_PACKAGES_DATA.map((pkg) => {
          const isSelected = selectedPlanId === pkg.id && isCheckoutOpen;

          return (
            <div
              key={pkg.id}
              className={`rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between transition-all relative border-2 ${
                pkg.highlighted
                  ? 'bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-400/90 dark:border-amber-500/80 shadow-md ring-2 ring-amber-400/20'
                  : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700'
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
              <div className="space-y-1 mb-3">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-hind leading-tight">
                  {pkg.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400" />
                  <span>{pkg.durationLabel}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2 pt-0.5">
                  {pkg.description}
                </p>
              </div>

              {/* Pricing Display */}
              <div className="py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 line-through mr-1 font-semibold">
                    ৳ {pkg.regularPrice}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#046A38] dark:text-amber-400 font-hind">
                    ৳ {pkg.price}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  এককালীন ফি
                </span>
              </div>

              {/* Feature Points */}
              <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-4 flex-1">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#046A38] dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span className="leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Direct Action Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(pkg.id)}
                className={`w-full py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs ${
                  pkg.highlighted
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                    : 'bg-[#046A38] hover:bg-[#03542c] text-white'
                }`}
              >
                <span>{pkg.shortName} প্যাক নিন (৳ {pkg.price})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* INLINE CHECKOUT SECTION (Direct On-Page Payment Form, No Popups) */}
      {isCheckoutOpen && (
        <div
          id="inline-checkout-section"
          className="rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 dark:from-[#062013] dark:via-[#0D172A] dark:to-[#0B132B] border-2 border-[#046A38]/50 dark:border-emerald-600/50 shadow-lg space-y-4 animate-scale-up"
        >
          {/* Checkout Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B132B] dark:text-white font-hind leading-tight">
                  সরাসরি পেমেন্ট ও অ্যাক্টিভেশন ফরম: {selectedPlan.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  মেয়াদ: {selectedPlan.durationLabel} • ফি: ৳ {selectedPlan.price}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="self-end sm:self-auto text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 cursor-pointer"
            >
              ফরম বন্ধ করুন
            </button>
          </div>

          {/* Alert Status */}
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
                <Clock className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 3 Step Instructions Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Send Money */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#046A38] text-white rounded-md">
                ধাপ ১: সেন্ড মানি
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                বিকাশ বা নগদ অ্যাপের <strong className="text-emerald-700 dark:text-emerald-400">Send Money</strong> অপশনে যান।
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 block">প্রদেয় ফি:</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-hind">
                  ৳ {selectedPlan.price} (এককালীন)
                </span>
              </div>
            </div>

            {/* Step 2: Payment Number */}
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

            {/* Step 3: Transaction ID */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#046A38] text-white rounded-md">
                ধাপ ৩: TrxID সাবমিট
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                সেন্ড মানি সম্পন্ন হলে এসএমএস থেকে পাওয়া <strong>TrxID</strong> নিচের বক্সে লিখুন।
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

              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none cursor-pointer"
                >
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="rocket">রকেট (Rocket)</option>
                </select>
              </div>
            </div>

            {/* TrxID & Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction ID (TrxID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="যেমন: BL9X12AB34"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-[#0B132B] dark:text-white uppercase tracking-wider focus:ring-2 focus:ring-[#046A38] outline-none"
                />
              </div>

              <div className="pt-3 sm:pt-4">
                <label className="flex items-start gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedCheckbox}
                    onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
                    className="mt-0.5 rounded text-[#046A38] focus:ring-[#046A38] w-4 h-4 cursor-pointer"
                  />
                  <span>
                    আমি {paymentNumber} নম্বরে {selectedPlan.price} টাকা সেন্ড মানি সম্পন্ন করেছি।
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>
                {isSubmitting
                  ? 'আবেদন যাচাই ও জমা হচ্ছে...'
                  : `${selectedPlan.title} সরাসরি সক্রিয় করার আবেদন জমা দিন (৳ ${selectedPlan.price})`}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
