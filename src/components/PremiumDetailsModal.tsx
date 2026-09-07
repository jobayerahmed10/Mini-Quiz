import React from 'react';
import { 
  Crown, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Receipt,
  ArrowRight
} from 'lucide-react';
import { getPremiumDetails, toBengaliNumeral } from '../lib/utils';

interface PremiumDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew?: () => void;
}

export const PremiumDetailsModal: React.FC<PremiumDetailsModalProps> = ({
  isOpen,
  onClose,
  onRenew,
}) => {
  if (!isOpen) return null;

  const details = getPremiumDetails();

  // Date formatting helpers
  const formatDateBN = (dateStr?: string) => {
    if (!dateStr) return 'নির্ধারিত নয়';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'নির্ধারিত নয়';
      return d.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'নির্ধারিত নয়';
    }
  };

  const activatedDateStr = formatDateBN(details.activatedAt);
  const expiresDateStr = formatDateBN(details.expiresAt);

  // Percentage for progress bar
  const pct = details.totalDays > 0
    ? Math.min(100, Math.max(0, Math.round((details.remainingDays / details.totalDays) * 100)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#0D172A] rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-2xl max-w-lg w-full space-y-5 overflow-hidden relative">
        
        {/* Glowing Top Decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 fill-amber-950 stroke-amber-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>প্রিমিয়াম মেম্বারশিপ বিবরণ</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                আপনার সক্রিয় মেম্বারশিপ এবং মেয়াদের সময়সীমা
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Hero Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-emerald-500/10 border border-amber-400/40 relative overflow-hidden space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] border border-amber-400/30 mb-1">
                <Crown className="w-3 h-3 fill-current" />
                <span>সক্রিয় প্যাকেজ</span>
              </span>
              <h4 className="text-lg font-black text-slate-900 dark:text-amber-200">
                {details.packageName}
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-xs shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>সক্রিয় (Active)</span>
            </span>
          </div>

          {/* Days Remaining Banner */}
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              অবশিষ্ট মেয়াদের সময়:
            </span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-300/40">
              {toBengaliNumeral(details.remainingDays)} দিন বাকি
            </span>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>মোট মেয়াদ: {toBengaliNumeral(details.totalDays)} দিন</span>
              <span>{toBengaliNumeral(pct)}% সময় বাকি</span>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>সক্রিয় করার তারিখ</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {activatedDateStr}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>মেয়াদ শেষের তারিখ</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {expiresDateStr}
            </p>
          </div>
        </div>

        {details.trxId && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span>ট্রানজেকশন আইডি:</span>
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {details.trxId}
            </span>
          </div>
        )}

        {/* Unlocked Features Checklist */}
        <div className="space-y-2 pt-1">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            আপনার প্রিমিয়াম মেম্বারশিপের সুবিধাসমূহ:
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>সকল বিষয়ভিত্তিক প্রশ্নব্যাংক</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>সকল মডেল টেস্ট ও রেজাল্ট</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>লেকচার শিট ও স্পেশাল নোট</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>বিজ্ঞাপন মুক্ত অ্যাপ অভিজ্ঞতা</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onRenew && (
            <button
              onClick={() => {
                onClose();
                onRenew();
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <span>মেয়াদ বৃদ্ধি বা রিনিউ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`${onRenew ? 'w-24' : 'w-full'} py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors`}
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
