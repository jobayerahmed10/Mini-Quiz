import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Search,
  Check,
  Crown,
  BookOpen,
  Phone,
  User,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { CourseEnrollmentRecord } from '../types';
import {
  fetchEnrollmentsFromSupabase,
  updateEnrollmentStatusInSupabase,
  deleteEnrollmentFromSupabase,
  submitEnrollmentToSupabase
} from '../lib/supabase';
import { setUserPremium, toBengaliNumeral } from '../lib/utils';

interface AdminEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const AdminEnrollmentModal: React.FC<AdminEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const [applications, setApplications] = useState<CourseEnrollmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'premium' | 'course'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadAllApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchEnrollmentsFromSupabase();
      let combined = res.enrollments || [];

      // Also blend from local cache if any
      try {
        const local = JSON.parse(localStorage.getItem('tamreen_enrollments') || '[]');
        if (Array.isArray(local)) {
          const map = new Map<string, CourseEnrollmentRecord>();
          combined.forEach((e) => map.set(e.id || e.transaction_id, e));
          local.forEach((e) => {
            const key = e.id || e.transaction_id;
            if (!map.has(key)) {
              map.set(key, e);
            }
          });
          combined = Array.from(map.values());
        }
      } catch {}

      // Sort newest first
      combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setApplications(combined);
    } catch (err) {
      console.error('Error loading applications for admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAllApplications();
    }
  }, [isOpen, loadAllApplications]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (app: CourseEnrollmentRecord, newStatus: 'approved' | 'rejected' | 'pending') => {
    const targetId = app.id || app.transaction_id;
    setIsUpdating(targetId);

    try {
      // 1. Update in Supabase
      if (app.id) {
        await updateEnrollmentStatusInSupabase(app.id, newStatus);
      }

      // 2. Update local state
      const updatedList = applications.map((item) => {
        if ((item.id && item.id === app.id) || item.transaction_id === app.transaction_id) {
          return { ...item, status: newStatus };
        }
        return item;
      });
      setApplications(updatedList);

      // 3. Update localStorage tamreen_enrollments
      try {
        localStorage.setItem('tamreen_enrollments', JSON.stringify(updatedList));
      } catch {}

      // 4. If approving a premium package or course, reflect in premium/enrollment caches
      const appCourseId = String(app.course_id || '').toLowerCase();
      const appCourseTitle = String(app.course_title || '');
      const isPremiumType = appCourseId.startsWith('tamreen_premium') || appCourseId === 'tamreen_premium_package' || appCourseTitle.includes('প্রিমিয়াম') || appCourseTitle.includes('বিষয়ভিত্তিক');

      if (newStatus === 'approved') {
        if (isPremiumType) {
          setUserPremium(true);
          localStorage.setItem('tamreen_premium_status', 'approved');
          window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: 'approved' }));
          window.dispatchEvent(new CustomEvent('tamreen_premium_updated', { detail: true }));
        }
        showToast(`আবেদনটি অনুমোদিত হয়েছে! (${app.student_name})`);
      } else if (newStatus === 'rejected') {
        if (isPremiumType) {
          localStorage.setItem('tamreen_premium_status', 'rejected');
          window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: 'rejected' }));
        }
        showToast(`আবেদনটি বাতিল করা হয়েছে।`);
      } else {
        if (isPremiumType) {
          localStorage.setItem('tamreen_premium_status', 'pending');
          window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: 'pending' }));
        }
        showToast(`আবেদনটি পেন্ডিং অবস্থায় রাখা হয়েছে।`);
      }

      window.dispatchEvent(new CustomEvent('tamreen_enrollments_updated'));
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Error updating enrollment status:', err);
      showToast('স্ট্যাটাস আপডেটে সমস্যা হয়েছে');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (app: CourseEnrollmentRecord) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে ${app.student_name}-এর আবেদনটি মুছে ফেলতে চান?`)) {
      return;
    }
    const targetId = app.id || app.transaction_id;
    setIsUpdating(targetId);

    try {
      if (app.id) {
        await deleteEnrollmentFromSupabase(app.id);
      }
      const updatedList = applications.filter((item) => (item.id ? item.id !== app.id : item.transaction_id !== app.transaction_id));
      setApplications(updatedList);
      try {
        localStorage.setItem('tamreen_enrollments', JSON.stringify(updatedList));
      } catch {}
      showToast('আবেদন মুছে ফেলা হয়েছে');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Search Logic
  const filteredApps = applications.filter((app) => {
    // Tab filter
    if (activeFilter === 'pending' && app.status !== 'pending') return false;
    if (activeFilter === 'approved' && app.status !== 'approved') return false;
    if (activeFilter === 'rejected' && app.status !== 'rejected') return false;
    if (activeFilter === 'premium' && app.course_id !== 'tamreen_premium_package' && !app.course_title.includes('প্রিমিয়াম')) return false;
    if (activeFilter === 'course' && (app.course_id === 'tamreen_premium_package' || app.course_title.includes('প্রিমিয়াম'))) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = app.student_name?.toLowerCase().includes(q);
      const matchPhone = app.phone_number?.toLowerCase().includes(q);
      const matchTrx = app.transaction_id?.toLowerCase().includes(q);
      const matchTitle = app.course_title?.toLowerCase().includes(q);
      return matchName || matchPhone || matchTrx || matchTitle;
    }

    return true;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D172A] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-emerald-500/40 dark:border-emerald-600/40 shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* Header */}
        <div className="bg-[#046A38] text-white p-4 sm:p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-hind">
                  এডমিন প্যানেল: ভর্তি ও সাবস্ক্রিপশন অনুমোদন
                </h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                    {toBengaliNumeral(pendingCount)}টি পেন্ডিং
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                বিকাশ/নগদ TrxID যাচাই করে ১-ক্লিকে অ্যাক্টিভ করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadAllApplications}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2 px-4 text-center shrink-0 flex items-center justify-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Controls: Search & Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষার্থীর নাম, মোবাইল নম্বর বা TrxID দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              সকল ({toBengaliNumeral(applications.length)})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                activeFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>পেন্ডিং ({toBengaliNumeral(pendingCount)})</span>
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                activeFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>অনুমোদিত ({toBengaliNumeral(approvedCount)})</span>
            </button>
            <button
              onClick={() => setActiveFilter('premium')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                activeFilter === 'premium'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-300" />
              <span>প্রিমিয়াম প্যাকেজ</span>
            </button>
            <button
              onClick={() => setActiveFilter('course')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                activeFilter === 'course'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>কোর্স ভর্তি</span>
            </button>
          </div>
        </div>

        {/* List of Applications */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#046A38]" />
              <p className="text-xs font-bold">আবেদনসমূহ লোড হচ্ছে...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold">কোনো আবেদন পাওয়া যায়নি।</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isPremium = app.course_id === 'tamreen_premium_package' || app.course_title.includes('প্রিমিয়াম');
              const isPending = app.status === 'pending';
              const isApproved = app.status === 'approved';
              const isRejected = app.status === 'rejected';
              const targetKey = app.id || app.transaction_id;
              const isThisUpdating = isUpdating === targetKey;

              return (
                <div
                  key={targetKey}
                  className={`rounded-2xl p-4 border transition-all space-y-3 ${
                    isPending
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-400/30'
                      : isApproved
                      ? 'bg-white dark:bg-slate-800/80 border-emerald-300/60 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-75'
                  }`}
                >
                  {/* Top Bar: Title, Category Badge, Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPremium ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                            <Crown className="w-3 h-3 fill-slate-950" />
                            প্রিমিয়াম সাবস্ক্রিপশন
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            কোর্স ভর্তি
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('bn-BD') : 'আজ'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-[#0B132B] dark:text-white truncate">
                        {app.course_title}
                      </h4>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3" />
                          যাচাইাধীন
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          সক্রিয়
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1">
                          বাতিল
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student & Payment Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">শিক্ষার্থীর নাম</span>
                      <span className="font-extrabold text-[#0B132B] dark:text-white block truncate">
                        {app.student_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">মোবাইল নম্বর</span>
                      <a
                        href={`tel:${app.phone_number}`}
                        className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 block hover:underline"
                      >
                        {app.phone_number}
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">পেমেন্ট মেথড ও ফি</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {app.payment_method} (৳{app.amount})
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">TrxID:</span>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm tracking-wider">
                          {app.transaction_id}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(app.transaction_id, targetKey)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>{copiedId === targetKey ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleDelete(app)}
                      disabled={isThisUpdating}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="আবেদন মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">মুছুন</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {app.status !== 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(app, 'pending')}
                          disabled={isThisUpdating}
                          className="px-3 py-1.5 rounded-xl border border-amber-400/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-black hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          পেন্ডিং করুন
                        </button>
                      )}

                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(app, 'rejected')}
                          disabled={isThisUpdating}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          বাতিল করুন
                        </button>
                      )}

                      {app.status !== 'approved' ? (
                        <button
                          onClick={() => handleUpdateStatus(app, 'approved')}
                          disabled={isThisUpdating}
                          className="px-4 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isThisUpdating ? 'প্রসেসিং...' : 'এপ্রুভ করুন (সক্রিয়)'}</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>অনুমোদিত</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
          <span>মোট আবেদন: {toBengaliNumeral(applications.length)}টি</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-all"
          >
            প্যানেল বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
