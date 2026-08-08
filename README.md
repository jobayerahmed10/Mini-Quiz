# MiniQuiz - Student MCQ Practice App (বাংলা এমসিকিউ অনুশীলন প্ল্যাটফর্ম)

একটি দ্রুত, আধুনিক এবং প্রতিক্রিয়াশীল (responsive) বাংলা এমসিকিউ অনুশীলন অ্যাপ্লিকেশন। এটি শুধুমাত্র শিক্ষার্থীদের প্রশ্নের উত্তর দেওয়া এবং স্কোর জানার জন্য ডিজাইন করা হয়েছে (READ-ONLY Student App)। পরবর্তীতে এটি একটি ভিন্ন এডমিন প্যানেলের সাথে একই Supabase ডাটাবেসের মাধ্যমে যুক্ত হবে।

---

## 🚀 বৈশিষ্ট্যসমূহ (Features)

1. **বাংলা ইন্টারফেস**: সম্পূর্ণ ইউজার ইন্টারফেস সুন্দর বাংলা ফন্টসহ তৈরি।
2. **হোম পেজ (`/`)**:
   - অ্যাপের নাম: **MiniQuiz**
   - ট্যাগলাইন: *"প্রতিদিন অনুশীলন করুন, পরীক্ষার প্রস্তুতি নিন"*
   - "MCQ অনুশীলন শুরু করুন" বড় অ্যাকশন বাটন।
   - ৩টি কার্ড: **মোট প্রশ্ন**, **আজকের অনুশীলন**, এবং **সর্বশেষ প্রশ্ন**।
3. **অনুশীলন পেজ (`/practice`)**:
   - প্রতিবার ১টি করে প্রশ্ন প্রদর্শন।
   - বিকল্প অপশন (ক, খ, গ, ঘ) নির্বাচন সুবিধা।
   - সাথে সাথে সঠিক/ভুল উত্তর প্রদর্শন এবং উপলব্ধ থাকলে বিস্তারিত ব্যাখ্যা।
   - অগ্রগতি ট্র্যাকিং ("প্রশ্ন ১ / ১০")।
4. **ফলাফল পেজ (`/result`)**:
   - "পরীক্ষা সম্পন্ন!" বার্তা এবং কনফেটি অ্যানিমেশন।
   - **মোট প্রশ্ন**, **সঠিক উত্তর**, **ভুল উত্তর**, **প্রাপ্ত নম্বর** এবং **শতকরা %** স্কোর।
   - সম্পূর্ণ উত্তরপত্রের বিস্তারিত দেখার সুযোগ।
   - "আবার চেষ্টা করুন" ও "হোমে ফিরে যান" বাটন।
5. **Supabase Integration**:
   - `questions` টেবিল থেকে শুধুমাত্র `status = 'published'` ফিল্টার করা প্রশ্ন লোড করে।
   - ডাটাবেস খালি থাকলে বা সংযুক্ত না থাকলে পরিষ্কার ফাঁকা অবস্থা নির্দেশ করে ("এখনও কোনো প্রশ্ন প্রকাশ করা হয়নি।")।

---

## 🛠️ ইন্সটলেশন নির্দেশিকা (Installation)

১. প্রজেক্ট ফাইল ক্লোন করুন এবং ডিপেনডেন্সি ইন্সটল করুন:
```bash
npm install
```

---

## 🗄️ Supabase কনফিগারেশন ও SQL Schema

Supabase ড্যাশবোর্ডে গিয়ে **SQL Editor** খুলুন এবং নিচের কোডটি রান করে `questions` টেবিল তৈরি করুন:

```sql
-- ১. Table Creation
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- 'option_a', 'option_b', 'option_c', বা 'option_d'
  explanation TEXT,
  status TEXT DEFAULT 'published', -- 'published' অথবা 'draft'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ২. Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published questions" 
ON public.questions FOR SELECT 
USING (status = 'published');

-- ৩. নমুনা প্রশ্ন যুক্ত করতে:
INSERT INTO public.questions (question, option_a, option_b, option_c, option_d, correct_answer, explanation, status)
VALUES 
('বাংলাদেশের রাজধানীর নাম কী?', 'চট্টগ্রাম', 'ঢাকা', 'খুলনা', 'রাজশাহী', 'option_b', 'ঢাকা বাংলাদেশের রাজধানী ও বৃহত্তম শহর।', 'published'),
('বাংলাদেশের জাতীয় ফুল কোনটি?', 'গোলাপ', 'পদ্ম', 'শাপলা', 'জবা', 'option_c', 'সাদা শাপলা বাংলাদেশের জাতীয় ফুল।', 'published'),
('আন্তর্জাতিক মাতৃভাষা দিবস কত তারিখে পালিত হয়?', '২৬ মার্চ', '১৬ ডিসেম্বর', '২১ ফেব্রুয়ারি', '১৪ এপ্রিল', 'option_c', 'ইউনেস্কো ২১ ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস ঘোষণা করেছে।', 'published');
```

---

## 🔑 এনভায়রনমেন্ট ভ্যারিয়েবল (Environment Variables)

আপনার প্রজেক্টের রুট ডিরেক্টরিতে `.env.local` তৈরি করুন এবং আপনার Supabase URL ও Key দিন:

```env
# Next.js / Vercel deployment:
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key

# Vite local dev:
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

---

## 💻 লোকালভাবে রান করা (Run Locally)

```bash
npm run dev
```
ব্রাউজারে [http://localhost:3000](http://localhost:3000) লিংকে গিয়ে অ্যাপ দেখুন।

---

## ☁️ Vercel-এ ডেপ্লয়মেন্ট নির্দেশিকা (Deploy to Vercel)

১. প্রজেক্টটি GitHub-এ পুশ করুন।
২. [Vercel Dashboard](https://vercel.com/dashboard) এ গিয়ে **New Project** সিলেক্ট করুন।
III. GitHub রেপোজিটরি ইমপোর্ট করুন।
৪. **Environment Variables** সেকশনে আপনার `NEXT_PUBLIC_SUPABASE_URL` এবং `NEXT_PUBLIC_SUPABASE_ANON_KEY` যুক্ত করুন।
৫. **Deploy** বাটনে ক্লিক করুন।

বিল্ড কমান্ড: `npm run build`
বিল্ড আউটপুট: স্বয়ংক্রিয় (Standard Next.js / Vite build output)
