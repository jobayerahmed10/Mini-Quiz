import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Play, 
  Clock, 
  Award, 
  CheckCircle2, 
  Filter, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PastPaper } from '../types';
import { PAST_PAPERS_DATA } from '../data/questionBankData';

interface QuestionBankPageProps {
  onStartPastPaperTest: (paper: PastPaper) => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({
  onStartPastPaperTest,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterTypes = [
    { id: 'all', label: 'সকল প্রশ্নপত্র' },
    { id: 'স্কুল পর্যায়', label: 'স্কুল পর্যায়' },
    { id: 'কলেজ পর্যায়', label: 'কলেজ পর্যায়' },
    { id: 'মাদ্রাসা পর্যায়', label: 'মাদ্রাসা পর্যায়' },
  ];

  const filteredPapers = PAST_PAPERS_DATA.filter((paper) => {
    const matchesType = selectedType === 'all' || paper.examType === selectedType;
    const matchesSearch = 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.year.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1F4E3A] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 rounded-full border border-amber-300/30 text-xs font-bold text-amber-200">
            <Award className="w-4 h-4 text-amber-300" />
            <span>NTRCA বিগত বছরের প্রশ্ন সমাধান (১ম - ১৮তম)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            শিক্ষক নিবন্ধন বিগত প্রশ্ন ব্যাংক
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            বিগত বছরগুলোর শিক্ষক নিবন্ধন প্রিলিমিনারি পরীক্ষার সকল বিষয়ভিত্তিক ও পর্যায়ভিত্তিক (স্কুল, কলেজ ও মাদ্রাসা) প্রশ্নপত্রের নির্ভুল সমাধান ও লাইব মক টেস্ট।
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পরীক্ষার নাম বা সাল দিয়ে খুঁজুন (যেমন: ১৮তম, ২০২২)..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6E2D3] rounded-2xl text-xs sm:text-sm text-[#1B4332] font-semibold focus:outline-none focus:border-[#1B4332] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t.id
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-[#E6E2D3] hover:bg-emerald-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredPapers.map((paper) => (
          <div
            key={paper.id}
            className="bg-white rounded-2xl border border-[#E6E2D3] p-5 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                  {paper.year} সালের পরীক্ষা
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full">
                  {paper.examType}
                </span>
              </div>

              <h2 className="text-sm sm:text-base font-black text-[#1B4332] leading-snug">
                {paper.title}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium bg-slate-50 p-3 rounded-xl">
              <div>
                <p className="text-slate-400">প্রশ্নসংখ্যা</p>
                <p className="font-bold text-[#1B4332]">{paper.totalQuestions}টি</p>
              </div>
              <div>
                <p className="text-slate-400">সময়</p>
                <p className="font-bold text-[#1B4332]">{paper.timeMinutes} মিনিট</p>
              </div>
              <div>
                <p className="text-slate-400">পাশ মার্কস</p>
                <p className="font-bold text-emerald-700">{paper.passingMarks}%</p>
              </div>
            </div>

            <button
              onClick={() => onStartPastPaperTest(paper)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B4332] hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>পরীক্ষা শুরু করুন</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
