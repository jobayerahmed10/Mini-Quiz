import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { ExamItem, addExamToSupabase, deleteExamFromSupabase, isSupabaseConfigured } from '../lib/supabase';
import { SUBJECT_CATEGORIES } from '../lib/subjects';

interface ExamAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  examsList: ExamItem[];
  onExamsUpdated: () => void;
}

export const ExamAdminModal: React.FC<ExamAdminModalProps> = ({
  isOpen,
  onClose,
  examsList,
  onExamsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [badgeType, setBadgeType] = useState<'free' | 'daily' | 'weekly' | 'live'>('free');
  const [badge, setBadge] = useState('ফ্রি পরীক্ষা');
  const [subject, setSubject] = useState('সকল বিষয়');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [timeMinutes, setTimeMinutes] = useState<number>(20);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.5);
  const [totalMarks, setTotalMarks] = useState<number>(25);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleBadgeTypeChange = (type: 'free' | 'daily' | 'weekly' | 'live') => {
    setBadgeType(type);
    if (type === 'free') setBadge('ফ্রি পরীক্ষা');
    else if (type === 'daily') setBadge('দৈনিক মডেল টেস্ট');
    else if (type === 'weekly') setBadge('সাপ্তাহিক মডেল টেস্ট');
    else if (type === 'live') setBadge('লাইভ টেস্ট');
  };

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(count);
    setTotalMarks(count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'পরীক্ষার শিরোনাম লিখে দিন।' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const result = await addExamToSupabase({
      title: title.trim(),
      badge: badge.trim() || 'ফ্রি পরীক্ষা',
      badge_type: badgeType,
      subject,
      question_count: Number(questionCount),
      time_minutes: Number(timeMinutes),
      negative_marks: Number(negativeMarks),
      total_marks: Number(totalMarks),
      description: description.trim() || undefined,
      status: 'active',
    });

    setIsSubmitting(false);

    if (result.success) {
      setFeedback({ type: 'success', message: 'সফলভাবে নতুন মডেল টেস্ট সেভ করা হয়েছে!' });
      setTitle('');
      setDescription('');
      onExamsUpdated();
    } else {
      setFeedback({ type: 'error', message: result.error || 'পরীক্ষা সেভ করা যায়নি।' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি এই পরীক্ষাটি মুছে ফেলতে চান?')) return;

    setDeletingId(id);
    setFeedback(null);

    const res = await deleteExamFromSupabase(id);
    setDeletingId(null);

    if (res.success) {
      setFeedback({ type: 'success', message: 'পরীক্ষাটি সফলভাবে মুছে ফেলা হয়েছে।' });
      onExamsUpdated();
    } else {
      setFeedback({ type: 'error', message: res.error || 'মুছে ফেলা সম্ভব হয়নি।' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B132B]/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0D172A] rounded-[28px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">পরীক্ষা দিন এডমিন প্যানেল</h3>
              <p className="text-[11px] text-slate-400">ফ্রি পরীক্ষা, দৈনিক ও সাপ্তাহিক মডেল টেস্ট যোগ বা ম্যানেজ করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('add')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'add'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পরীক্ষা যোগ করুন</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-1.5 border-b-2 cursor-pointer transition-all ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>বর্তমান টেস্ট সমূহ ({examsList.length}টি)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Exam Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  পরীক্ষার শিরোনাম (Exam Title): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ১৯তম NTRCA সাধারণ জ্ঞান ও বাংলা বিশেষ মডেল টেস্ট"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Badge Category / Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  পরীক্ষার ধরন (Exam Category):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'free', label: '🆓 ফ্রি পরীক্ষা', color: 'border-emerald-500' },
                    { id: 'daily', label: '📅 দৈনিক মডেল টেস্ট', color: 'border-amber-500' },
                    { id: 'weekly', label: '📆 সাপ্তাহিক টেস্ট', color: 'border-blue-500' },
                    { id: 'live', label: '🔴 লাইভ টেস্ট', color: 'border-rose-500' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleBadgeTypeChange(cat.id as 'free' | 'daily' | 'weekly' | 'live')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-all border ${
                        badgeType === cat.id
                          ? 'bg-[#0B132B] text-amber-400 border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Custom Label & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>ব্যাজ লেবেল (Badge Name):</span>
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="যেমন: ফ্রি মডেল টেস্ট"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    বিষয় (Subject):
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="সকল বিষয়">সকল বিষয় (মডেল টেস্ট)</option>
                    {SUBJECT_CATEGORIES.filter(s => s.id !== 'all').map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Count & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    প্রশ্ন সংখ্যা (Total MCQs):
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => handleQuestionCountChange(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={10}>১০টি প্রশ্ন</option>
                    <option value={20}>২০টি প্রশ্ন</option>
                    <option value={25}>২৫টি প্রশ্ন</option>
                    <option value={50}>৫০টি প্রশ্ন</option>
                    <option value={100}>১০০টি প্রশ্ন</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>সময়সীমা (মিনিট):</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    নেগেটিভ মার্কিং:
                  </label>
                  <select
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={0.0}>০.০০ (নেগেটিভ নেই)</option>
                    <option value={0.25}>০.২৫ মার্কস</option>
                    <option value={0.50}>০.৫০ মার্কস (স্ট্যান্ডার্ড)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  বিবরণ / সংক্ষিপ্ত গাইডলাইন:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: ১০০ নম্বর প্রিলিমিনারি পরীক্ষা। প্রতিটি ভুল উত্তরের জন্য ০.৫০ কাটা যাবে।"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="neu-btn px-6 py-3 bg-[#0B132B] text-amber-400 font-black text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'সেভ হচ্ছে...' : 'Supabase এ সেভ করুন'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* List of existing exams */
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                তালিকায় বর্তমান মোট টেস্টসমূহ:
              </h4>

              {examsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  কোনো পরীক্ষা সেভ করা নেই।
                </div>
              ) : (
                examsList.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full">
                          {exam.badge}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {exam.subject}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-[#0B132B] dark:text-white">
                        {exam.title}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{exam.question_count}টি প্রশ্ন</span>
                        <span>•</span>
                        <span>{exam.time_minutes} মিনিট</span>
                        <span>•</span>
                        <span>নেগেটিভ: -{exam.negative_marks}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      disabled={deletingId === exam.id}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            {isSupabaseConfigured ? '🟢 Supabase ডাটাবেস রিয়েল-টাইম সিঙ্কড' : '🟠 ডেমো মোড (Supabase কী সেটআপ করুন)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
