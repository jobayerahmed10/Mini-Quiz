import { CourseModule } from '../types';
import { formatCoursePrice } from './utils';

export interface CourseFeatureAccessResult {
  canAccess: boolean;
  isLocked: boolean;
  isEnrolled: boolean;
  reason: 'FREE_ACCESS' | 'ENROLLED' | 'PREMIUM_LOCKED' | 'NOT_ENROLLED';
  message: string;
  actionButtonText: string;
}

/**
 * Supabase থেকে আসা কোর্সের `is_locked` এবং `is_enrolled` ফিল্ডের ওপর ভিত্তি করে
 * প্রিমিয়াম/লকড ফিচার অ্যাক্সেস চেক করার ইউটিলিটি ফাংশন।
 *
 * @param course কোর্সের অবজেক্ট
 * @param featureType অ্যাক্সেস করার ফিচার টাইপ ('exam' | 'pdf' | 'class' | 'general')
 * @returns CourseFeatureAccessResult অবজেক্ট
 */
export function checkCourseAccess(
  course: CourseModule | null | undefined,
  featureType: 'exam' | 'pdf' | 'class' | 'general' = 'general'
): CourseFeatureAccessResult {
  if (!course) {
    return {
      canAccess: false,
      isLocked: true,
      isEnrolled: false,
      reason: 'PREMIUM_LOCKED',
      message: 'কোর্সের তথ্য পাওয়া যায়নি।',
      actionButtonText: 'কোর্সে ফিরে যান'
    };
  }

  const isEnrolled = Boolean(course.isEnrolled);
  const isLocked = Boolean(course.isLocked);

  // ১. যদি ইউজার ইতিমধ্যে এনরোল করে থাকে, তবে সকল ফিচার আনলকড
  if (isEnrolled) {
    return {
      canAccess: true,
      isLocked: false,
      isEnrolled: true,
      reason: 'ENROLLED',
      message: 'আপনার এই কোর্সে পূর্ণাঙ্গ অ্যাক্সেস রয়েছে।',
      actionButtonText: 'প্রবেশ করুন'
    };
  }

  // ২. যদি কোর্স বা নির্দিষ্ট ফিচারটির is_locked = false হয় (ফ্রি কনটেন্ট)
  if (!isLocked) {
    return {
      canAccess: true,
      isLocked: false,
      isEnrolled: false,
      reason: 'FREE_ACCESS',
      message: 'এই ফিচারটি সবার জন্য উন্মুক্ত (ফ্রি ট্রায়াল)।',
      actionButtonText: 'উপভোগ করুন'
    };
  }

  // ৩. যদি is_locked = true এবং ইউজার এনরোল না করে থাকে (প্রিমিয়াম কনটেন্ট)
  const featureNames: Record<string, string> = {
    exam: 'পরীক্ষাটিতে অংশগ্রহণ করতে',
    pdf: 'লেকচার শিট পিডিএফ ডাউনলোড করতে',
    class: 'ক্লাসটি দেখতে',
    general: 'প্রিমিয়াম কনটেন্ট ব্যবহার করতে'
  };

  const featureText = featureNames[featureType] || featureNames.general;

  return {
    canAccess: false,
    isLocked: true,
    isEnrolled: false,
    reason: 'PREMIUM_LOCKED',
    message: `এই ${featureText} আপনাকে কোর্সে ভর্তি হতে হবে।`,
    actionButtonText: `এখনই ভর্তি হন (${formatCoursePrice(course.price)})`
  };
}

/**
 * কোনো আইটেম লিস্ট (যেমন: প্রশ্ন, পরীক্ষা, পিডিএফ শিট) থেকে 
 * ইউজারকে শুধুমাত্র অ্যাক্সেসযোগ্য কনটেন্ট ফিল্টার করে বা তাদের লক স্ট্যাটাস চিহ্নিত করে দেয়ার জন্য।
 */
export function processItemsWithLockStatus<T extends { is_locked?: boolean; isLocked?: boolean }>(
  items: T[],
  isUserEnrolled: boolean
): (T & { hasAccess: boolean })[] {
  return items.map((item) => {
    const itemLocked = item.isLocked ?? item.is_locked ?? false;
    const hasAccess = isUserEnrolled || !itemLocked;
    return {
      ...item,
      hasAccess
    };
  });
}
