import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, Sparkles, Key, Save, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, getSavedSupabaseConfig, saveCustomSupabaseConfig, resetCustomSupabaseConfig } from '../lib/supabase';

interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const savedConfig = getSavedSupabaseConfig();
  const [inputUrl, setInputUrl] = useState(savedConfig.url || '');
  const [inputKey, setInputKey] = useState(savedConfig.key || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      alert('অনুগ্রহ করে Supabase URL এবং Anon Key উভয় ফিল্ডই পূরণ করুন।');
      return;
    }
    saveCustomSupabaseConfig(inputUrl, inputKey);
    setSaveSuccess(true);
  };

  const handleResetConfig = () => {
    if (confirm('আপনি কি সত্যিই ব্রাউজারে সেভ করা Supabase Key মুছে ফেলতে চান?')) {
      resetCustomSupabaseConfig();
    }
  };

  const sqlSchema = `-- ==========================================
-- ১. প্রশ্ন ব্যাংক টেবিল (public.questions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- 'option_a', 'option_b', 'option_c', বা 'option_d'
  explanation TEXT,
  subject TEXT,
  topic TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published questions" 
ON public.questions FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public insert and delete for questions" 
ON public.questions FOR ALL USING (true);

-- ==========================================
-- ২. পরীক্ষা ও মডেল টেস্ট টেবিল (public.exams)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  badge TEXT NOT NULL, -- যেমন: 'দৈনিক মডেল টেস্ট', 'সাপ্তাহিক মডেল টেস্ট', 'ফ্রি পরীক্ষা', 'লাইভ টেস্ট'
  badge_type TEXT DEFAULT 'free', -- 'free', 'daily', 'weekly', বা 'live'
  subject TEXT DEFAULT 'সকল বিষয়',
  question_count INT DEFAULT 25,
  time_minutes INT DEFAULT 20,
  negative_marks NUMERIC DEFAULT 0.50,
  total_marks INT DEFAULT 25,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active' বা 'draft'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active exams" 
ON public.exams FOR SELECT USING (status = 'active');

CREATE POLICY "Allow public insert and delete for exams" 
ON public.exams FOR ALL USING (true);

-- ৩. নমুনা পরীক্ষা ডেটা যুক্ত করতে এই কোড ইনসার্ট করতে পারেন:
INSERT INTO public.exams (title, badge, badge_type, subject, question_count, time_minutes, negative_marks, total_marks, description)
VALUES 
('দৈনিক ফ্রি ১০০ মার্কস প্রিলিমিনারি প্রাকটিস মডেল টেস্ট', 'দৈনিক মডেল টেস্ট', 'daily', 'সকল বিষয়', 100, 60, 0.50, 100, '১০০ নম্বরের ১ ঘণ্টার পূর্ণাঙ্গ প্রিলিমিনারি মডেল টেস্ট।'),
('সাপ্তাহিক স্পেশাল মেগা প্রিলিমিনারি মডেল টেস্ট', 'সাপ্তাহিক মডেল টেস্ট', 'weekly', 'সকল বিষয়', 50, 35, 0.50, 50, 'সপ্তাহের সেরা বাছাইকৃত ৫০টি প্রশ্ন।'),
('ফ্রি সাধারণ জ্ঞান কুইক টেস্ট', 'ফ্রি পরীক্ষা', 'free', 'বাংলাদেশ বিষয়াবলী', 25, 15, 0.50, 25, 'সাম্প্রতিক ও ইতিহাস ভিত্তিক ফ্রি কুইক টেস্ট।');
-- ==========================================
-- ৩. কোর্স ব্যবস্থাপনা টেবিল (public.courses)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  badge TEXT DEFAULT 'রেকর্ড ব্যাচ',
  badge_sub TEXT,
  classes_count INT DEFAULT 0,
  sheets_count INT DEFAULT 0,
  exams_count INT DEFAULT 0,
  enrolled_count TEXT DEFAULT '0',
  price TEXT DEFAULT '৯৫০',
  accent_color TEXT DEFAULT 'purple',
  topics JSONB DEFAULT '[]'::jsonb,
  instructor TEXT,
  is_enrolled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active courses" 
ON public.courses FOR SELECT USING (status = 'active');

CREATE POLICY "Allow public all access for courses" 
ON public.courses FOR ALL USING (true);

-- ==========================================
-- ৪. ভর্তি আবেদন টেবিল (public.course_applications & public.course_enrollments)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.course_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  payment_method TEXT NOT NULL, -- bkash, nagad, rocket
  amount TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access for course_applications" 
ON public.course_applications FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  payment_method TEXT NOT NULL, -- bkash, nagad, rocket
  amount TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access for course_enrollments" 
ON public.course_enrollments FOR ALL USING (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D4B3E]/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-[28px] shadow-2xl overflow-hidden border border-[#E6E2D3] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#2D4B3E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#8AA682]" />
            <h3 className="font-bold text-lg text-white">Supabase ডাটাবেস কনফিগারেশন গাইড</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#2D4B3E] text-sm leading-relaxed">
          {/* Status Badge */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isSupabaseConfigured 
              ? 'bg-[#F5F2EA] border-[#8AA682] text-[#2D4B3E]' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${isSupabaseConfigured ? 'text-[#8AA682]' : 'text-amber-600'}`} />
            <div>
              <p className="font-bold text-base mb-0.5">
                {isSupabaseConfigured ? 'Supabase এর সাথে সঠিকভাবে সংযুক্ত' : 'Supabase যুক্ত করা নেই (ডেমো মোড)'}
              </p>
              <p className="text-xs opacity-90">
                {isSupabaseConfigured 
                  ? 'আপনার অ্যাপ এখন সুপাবেজ ডাটাবেসের সাথে যুক্ত। আপনার ভর্তি আবেদন ও অন্যান্য তথ্য সরাসরি ক্লাউড ডাটাবেসে সেভ হচ্ছে।'
                  : 'আপনি এখন ডেমো মোডে আছেন। সরাসরি অ্যাপেই আপনার Supabase URL ও Anon Key ইনপুট দিয়ে সেভ করতে পারেন।'}
              </p>
            </div>
          </div>

          {/* Direct Input Form for Supabase Credentials */}
          <div className="bg-[#2D4B3E]/5 p-4 rounded-2xl border border-[#2D4B3E]/20 space-y-3">
            <div className="flex items-center gap-2 text-[#2D4B3E] font-bold text-sm">
              <Key className="w-4 h-4 text-[#8AA682]" />
              <span>অ্যাপ থেকে সরাসরি Supabase URL & Key সেভ করুন:</span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#2D4B3E]">
                  Supabase Project URL:
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-[#2D4B3E] focus:outline-none focus:ring-2 focus:ring-[#8AA682]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[#2D4B3E]">
                  Supabase Anon / Public Key:
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-[#2D4B3E] font-mono focus:outline-none focus:ring-2 focus:ring-[#8AA682]"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#046A38] text-white hover:bg-[#03522b] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>কানেক্ট ও সেভ করুন</span>
                </button>

                {savedConfig.isCustom && (
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>রিসেট করুন</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h4 className="font-bold text-[#2D4B3E] text-base mb-2">১. Supabase Key & URL কোথায় পাবেন?</h4>
            <ol className="list-decimal pl-5 text-xs text-[#2D4B3E]/90 space-y-1.5 mb-3 bg-[#F5F2EA] p-3.5 rounded-2xl border border-[#E6E2D3]">
              <li><strong>Supabase Dashboard</strong> (supabase.com) এ লগইন করে আপনার প্রজেক্ট ওপেন করুন।</li>
              <li>বাম সাইডবারের গিয়ার আইকন <strong>Project Settings</strong> এ যান।</li>
              <li><strong>API</strong> ট্যাবে ক্লিক করুন।</li>
              <li>সেখানে <strong>Project URL</strong> এবং <strong>anon / public</strong> (Project API Key) কপি করুন।</li>
            </ol>

            <h4 className="font-bold text-[#2D4B3E] text-base mb-2">২. Vercel এ কীভাবে যুক্ত করবেন?</h4>
            <p className="text-[#2D4B3E]/80 mb-2 text-xs">
              Vercel এ ডিপ্লয় করা থাকলে <strong>Project Settings &gt; Environment Variables</strong> এ নিচের কাস্টম নাম দিয়ে Key দুটি যোগ করে <strong>Redeploy</strong> দিন:
            </p>
            <div className="bg-[#2D4B3E] text-slate-100 p-3.5 rounded-2xl font-mono text-xs overflow-x-auto space-y-1">
              <div className="text-[#8AA682]">// Vercel Environment Variables:</div>
              <div>VITE_SUPABASE_URL = https://xxxx.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-[#2D4B3E] text-base">৩. Supabase Table & RLS SQL Schema</h4>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F5F2EA] text-[#2D4B3E] hover:bg-[#E6E2D3] border border-[#E6E2D3] rounded-full text-xs font-semibold transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#8AA682]" />
                    <span>কপি করা হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8AA682]" />
                    <span>SQL কপি করুন</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-[#2D4B3E] text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-56 leading-normal">
              {sqlSchema}
            </pre>
          </div>

          <div className="bg-[#F5F2EA] p-4 rounded-2xl border border-[#E6E2D3] text-xs text-[#2D4B3E] space-y-2">
            <p className="font-bold">📌 মনে রাখুন (Student App Behavior):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>এই Student App শুধু <code className="text-[#2D4B3E] font-bold">status = &apos;published&apos;</code> ফিল্টার করা প্রশ্নগুলো পাঠ করবে।</li>
              <li>শিক্ষার্থী অ্যাপ থেকে নতুন প্রশ্ন তৈরি, এডিট বা ডিলিট করা সম্ভব নয়।</li>
              <li>পরবর্তীতে তৈরি হওয়া এডমিন প্যানেল এই একই Supabase ডাটাবেসে প্রশ্ন সেভ করবে।</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F5F2EA] border-t border-[#E6E2D3] flex items-center justify-between">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2D4B3E] hover:underline font-bold"
          >
            Supabase Dashboard খুলুন
            <ExternalLink className="w-3.5 h-3.5 text-[#8AA682]" />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2D4B3E] text-white hover:bg-[#233B31] rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
