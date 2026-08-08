import React, { useState } from 'react';
import { X, Copy, Check, Database, ExternalLink, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- ১. Supabase SQL Editor-এ গিয়ে এই টেবিলটি তৈরি করুন:
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- 'option_a', 'option_b', 'option_c', বা 'option_d'
  explanation TEXT,
  subject TEXT, -- যেমন: 'বাংলা ভাষা ও সাহিত্য', 'বাংলাদেশ বিষয়াবলী', 'ইংরেজি ভাষা ও সাহিত্য'
  topic TEXT, -- যেমন: 'ব্যাকরণ', 'ইতিহাস', 'জ্যোতির্বিজ্ঞান'
  status TEXT DEFAULT 'published', -- 'published' অথবা 'draft'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ২. RLS (Row Level Security) পাবলিক রিড পারমিশন সক্রিয় করুন:
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published questions" 
ON public.questions FOR SELECT 
USING (status = 'published');

-- ৩. নমুনা বিষয ভিত্তিক প্রকাশিত প্রশ্ন যুক্ত করতে এই কোড চালান:
INSERT INTO public.questions (question, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, topic, status)
VALUES 
('বাংলাদেশের রাজধানীর নাম কী?', 'চট্টগ্রাম', 'ঢাকা', 'খুলনা', 'রাজশাহী', 'option_b', 'ঢাকা বাংলাদেশের রাজধানী ও বৃহত্তম শহর।', 'বাংলাদেশ বিষয়াবলী', 'ভৌগোলিক পরিচিতি', 'published'),
('‘সোনার তরী’ কাব্যগ্রন্থ কার রচনা?', 'কাজী নজরুল ইসলাম', 'রবীন্দ্রনাথ ঠাকুর', 'জসীমউদ্দীন', 'মাইকেল মধুসূদন দত্ত', 'option_b', 'বিশ্বকবি রবীন্দ্রনাথ ঠাকুর ১৮৯৪ সালে ‘সোনার তরী’ প্রকাশ করেন।', 'বাংলা ভাষা ও সাহিত্য', 'বাংলা সাহিত্য', 'published'),
('আন্তর্জাতিক মাতৃভাষা দিবস কত তারিখে পালিত হয়?', '২৬ মার্চ', '১৬ ডিসেম্বর', '২১ ফেব্রুয়ারি', '১৪ এপ্রিল', 'option_c', 'ইউনেস্কো ২১ ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস ঘোষণা করেছে।', 'আন্তর্জাতিক বিষয়াবলী', 'আন্তর্জাতিক দিবস', 'published');
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
                {isSupabaseConfigured ? 'Supabase এর সাথে সংযুক্ত' : 'Supabase কী সংযুক্ত নেই (ডেমো মোড সক্রিয়)'}
              </p>
              <p className="text-xs opacity-90">
                {isSupabaseConfigured 
                  ? 'আপনার অ্যাপ এখন Supabase ডাটাবেসের questions টেবিল থেকে সরাসরি প্রশ্ন লোড করছে।'
                  : 'আপনি এখন ডেমো প্রশ্ন দিয়ে অ্যাপের ট্রায়াল দেখতে পাচ্ছেন। সরাসরি Supabase সংযুক্ত করতে নিচের নির্দেশাবলী অনুসরণ করুন।'}
              </p>
            </div>
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
