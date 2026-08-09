import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Target, 
  Play, 
  Sparkles, 
  PlusCircle,
  Shield,
  Layers,
  Calendar,
  Zap,
  Tag,
  RefreshCw
} from 'lucide-react';
import { ExamItem, fetchExamsFromSupabase, DEFAULT_EXAM_PRESETS } from '../lib/supabase';
import { ExamAdminModal } from './ExamAdminModal';

interface ExamPageProps {
  onStartExam: (options: {
    subject: string;
    questionCount: number;
    timeMinutes: number;
    examType: string;
  }) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({ onStartExam }) => {
  const [exams, setExams] = useState<ExamItem[]>(DEFAULT_EXAM_PRESETS);
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'free' | 'live'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchExamsFromSupabase();
    if (res.exams && res.exams.length > 0) {
      setExams(res.exams);
    } else {
      setExams(DEFAULT_EXAM_PRESETS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const filteredExams = exams.filter((e) => {
    if (filterType === 'all') return true;
    return e.badge_type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 mb-24 space-y-6">
      {/* Banner */}
      <div className="neu-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="text-xs font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-full inline-flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              লাইভ কুইজ ও প্রিলিমিনারি মডেল টেস্ট
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B132B] dark:text-white">
              পরীক্ষা দিন
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              ফ্রিতে পরীক্ষার প্রস্তুতি নিন
            </p>
          </div>

          {/* Admin Button */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="neu-btn px-4 py-2.5 rounded-2xl bg-[#0B132B] text-amber-400 font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>এডমিন প্যানেল (মডেল টেস্ট যোগ করুন)</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'সব টেস্ট', icon: Layers },
            { id: 'daily', label: '📅 দৈনিক মডেল টেস্ট', icon: Calendar },
            { id: 'weekly', label: '📆 সাপ্তাহিক টেস্ট', icon: Calendar },
            { id: 'free', label: '🆓 ফ্রি পরীক্ষা', icon: Tag },
            { id: 'live', label: '🔴 লাইভ টেস্ট', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as 'all' | 'daily' | 'weekly' | 'free' | 'live')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap transition-all border ${
                filterType === tab.id
                  ? 'bg-[#0B132B] text-amber-400 border-[#0B132B] shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 border-transparent hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={loadExams}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors shrink-0"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Featured Model Tests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-[#0B132B] dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#0B132B] dark:text-amber-400" />
            মডেল টেস্ট তালিকা ({filteredExams.length}টি):
          </h2>
        </div>

        {filteredExams.length === 0 ? (
          <div className="neu-card p-8 text-center text-xs font-bold text-slate-500">
            এই ক্যাটাগরিতে কোনো মডেল টেস্ট নেই। এডমিন প্যানেল থেকে টেস্ট যুক্ত করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => {
              return (
                <div
                  key={exam.id}
                  className="neu-card p-5 flex flex-col justify-between hover:border-amber-400/60 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#0B132B] dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-full">
                        {exam.badge}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-[#0B132B] dark:text-amber-400" />
                        <span>{exam.time_minutes} মিনিট</span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-[#0B132B] dark:text-white group-hover:text-amber-400 transition-colors leading-snug">
                      {exam.title}
                    </h3>

                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      বিষয়: {exam.subject}
                    </div>

                    {exam.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                      {exam.question_count}টি প্রশ্ন ({exam.total_marks || exam.question_count} মার্কস)
                    </span>
                    <button
                      onClick={() => onStartExam({
                        subject: exam.subject,
                        questionCount: exam.question_count,
                        timeMinutes: exam.time_minutes,
                        examType: exam.title,
                      })}
                      className="neu-btn px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>শুরু করুন</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Panel Modal */}
      <ExamAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        examsList={exams}
        onExamsUpdated={loadExams}
      />
    </div>
  );
};

