import React, { useState } from 'react';
import { 
  User, 
  Flame, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  Target, 
  BarChart2, 
  Calendar,
  Sparkles,
  HelpCircle,
  FileCheck,
  RotateCcw
} from 'lucide-react';

interface ProfileStatsPageProps {
  onNavigateHome: () => void;
  onRefreshQuestions?: () => void;
}

export const ProfileStatsPage: React.FC<ProfileStatsPageProps> = ({
  onNavigateHome,
  onRefreshQuestions
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'syllabus'>('stats');

  const syllabusModules = [
    {
      subject: 'বাংলা ভাষা ও সাহিত্য (২৫ নম্বর)',
      topics: [
        'ভাষারীতির প্রয়োগ ও অপপ্রয়োগ, সন্ধি ও সমাস',
        'কারক ও বিভক্তি, শব্দ ও পদ পরিবর্তন',
        'সমার্থক ও বিপরীতার্থক শব্দ, বাক্য সংকোচন',
        'প্রবাদ প্রবচন ও বিখ্যাত সাহিত্যিক পরিচিতি'
      ]
    },
    {
      subject: 'ইংরেজি (English - ২৫ নম্বর)',
      topics: [
        'Errors in usage, Fill in the blanks with appropriate preposition',
        'Subject-Verb Agreement, Translation & Idioms',
        'Synonym and Antonym, Transformation of Sentences',
        'Identify correct spelling & Appropriate phrases'
      ]
    },
    {
      subject: 'সাধারণ গণিত ও মানসিক দক্ষতা (২৫ নম্বর)',
      topics: [
        'পাটিগণিত: লসাগু-গসাগু, শতকরা, লাভ-ক্ষতি, অনুপাত ও সুদকষা',
        'বীজগণিত: উৎপাদক, সূত্রাবলী, সূচক ও লগারিদম',
        'জ্যামিতি: রেখা, কোণ, ত্রিভুজ, চতুর্ভুজ ও বৃত্তের পরিমাপ',
        'মানসিক দক্ষতা ও যৌক্তিক চিন্তাধারা'
      ]
    },
    {
      subject: 'সাধারণ জ্ঞান - বাংলাদেশ ও আন্তর্জাতিক (২৫ নম্বর)',
      topics: [
        'বাংলাদেশের ইতিহাস, ভাষা আন্দোলন ও মহান মুক্তিযুদ্ধ',
        'বাংলাদেশের সংবিধান, অর্থনীতি, সম্পদ ও বর্তমান উন্নয়ন প্রকল্প',
        'আন্তর্জাতিক গুরুত্বপূর্ণ সংস্থা, ভৌগোলিক অবস্থান ও মুদ্রা',
        'সাম্প্রতিক বাংলাদেশ ও বিশ্বঘটনাবলী'
      ]
    },
    {
      subject: 'আরবি ও ইসলামী শিক্ষা - মাদ্রাসা স্পেশাল (২৫ নম্বর)',
      topics: [
        'আল-কোরআন: গুরুত্বপূর্ণ সূরা ও তাফসির ভিত্তিক প্রশ্ন',
        'আল-হাদিস: সিহাহ সিত্তা ও গুরুত্বপূর্ণ হাদিসের শিক্ষা',
        'ফিকহ্ ও আকাইদ: সালাত, জাকাত, সিয়াম, হজ ও ইসলামিক ফেকাহ্',
        'ইবতেদায়ী, দাখিল ও ফাজিল পর্যায়ের পেডাগোজি'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-[#E6E2D3] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 bg-emerald-100 text-[#1B4332] rounded-full flex items-center justify-center font-extrabold text-2xl border-4 border-emerald-50 shrink-0 shadow-inner">
            <User className="w-10 h-10" />
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-black text-[#1B4332]">
                পরীক্ষার্থীর প্রোফাইল ও অগ্রগতি
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                ১৮/১৯তম NTRCA ক্যান্ডিডেট
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              শিক্ষক নিবন্ধন প্রিলিমিনারি প্রস্তুতি ট্র্যাকার ২০২৬
            </p>
          </div>

          {/* Daily Streak Badge */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center shrink-0 min-w-[110px]">
            <div className="flex items-center justify-center gap-1 text-amber-600 font-black text-lg">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-bounce" />
              <span>৭ দিন</span>
            </div>
            <p className="text-[10px] text-amber-800 font-bold">স্টাডি স্ট্রাইক 🔥</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-bold">মোট পরীক্ষা সম্পন্ন</p>
            <p className="text-lg font-black text-[#1B4332]">১২টি</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-bold">গড় নম্বর</p>
            <p className="text-lg font-black text-emerald-700">৭৮.৫%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-bold">সঠিক উত্তর</p>
            <p className="text-lg font-black text-sky-700">২৩৪টি</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-400 font-bold">অর্জিত ব্যাজ</p>
            <p className="text-lg font-black text-amber-600">শিক্ষক মাস্টার 🎖️</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Stats vs Syllabus) */}
      <div className="flex bg-white rounded-2xl border border-[#E6E2D3] p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#1B4332]'
          }`}
        >
          বিষয়ভিত্তিক পরিসংখ্যান
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#1B4332]'
          }`}
        >
          NTRCA অফিশিয়াল সিলেবাস ও গাইড
        </button>
      </div>

      {/* Tab 1: Stats */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-3xl border border-[#E6E2D3] p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-black text-[#1B4332]">বিষয়ভিত্তিক দক্ষতার গ্রাফ</h2>

          <div className="space-y-4 text-xs">
            {[
              { name: 'বাংলা ভাষা ও সাহিত্য', score: 85, color: 'bg-emerald-600' },
              { name: 'ইংরেজি (Grammar)', score: 62, color: 'bg-blue-600' },
              { name: 'সাধারণ গণিত', score: 74, color: 'bg-rose-600' },
              { name: 'সাধারণ জ্ঞান (বাংলাদেশ ও আন্তর্জাতিক)', score: 88, color: 'bg-amber-600' },
              { name: 'আরবি ও ইসলামী শিক্ষা (মাদ্রাসা)', score: 92, color: 'bg-emerald-700' },
              { name: 'পেডাগোজি ও শিক্ষাদান পদ্ধতি', score: 80, color: 'bg-purple-600' },
            ].map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{s.name}</span>
                  <span>{s.score}% সঠিক</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Syllabus Breakdown */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          {syllabusModules.map((module, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-[#E6E2D3] p-5 shadow-xs space-y-3">
              <h3 className="text-sm sm:text-base font-black text-[#1B4332] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{module.subject}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 font-medium">
                {module.topics.map((topic, tIdx) => (
                  <div key={tIdx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
