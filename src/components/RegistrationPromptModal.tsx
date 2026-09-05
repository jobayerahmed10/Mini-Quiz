import React from 'react';
import { 
  Lock, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export interface RegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const RegistrationPromptModal: React.FC<RegistrationPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'পড়াশোনা বিষয়ে সকল সুবিধা পেতে রেজিষ্ট্রেশন করুন',
  message = 'কোর্স হ্যান্ডনোট, এআই ওস্তাদ ডাউট সলভ, বিগত সালের প্রশ্ন ও সকল স্পেশাল ফিচার আনলক করতে লগইন বা রেজিষ্ট্রেশন সম্পন্ন করুন।'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#121E36] rounded-3xl sm:rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-5 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Floating Badge Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-[#046A38] dark:text-emerald-400 shadow-[0_8px_20px_rgba(4,106,56,0.15)] relative">
          <GraduationCap className="w-8 h-8 text-[#046A38] dark:text-emerald-400" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center border-2 border-white dark:border-[#121E36] shadow-xs">
            <Lock className="w-3 h-3 stroke-2" />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <span className="text-[11px] font-black px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>প্রিমিয়াম স্টাডি সুবিধা</span>
          </span>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-hind leading-snug">
            {title}
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 font-hind leading-relaxed">
            {message}
          </p>
        </div>

        {/* Highlighted Benefits Grid */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>সকল বিষয়ের হ্যান্ডনোট ও সাজেশনের ফ্রি পিডিএফ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>২৪/৭ তামরীন এআই ওস্তাদ দিয়ে ব্যাকরণ ও তাহকীক সলভ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>লিডারবোর্ড ও ব্যক্তিগত পারফরম্যান্স অগ্রগতি ট্র্যাকিং</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Confirm Button */}
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#046A38] hover:bg-[#03542c] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(4,106,56,0.35)] active:scale-98 transition-all cursor-pointer"
          >
            <span>হ্যাঁ, রেজিষ্ট্রেশন / লগইন করুন</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            পরে করব (বাতিল)
          </button>
        </div>

      </div>
    </div>
  );
};
