import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  CreditCard,
  Phone,
  User,
  Mail,
  FileCheck2,
  ShieldCheck,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { CourseModule, CourseEnrollmentRecord } from '../types';
import { submitEnrollmentToSupabase } from '../lib/supabase';

interface CourseEnrollmentModalProps {
  course: CourseModule;
  onClose: () => void;
  onSuccess: (enrollment: CourseEnrollmentRecord) => void;
}

export const CourseEnrollmentModal: React.FC<CourseEnrollmentModalProps> = ({
  course,
  onClose,
  onSuccess
}) => {
  // Step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [studentName, setStudentName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState<boolean>(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Official Payment Numbers (bKash, Nagad, Rocket)
  const paymentNumbers = {
    bkash: '01779834999',
    nagad: '01779834999',
    rocket: '01779834999'
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  // Step 2 Validation -> Step 3
  const handleNextFromStep2 = () => {
    if (!studentName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 11) {
      setErrorMessage('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // Step 4 Validation & Submission -> Step 5
  const handleSubmitEnrollment = async () => {
    if (!transactionId.trim() || transactionId.trim().length < 5) {
      setErrorMessage('অনুগ্রহ করে সঠিক পেমেন্ট ট্রানজেকশন আইডি (Transaction ID) লিখুন।');
      return;
    }
    if (!isConfirmedCheckbox) {
      setErrorMessage('অনুগ্রহ করে সঠিক তথ্য নিশ্চিতকরণ বক্সে টিক দিন।');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const enrollmentRecord: CourseEnrollmentRecord = {
      course_id: course.id,
      course_title: course.title,
      student_name: studentName.trim(),
      phone_number: phoneNumber.trim(),
      email: email.trim() || undefined,
      payment_method: paymentMethod,
      amount: course.price || '৯৫০',
      transaction_id: transactionId.trim().toUpperCase(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Save to Supabase
    const res = await submitEnrollmentToSupabase(enrollmentRecord);

    // Save to local storage for persistent user experience
    try {
      const existing = JSON.parse(localStorage.getItem('tamreen_enrollments') || '[]');
      const updated = [res.data || enrollmentRecord, ...existing];
      localStorage.setItem('tamreen_enrollments', JSON.stringify(updated));
    } catch {}

    setIsSubmitting(false);
    setCurrentStep(5);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-4 sm:p-5 relative border border-slate-200 dark:border-slate-800 shadow-2xl my-auto space-y-4 animate-scale-up">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {currentStep > 1 && currentStep < 5 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                title="পূর্ববর্তী ধাপ"
              >
                <ArrowLeft className="w-5 h-5 text-[#046A38]" />
              </button>
            )}
            <h2 className="text-sm sm:text-base font-black text-[#0B132B] dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-[#046A38]" />
              <span>
                {currentStep === 1 && 'কোর্স নির্বাচন ও বিস্তারিত'}
                {currentStep === 2 && 'কোর্সে ভর্তি - তথ্য ফরম'}
                {currentStep === 3 && 'পেমেন্ট পদ্ধতি নির্বাচন'}
                {currentStep === 4 && `${paymentMethod === 'bkash' ? 'বিকাশে' : paymentMethod === 'nagad' ? 'নগদে' : 'রকেটে'} পেমেন্ট করুন`}
                {currentStep === 5 && 'ভর্তি আবেদন সফল!'}
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Visual Stepper Progress (Steps 1 -> 5) */}
        <div className="flex items-center justify-between px-1">
          {[1, 2, 3, 4, 5].map((s) => {
            const isCompleted = currentStep > s;
            const isCurrent = currentStep === s;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-[#046A38] text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#046A38] text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s}
                  </div>
                  <span className={`text-[9px] font-extrabold ${isCurrent ? 'text-[#046A38] dark:text-emerald-400' : 'text-slate-400'}`}>
                    {s === 1 && 'কোর্স'}
                    {s === 2 && 'ফরম'}
                    {s === 3 && 'পদ্ধতি'}
                    {s === 4 && 'পেমেন্ট'}
                    {s === 5 && 'আবেদন'}
                  </span>
                </div>

                {s < 5 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-all ${
                      currentStep > s ? 'bg-[#046A38]' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: কোর্স নির্বাচন ও সংক্ষিপ্ত তথ্য */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Course Card Banner */}
            <div className="bg-gradient-to-br from-[#063b22] via-[#046A38] to-[#02331b] rounded-2xl p-4 text-white shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
                  {course.badge || 'সর্বাধিক জনপ্রিয়'}
                </span>
                <span className="text-xs font-bold text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  তামরীন একাডেমি
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {course.title}
                </h3>
                <p className="text-xs text-emerald-200 font-medium mt-0.5">
                  শিক্ষক নিবন্ধন ও স্পেশাল প্রস্তুতি
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-xs text-slate-200">কোর্স ফি:</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  ৳ {course.price || '৯৫০'}
                </span>
              </div>
            </div>

            {/* Included Features List */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#046A38]" />
                  <span>মোট ক্লাস</span>
                </span>
                <span className="font-bold text-[#0B132B] dark:text-white">{course.classesCount || 40}+</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#046A38]" />
                  <span>ভিডিও / লাইভ ক্লাস</span>
                </span>
                <span className="font-bold text-[#0B132B] dark:text-white">উপলব্ধ</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#046A38]" />
                  <span>মক টেস্ট ও সলভ পরীক্ষা</span>
                </span>
                <span className="font-bold text-[#0B132B] dark:text-white">{course.examsCount || 30}+টি</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#046A38]" />
                  <span>ক্লাস নোট ও পিডিএফ ডাউনলোড</span>
                </span>
                <span className="font-bold text-[#0B132B] dark:text-white">{course.sheetsCount || 30}+টি</span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#046A38]" />
                  <span>প্রবেশাধিকার ও মেয়াদ</span>
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">৬ মাস</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <span>কোর্সে ভর্তি হোন</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: ভর্তি ফরম পূরণ (Student Info Form) */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Top Mini Course Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-black text-[#0B132B] dark:text-white truncate">
                  {course.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">
                  মেয়াদ: ৬ মাস
                </p>
              </div>
              <span className="text-sm font-black text-[#046A38] dark:text-emerald-300 shrink-0">
                ৳ {course.price || '৯৫০'}
              </span>
            </div>

            {/* Inputs Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার নাম লিখুন <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="যেমন: যোবায়ের আহমদ"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#0B132B] dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="যেমন: 01712-345678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#0B132B] dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ই-মেইল (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="যেমন: jobayer@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#0B132B] dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={handleNextFromStep2}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <span>পরবর্তী</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: পেমেন্ট পদ্ধতি নির্বাচন (Select Provider) */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              পেমেন্ট পদ্ধতি নির্বাচন করুন:
            </h3>

            <div className="space-y-2.5">
              {/* bKash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-50/60 dark:bg-pink-950/30 ring-2 ring-pink-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    bKash
                  </div>
                  <span className="text-sm font-extrabold text-[#0B132B] dark:text-white">
                    বিকাশ (bKash)
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'bkash'
                      ? 'border-pink-600 bg-pink-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {paymentMethod === 'bkash' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'nagad'
                    ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    নগদ
                  </div>
                  <span className="text-sm font-extrabold text-[#0B132B] dark:text-white">
                    নগদ (Nagad)
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'nagad'
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {paymentMethod === 'nagad' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Rocket */}
              <button
                type="button"
                onClick={() => setPaymentMethod('rocket')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'rocket'
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    রকেট
                  </div>
                  <span className="text-sm font-extrabold text-[#0B132B] dark:text-white">
                    রকেট (Rocket)
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'rocket'
                      ? 'border-purple-700 bg-purple-700 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {paymentMethod === 'rocket' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Fee Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">কোর্স ফি:</span>
              <span className="text-base font-black text-[#046A38] dark:text-emerald-400">
                ৳ {course.price || '৯৫০'}
              </span>
            </div>

            {/* Button */}
            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <span>পরবর্তী</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: পেমেন্ট নির্দেশিকা ও Transaction ID প্রদান */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-3.5">
            {/* Header branding */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
              <div
                className={`px-3 py-1 rounded-xl text-white font-black text-xs shadow-xs ${
                  paymentMethod === 'bkash'
                    ? 'bg-pink-600'
                    : paymentMethod === 'nagad'
                    ? 'bg-orange-600'
                    : 'bg-purple-700'
                }`}
              >
                {paymentMethod === 'bkash' ? 'বিকাশ' : paymentMethod === 'nagad' ? 'নগদ' : 'রকেট'}
              </div>
              <span className="text-xs font-black text-[#0B132B] dark:text-white">
                পেমেন্ট সম্পন্ন করার উপায়
              </span>
            </div>

            {/* Instructions list */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-medium">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-black text-[#0B132B] dark:text-white">পেমেন্ট করার ধাপসমূহ:</span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                  সেন্ড মানি (Send Money)
                </span>
              </div>
              <p>১. আপনার <strong>{paymentMethod === 'bkash' ? 'বিকাশ (bKash)' : paymentMethod === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)'}</strong> অ্যাপে বা ইউএসএসডি কোডে যান</p>
              <p>২. অপশন হিসেবে <strong className="text-emerald-700 dark:text-emerald-400 underline decoration-2">Send Money (সেন্ড মানি)</strong> বেছে নিন</p>
              <p>৩. প্রাপক নম্বর হিসেবে নিচের নম্বরটি দিন: <strong className="text-rose-600 dark:text-rose-400 font-mono font-black">01779834999</strong></p>
              <p>৪. সেন্ড মানি করার পর প্রাপ্ত <strong>Transaction ID (TrxID)</strong> কপি করে নিচের ইনপুটে লিখুন</p>
            </div>

            {/* Number Box with Copy */}
            <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/50 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-700/60 text-center space-y-1.5 shadow-xs">
              <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                অফিসিয়াল {paymentMethod === 'bkash' ? 'বিকাশ' : paymentMethod === 'nagad' ? 'নগদ' : 'রকেট'} নম্বর (সেন্ড মানি করুন)
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl font-mono font-black text-rose-600 dark:text-rose-300 tracking-wider">
                  01779834999
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyNumber(paymentNumbers[paymentMethod])}
                  className="px-2.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white cursor-pointer transition-all flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95"
                  title="নম্বর কপি করুন"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>{copiedNumber ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>
              </div>
            </div>

            {/* Transaction ID input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction ID লিখুন <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="যেমন: A1B2C3D4E5"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-[#0B132B] dark:text-white uppercase tracking-widest focus:ring-2 focus:ring-[#046A38] outline-none"
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isConfirmedCheckbox}
                onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
                className="mt-0.5 rounded text-[#046A38] focus:ring-[#046A38] w-4 h-4 cursor-pointer"
              />
              <span>আমি সঠিক তথ্য দিয়ে পেমেন্ট সম্পন্ন করেছি</span>
            </label>

            {/* Submit Button */}
            <button
              onClick={handleSubmitEnrollment}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-200" />
              <span>{isSubmitting ? 'আবেদন জমা হচ্ছে...' : 'আবেদন জমা দিন'}</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: ভর্তি আবেদন সফল! (Success & Pending State) */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="py-4 text-center space-y-4">
            {/* Animated Success Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#046A38] dark:text-emerald-300 mx-auto flex items-center justify-center border-4 border-emerald-200 dark:border-emerald-800 shadow-lg animate-bounce">
              <FileCheck2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#0B132B] dark:text-white">
                ভর্তি আবেদন সফল!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                আপনার পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে।
              </p>
            </div>

            {/* Status Pill Card */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 max-w-xs mx-auto space-y-1.5">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold block">
                আবেদনের স্ট্যাটাস:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-slate-900" />
                <span>যাচাইাধীন (Pending)</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
              এডমিন থেকে পেমেন্ট যাচাই সম্পন্ন হলে আপনার অ্যাকাউন্টে কোর্সটি স্বয়ংক্রিয়ভাবে সক্রিয় (Active) হয়ে যাবে।
            </p>

            <button
              onClick={() => {
                onSuccess({
                  course_id: course.id,
                  course_title: course.title,
                  student_name: studentName,
                  phone_number: phoneNumber,
                  payment_method: paymentMethod,
                  amount: course.price || '৯৫০',
                  transaction_id: transactionId,
                  status: 'pending'
                });
                onClose();
              }}
              className="w-full py-3 bg-[#046A38] hover:bg-[#03522b] text-white rounded-2xl font-black text-xs sm:text-sm shadow-md cursor-pointer active:scale-95 transition-all"
            >
              ঠিক আছে
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
