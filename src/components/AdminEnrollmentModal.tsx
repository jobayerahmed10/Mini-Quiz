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
  Users,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  Mail,
  Calendar,
  Key,
  PlusCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import { CourseEnrollmentRecord } from '../types';
import {
  fetchEnrollmentsFromSupabase,
  updateEnrollmentStatusInSupabase,
  deleteEnrollmentFromSupabase,
  submitEnrollmentToSupabase,
  fetchAllRegisteredUsers,
  addQuestionToSupabase,
  fetchExamsFromSupabase,
  deleteExamFromSupabase,
  addExamToSupabase,
  ExamItem
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
  const [activeMainTab, setActiveMainTab] = useState<'applications' | 'users' | 'questions' | 'exams'>('applications');
  const [applications, setApplications] = useState<CourseEnrollmentRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string;
    rollNumber?: string;
    createdAt: string;
    avatarUrl?: string;
    role?: string;
  }>>([]);

  // Question Form State
  const [availableExams, setAvailableExams] = useState<ExamItem[]>([]);
  const [qExamId, setQExamId] = useState<string>('');
  const [customExamId, setCustomExamId] = useState<string>('');
  const [qSubject, setQSubject] = useState<string>('সকল বিষয়');
  const [qQuestion, setQQuestion] = useState<string>('');
  const [qOptionA, setQOptionA] = useState<string>('');
  const [qOptionB, setQOptionB] = useState<string>('');
  const [qOptionC, setQOptionC] = useState<string>('');
  const [qOptionD, setQOptionD] = useState<string>('');
  const [qCorrect, setQCorrect] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [qExplanation, setQExplanation] = useState<string>('');
  const [isSubmittingQ, setIsSubmittingQ] = useState<boolean>(false);

  // Exam Management States
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);
  const [newExamTitle, setNewExamTitle] = useState<string>('');
  const [newExamBadge, setNewExamBadge] = useState<string>('দৈনিক মডেল টেস্ট');
  const [newExamBadgeType, setNewExamBadgeType] = useState<'free' | 'daily' | 'weekly' | 'live'>('free');
  const [newExamSubject, setNewExamSubject] = useState<string>('সকল বিষয়');
  const [newExamQuestionCount, setNewExamQuestionCount] = useState<number>(25);
  const [newExamTimeMinutes, setNewExamTimeMinutes] = useState<number>(20);
  const [newExamNegativeMarks, setNewExamNegativeMarks] = useState<number>(0.5);
  const [newExamTotalMarks, setNewExamTotalMarks] = useState<number>(25);
  const [newExamDescription, setNewExamDescription] = useState<string>('');
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false);

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

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Load applications
      const res = await fetchEnrollmentsFromSupabase();
      let combined = res.enrollments || [];

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

      combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setApplications(combined);

      // 2. Load registered student accounts
      const usersRes = await fetchAllRegisteredUsers();
      setRegisteredUsers(usersRes.users || []);

      // 3. Load exams for question assignment
      const examsRes = await fetchExamsFromSupabase();
      if (examsRes.exams && examsRes.exams.length > 0) {
        setAvailableExams(examsRes.exams);
        if (!qExamId) {
          setQExamId(String(examsRes.exams[0].id));
        }
      }
    } catch (err) {
      console.error('Error loading applications/users for admin:', err);
    } finally {
      setIsLoading(false);
    }
  }, [qExamId]);

  const refetchExams = useCallback(async () => {
    try {
      const res = await fetchExamsFromSupabase();
      if (res.exams) {
        setAvailableExams(res.exams);
      }
    } catch (err) {
      console.error('Error refetching exams:', err);
    }
  }, []);

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পরীক্ষাটি মুছে ফেলতে চান? এর ফলে এই পরীক্ষার সাথে যুক্ত সমস্ত প্রশ্ন এবং অগ্রগতি ডিলিট হয়ে যেতে পারে।')) {
      return;
    }

    // 1. Optimistic UI Update: Remove from local state immediately
    const originalExams = [...availableExams];
    const updatedExams = availableExams.filter(e => e.id !== examId);
    setAvailableExams(updatedExams);
    showToast('পরীক্ষাটি মুছে ফেলা হচ্ছে...');

    try {
      const res = await deleteExamFromSupabase(examId);
      if (res.success) {
        showToast('✅ পরীক্ষাটি সফলভাবে মুছে ফেলা হয়েছে!');
        // 2. Clear any local cache for exams
        try {
          localStorage.removeItem('miniquiz_exams_cache');
        } catch {}
        // 3. Trigger a fresh refetch
        await refetchExams();
        // 4. Dispatch live event to update other components
        window.dispatchEvent(new Event('tamreen_data_changed'));
        if (onStatusUpdated) onStatusUpdated();
      } else {
        // Revert Optimistic UI Update on failure
        setAvailableExams(originalExams);
        alert(`ত্রুটি: ${res.error || 'পরীক্ষা মুছতে ব্যর্থ হয়েছে।'}`);
      }
    } catch (err) {
      // Revert Optimistic UI Update on failure
      setAvailableExams(originalExams);
      console.error('Error deleting exam:', err);
      alert('পরীক্ষা মুছতে সার্ভার সমস্যা হয়েছে।');
    }
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) {
      alert('অনুগ্রহ করে পরীক্ষার নাম/টাইটেল দিন।');
      return;
    }

    setIsSubmittingExam(true);
    try {
      const res = await addExamToSupabase({
        title: newExamTitle.trim(),
        badge: newExamBadge.trim(),
        badge_type: newExamBadgeType,
        subject: newExamSubject.trim(),
        question_count: newExamQuestionCount,
        time_minutes: newExamTimeMinutes,
        negative_marks: newExamNegativeMarks,
        total_marks: newExamTotalMarks,
        description: newExamDescription.trim() || undefined,
        status: 'active'
      });

      if (res.success) {
        showToast('🎉 নতুন পরীক্ষা সফলভাবে তৈরি হয়েছে!');
        // Close modal
        setShowCreateExamModal(false);
        // Reset form
        setNewExamTitle('');
        setNewExamBadge('দৈনিক মডেল টেস্ট');
        setNewExamBadgeType('free');
        setNewExamSubject('সকল বিষয়');
        setNewExamQuestionCount(25);
        setNewExamTimeMinutes(20);
        setNewExamNegativeMarks(0.5);
        setNewExamTotalMarks(25);
        setNewExamDescription('');

        // Clear local cache for exams
        try {
          localStorage.removeItem('miniquiz_exams_cache');
        } catch {}

        // Automatic refetch
        await refetchExams();
        // Dispatch live event
        window.dispatchEvent(new Event('tamreen_data_changed'));
        if (onStatusUpdated) onStatusUpdated();
      } else {
        alert(`ত্রুটি: ${res.error || 'পরীক্ষা তৈরি করতে ব্যর্থ হয়েছে।'}`);
      }
    } catch (err) {
      console.error('Error creating exam:', err);
      alert('পরীক্ষা তৈরি করতে সার্ভার সমস্যা হয়েছে।');
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qQuestion.trim() || !qOptionA.trim() || !qOptionB.trim()) {
      showToast('⚠️ প্রশ্ন এবং অন্তত অপশন ক ও খ পূরণ করুন।');
      return;
    }

    const finalExamId = qExamId === 'custom' ? customExamId.trim() : qExamId.trim();
    if (!finalExamId) {
      showToast('⚠️ একটি পরীক্ষা (Exam ID) নির্বাচন করুন বা আইডি লিখুন।');
      return;
    }

    setIsSubmittingQ(true);
    try {
      const res = await addQuestionToSupabase({
        question: qQuestion,
        option_a: qOptionA,
        option_b: qOptionB,
        option_c: qOptionC || '',
        option_d: qOptionD || '',
        correct_answer: qCorrect,
        subject: qSubject,
        explanation: qExplanation,
        exam_id: finalExamId,
        status: 'published'
      });

      if (res.success) {
        showToast(`✅ প্রশ্ন সফলভাবে সেভ হয়েছে! (Exam ID: ${finalExamId})`);
        setQQuestion('');
        setQOptionA('');
        setQOptionB('');
        setQOptionC('');
        setQOptionD('');
        setQExplanation('');
        onStatusUpdated?.();
      } else {
        showToast(`❌ ${res.error || 'প্রশ্ন যোগ করা সম্ভব হয়নি'}`);
      }
    } catch (err) {
      showToast('❌ প্রশ্ন যুক্ত করতে ত্রুটি ঘটেছে');
    } finally {
      setIsSubmittingQ(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, loadAllData]);

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
              onClick={loadAllData}
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

        {/* Primary Tabs (Applications vs Registered Users vs Add Questions vs Exams) */}
        <div className="flex border-b border-emerald-700/20 bg-emerald-950/10 dark:bg-emerald-950/30 p-1.5 gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveMainTab('applications')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMainTab === 'applications'
                ? 'bg-[#046A38] text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>আবেদন ({toBengaliNumeral(applications.length)})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('users')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMainTab === 'users'
                ? 'bg-[#046A38] text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>শিক্ষার্থী ({toBengaliNumeral(registeredUsers.length)})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('questions')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMainTab === 'questions'
                ? 'bg-[#046A38] text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>নতুন প্রশ্ন যুক্তকরণ</span>
          </button>

          <button
            onClick={() => setActiveMainTab('exams')}
            className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeMainTab === 'exams'
                ? 'bg-[#046A38] text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>পরীক্ষা ব্যবস্থাপনা ({toBengaliNumeral(availableExams.length)})</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2 px-4 text-center shrink-0 flex items-center justify-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: APPLICATIONS & APPROVALS                                   */}
        {/* ================================================================== */}
        {activeMainTab === 'applications' && (
          <>
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
          </>
        )}

        {/* ================================================================== */}
        {/* TAB 2: REGISTERED STUDENTS LIST                                   */}
        {/* ================================================================== */}
        {activeMainTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#046A38]" />
                <p className="text-xs font-bold">শিক্ষার্থীদের তালিকা লোড হচ্ছে...</p>
              </div>
            ) : registeredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">কোনো নিবন্ধিত শিক্ষার্থী পাওয়া যায়নি।</p>
              </div>
            ) : (
              registeredUsers
                .filter((user) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (user.fullName && user.fullName.toLowerCase().includes(q)) ||
                    (user.phone && user.phone.includes(q)) ||
                    (user.email && user.email.toLowerCase().includes(q)) ||
                    (user.rollNumber && user.rollNumber.toLowerCase().includes(q)) ||
                    (user.id && user.id.toLowerCase().includes(q))
                  );
                })
                .map((user, idx) => (
                  <div
                    key={user.id || idx}
                    className="rounded-2xl p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#046A38] dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {user.fullName || 'শিক্ষার্থী'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {user.role === 'admin' ? 'এডমিন' : 'শিক্ষার্থী'}
                          </span>
                          {/* Student Roll Number Badge */}
                          {user.rollNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-[10px] font-mono font-bold">
                              <span>রোল: {user.rollNumber}</span>
                              <button
                                onClick={() => handleCopy(user.rollNumber!, `roll_${user.id}`)}
                                className="hover:text-amber-600 dark:hover:text-amber-200 p-0.5 cursor-pointer"
                                title="রোল কপি করুন"
                                type="button"
                              >
                                {copiedId === `roll_${user.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          {user.phone && (
                            <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {user.phone}
                            </span>
                          )}
                          {user.email && (
                            <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-400">
                              <Mail className="w-3 h-3 text-emerald-600" />
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono block">ID: {user.id.slice(0, 8)}...</span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('bn-BD') : 'আজ'}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: ADD NEW QUESTION WITH EXAM_ID                              */}
        {/* ================================================================== */}
        {activeMainTab === 'questions' && (
          <form onSubmit={handleAddQuestionSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">এডমিন নির্দেশিকা:</span> এডমিন প্যানেল থেকে যেকোনো পরীক্ষায় (Exam ID) প্রশ্ন যুক্ত করলে তা সঙ্গে সঙ্গেই উক্ত পরীক্ষার জন্য Supabase `questions` টেবিলে সেভ হয়ে যাবে এবং মূল অ্যাপে দেখাবে।
              </div>
            </div>

            {/* Exam Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  পরীক্ষা নির্বাচন করুন (Exam ID):
                </label>
                <button
                  type="button"
                  onClick={loadAllData}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  title="পরীক্ষা তালিকা রিফ্রেশ করুন"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>রিফ্রেশ</span>
                </button>
              </div>
              <select
                value={qExamId}
                onChange={(e) => setQExamId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              >
                {availableExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} (ID: {ex.id})
                  </option>
                ))}
                <option value="custom">✏️ ম্যানুয়াল Exam ID / শিরোনাম লিখুন...</option>
              </select>
            </div>

            {qExamId === 'custom' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  কাস্টম Exam ID:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: exam-bangla-101"
                  value={customExamId}
                  onChange={(e) => setCustomExamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                বিষয় (Subject):
              </label>
              <input
                type="text"
                placeholder="যেমন: বাংলা, আরবি ব্যাকরণ, সাধারণ জ্ঞান"
                value={qSubject}
                onChange={(e) => setQSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                প্রশ্ন (Question):
              </label>
              <textarea
                rows={3}
                placeholder="প্রশ্নের মূল বক্তব্য লিখুন..."
                value={qQuestion}
                onChange={(e) => setQQuestion(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অপশন ক (A):</label>
                <input
                  type="text"
                  placeholder="অপশন ক"
                  value={qOptionA}
                  onChange={(e) => setQOptionA(e.target.value)}
                  required
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অপশন খ (B):</label>
                <input
                  type="text"
                  placeholder="অপশন খ"
                  value={qOptionB}
                  onChange={(e) => setQOptionB(e.target.value)}
                  required
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অপশন গ (C):</label>
                <input
                  type="text"
                  placeholder="অপশন গ"
                  value={qOptionC}
                  onChange={(e) => setQOptionC(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অপশন ঘ (D):</label>
                <input
                  type="text"
                  placeholder="অপশন ঘ"
                  value={qOptionD}
                  onChange={(e) => setQOptionD(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Correct Answer */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                সঠিক উত্তর (Correct Option):
              </label>
              <select
                value={qCorrect}
                onChange={(e) => setQCorrect(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="option_a">ক (Option A)</option>
                <option value="option_b">খ (Option B)</option>
                <option value="option_c">গ (Option C)</option>
                <option value="option_d">ঘ (Option D)</option>
              </select>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ব্যাখ্যা (Explanation - Optional):
              </label>
              <textarea
                rows={2}
                placeholder="সঠিক উত্তরের ব্যাখ্যা লিখুন..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSubmittingQ}
              className="w-full py-3 bg-[#046A38] hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingQ ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>সরাসরি Supabase-এ প্রশ্ন সেভ করুন</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================================================================== */}
        {/* TAB 4: EXAM MANAGEMENT                                            */}
        {/* ================================================================== */}
        {activeMainTab === 'exams' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                মোট পরীক্ষাসমূহ ({toBengaliNumeral(availableExams.length)}টি)
              </h3>
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="py-2 px-4 bg-[#046A38] hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>নতুন পরীক্ষা তৈরি করুন</span>
              </button>
            </div>

            {/* Exams list */}
            <div className="space-y-3">
              {availableExams.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  কোনো পরীক্ষা পাওয়া যায়নি।
                </div>
              ) : (
                availableExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-[#046A38]/30"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-100 dark:bg-emerald-950/60 text-[#046A38] dark:text-emerald-400">
                          {exam.badge}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {exam.id}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                        {exam.title}
                      </h4>
                      <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-bold flex-wrap">
                        <span>বিষয়: {exam.subject}</span>
                        <span>•</span>
                        <span>প্রশ্ন: {toBengaliNumeral(exam.question_count || 0)}টি</span>
                        <span>•</span>
                        <span>সময়: {toBengaliNumeral(exam.time_minutes || 0)} মিনিট</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer shrink-0"
                      title="ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* CREATE EXAM POPUP MODAL                                           */}
        {/* ================================================================== */}
        {showCreateExamModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-900/10 dark:bg-emerald-950/20 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#046A38]" />
                  <span className="text-sm font-black text-slate-800 dark:text-white">নতুন পরীক্ষা তৈরি করুন</span>
                </div>
                <button
                  onClick={() => setShowCreateExamModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateExamSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    পরীক্ষার নাম/টাইটেল <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ৪৬তম বিসিএস প্রিলিমিনারি মডেল টেস্ট"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                  />
                </div>

                {/* Grid for Badge & Badge Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block">ব্যাজ টেক্সট (Badge):</label>
                    <input
                      type="text"
                      placeholder="যেমন: ফ্রি পরীক্ষা, লাইভ টেস্ট"
                      value={newExamBadge}
                      onChange={(e) => setNewExamBadge(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block">ব্যাজ টাইপ (Type):</label>
                    <select
                      value={newExamBadgeType}
                      onChange={(e) => setNewExamBadgeType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                    >
                      <option value="free">ফ্রি পরীক্ষা (Free)</option>
                      <option value="daily">দৈনিক মডেল টেস্ট (Daily)</option>
                      <option value="weekly">সাপ্তাহিক মডেল টেস্ট (Weekly)</option>
                      <option value="live">লাইভ টেস্ট (Live)</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block">বিষয় (Subject):</label>
                  <input
                    type="text"
                    placeholder="যেমন: সকল বিষয়, বাংলা, গণিত"
                    value={newExamSubject}
                    onChange={(e) => setNewExamSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                  />
                </div>

                {/* Grid for QCount, Duration, Marks */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block">প্রশ্ন সংখ্যা:</label>
                    <input
                      type="number"
                      min={1}
                      value={newExamQuestionCount}
                      onChange={(e) => setNewExamQuestionCount(parseInt(e.target.value) || 25)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block">সময় (মিনিট):</label>
                    <input
                      type="number"
                      min={1}
                      value={newExamTimeMinutes}
                      onChange={(e) => setNewExamTimeMinutes(parseInt(e.target.value) || 20)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block">মোট মার্কস:</label>
                    <input
                      type="number"
                      min={1}
                      value={newExamTotalMarks}
                      onChange={(e) => setNewExamTotalMarks(parseInt(e.target.value) || 25)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Negative Marks */}
                <div className="space-y-1.5">
                  <label className="block">নেগেটিভ মার্কস (প্রতি ভুল উত্তরের জন্য):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newExamNegativeMarks}
                    onChange={(e) => setNewExamNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block">পরীক্ষার বিবরণ (Description):</label>
                  <textarea
                    rows={3}
                    placeholder="পরীক্ষা সম্পর্কে কোনো নির্দেশনা বা বিবরণ..."
                    value={newExamDescription}
                    onChange={(e) => setNewExamDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-[#046A38] outline-none text-xs"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingExam}
                  className="w-full py-3 bg-[#046A38] hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingExam ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>পরীক্ষা তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>সরাসরি Supabase-এ পরীক্ষা তৈরি করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

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
