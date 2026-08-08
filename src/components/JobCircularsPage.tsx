import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronRight,
  X,
  Share2,
  Bookmark
} from 'lucide-react';
import { JobCircular } from '../types';
import { JOB_CIRCULARS_DATA } from '../data/jobCircularsData';

interface JobCircularsPageProps {
  onStartModelTestForCategory?: (categoryName: string) => void;
}

export const JobCircularsPage: React.FC<JobCircularsPageProps> = ({
  onStartModelTestForCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeJobModal, setActiveJobModal] = useState<JobCircular | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'সকল সার্কুলার' },
    { id: 'NTRCA', label: 'NTRCA শিক্ষক নিবন্ধন' },
    { id: 'মাদ্রাসা ও কারিগরি', label: 'মাদ্রাসা ও কারিগরি' },
    { id: 'প্রাথমিক বিদ্যালয়', label: 'প্রাথমিক বিদ্যালয়' },
    { id: 'সরকারি হাইস্কুল', label: 'সরকারি হাইস্কুল' },
  ];

  const filteredJobs = JOB_CIRCULARS_DATA.filter((job) => {
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSaveJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs(savedJobs.filter((j) => j !== id));
    } else {
      setSavedJobs([...savedJobs, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1F4E3A] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-400/30 text-xs font-bold text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>শিক্ষক নিয়োগ ও সরকারি চাকরি আপডেট ২০২৬</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            শিক্ষক নিয়োগ জব পোর্টাল ও সার্কুলার
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            বেসরকারি শিক্ষক নিবন্ধন (NTRCA), মাদ্রাসা শিক্ষা অধিদপ্তর, প্রাথমিক সহকারী শিক্ষক ও সরকারি হাইস্কুল নিয়োগের সঠিক তথ্য ও আপডেট।
          </p>

          {/* Quick Stats */}
          <div className="pt-2 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <p className="text-lg font-black text-amber-300">৩৫,০০০+</p>
              <p className="text-[10px] text-emerald-100 font-semibold">NTRCA পদসংখ্যা</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <p className="text-lg font-black text-emerald-300">৪,৫২০+</p>
              <p className="text-[10px] text-emerald-100 font-semibold">মাদ্রাসা শিক্ষক</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
              <p className="text-lg font-black text-sky-300">১৩,৭৭০+</p>
              <p className="text-[10px] text-emerald-100 font-semibold">প্রাথমিক শিক্ষক</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পদ, প্রতিষ্ঠান বা সার্কুলার নাম লিখে খুঁজুন..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6E2D3] rounded-2xl text-xs sm:text-sm text-[#1B4332] font-semibold focus:outline-none focus:border-[#1B4332] shadow-xs"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-[#E6E2D3] hover:bg-emerald-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Circulars List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#1B4332]">
          <span>সর্বশেষ শিক্ষক নিয়োগ সার্কুলারসমূহ ({filteredJobs.length}টি)</span>
          <span className="text-emerald-700">নিয়মিত হালনাগাদকৃত</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setActiveJobModal(job)}
              className="bg-white rounded-2xl border border-[#E6E2D3] p-5 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer space-y-3 group relative overflow-hidden"
            >
              {job.isHot && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                  হট সার্কুলার 🔥
                </div>
              )}

              <div className="space-y-1 pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                    {job.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {job.organization}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-[#1B4332] group-hover:text-emerald-700 transition-colors">
                  {job.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">পদসংখ্যা: <strong className="text-emerald-800">{job.vacancyCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">শেষ সময়: <strong className="text-rose-700">{job.deadline}</strong></span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">প্রকাশিত: {job.publishedDate}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => toggleSaveJob(job.id, e)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Bookmark className={`w-4 h-4 ${savedJobs.includes(job.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                  <span className="font-extrabold text-[#1B4332] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    বিস্তারিত দেখুন <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Modal */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveJobModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                {activeJobModal.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1B4332]">
                {activeJobModal.title}
              </h2>
              <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {activeJobModal.organization}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl grid grid-cols-2 gap-3 text-xs text-[#1B4332]">
              <div>
                <p className="text-slate-500 font-medium">পদবী</p>
                <p className="font-bold">{activeJobModal.designation}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">মোট খালি পদ</p>
                <p className="font-bold text-emerald-800">{activeJobModal.vacancyCount}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">আবেদনের শেষ তারিখ</p>
                <p className="font-bold text-rose-700">{activeJobModal.deadline}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">বেতন স্কেল</p>
                <p className="font-bold">{activeJobModal.salaryRange}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-[#1B4332]">বিবরণ ও বিবরণী:</h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {activeJobModal.description}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-[#1B4332]">আবশ্যকীয় যোগ্যতা ও শর্তাবলি:</h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {activeJobModal.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 justify-between">
              {activeJobModal.applyUrl && (
                <a
                  href={activeJobModal.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1B4332] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>অফিশিয়াল লিংকে আবেদন করুন</span>
                </a>
              )}

              {onStartModelTestForCategory && (
                <button
                  onClick={() => {
                    setActiveJobModal(null);
                    onStartModelTestForCategory(activeJobModal.category);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>এই সার্কুলারের প্রাক-প্রস্তুতি টেস্ট দিন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
