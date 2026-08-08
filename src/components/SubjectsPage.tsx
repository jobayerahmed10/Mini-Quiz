import React, { useState } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  BookMarked, 
  CheckCircle, 
  Scale, 
  Compass, 
  Feather, 
  ShieldCheck, 
  Languages, 
  FileText, 
  Calculator, 
  Landmark, 
  Globe, 
  Cpu, 
  Search, 
  Play, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { SUBJECT_CATEGORIES } from '../lib/subjects';
import { SubjectCategory } from '../types';

interface SubjectsPageProps {
  onSelectSubject: (subjectName: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Bookmark,
  BookMarked,
  CheckCircle,
  Scale,
  Compass,
  Feather,
  ShieldCheck,
  Languages,
  FileText,
  Calculator,
  Landmark,
  Globe,
  Cpu,
};

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onSelectSubject }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Exclude 'all' from default display list if we want clean 15 subjects or show 'all' at the top banner
  const fifteenSubjects = SUBJECT_CATEGORIES.filter(s => s.id !== 'all');

  const filteredSubjects = fifteenSubjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 mb-24">
      {/* Top Banner */}
      <div className="neu-card p-6 mb-6 border border-amber-400/30 bg-gradient-to-r from-[#121E36] via-[#1A2C4E] to-[#0E172A] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ১৫টি বিষয়ভিত্তিক বিশেষ প্রস্তুতি
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              বিষয়ভিত্তিক প্রস্তুতি ও অনুশীলন
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              মাদ্রাসা শিক্ষক নিবন্ধন, স্কুল ও কলেজের সিলেবাস অনুযায়ী বিষয়ভিত্তিক প্রশ্ন সমাধান
            </p>
          </div>

          <button
            onClick={() => onSelectSubject('সকল বিষয়')}
            className="neu-btn px-6 py-3 rounded-2xl text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 hover:text-amber-200 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>সব বিষয়ের ১০০ প্রশ্নের টেস্ট</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="বিষয় খুঁজুন (যেমন: ফিকহ, আরবি ব্যাকরণ, গণিত, কুরআন)..."
          className="w-full bg-[#121E36] border border-slate-700/80 text-white placeholder-slate-400 text-sm rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-amber-400/80 shadow-[inset_2px_2px_5px_#060a17]"
        />
      </div>

      {/* 15 Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((sub, idx) => {
          const IconComponent = ICON_MAP[sub.iconName] || BookOpen;

          return (
            <div
              key={sub.id}
              onClick={() => onSelectSubject(sub.name)}
              className="neu-card p-5 cursor-pointer hover:border-amber-400/60 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#14223E] border border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:border-amber-400 transition-all shadow-[inset_2px_2px_4px_#060a17]">
                    <IconComponent className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                    বিষয় #{idx + 1}
                  </span>
                </div>

                <h2 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                  {sub.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-extrabold text-amber-400">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300 font-semibold">কমন প্রশ্নাবলি</span>
                </span>
                <span className="flex items-center gap-1 text-amber-300 group-hover:translate-x-1 transition-transform">
                  <span>অনুশীলন করুন</span>
                  <Play className="w-3 h-3 fill-amber-300" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
