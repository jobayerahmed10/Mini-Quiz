import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Question,
  CourseModule,
  CourseEnrollmentRecord,
  CourseSheet,
  CourseExam,
  CourseRoutineItem,
  CourseSyllabusItem
} from '../types';
import { detectQuestionSubject } from './subjects';

/**
 * Safely retrieve Supabase configuration.
 * For this Vite project:
 * Primary: localStorage custom credentials if set by user
 * Secondary: import.meta.env.VITE_SUPABASE_URL & import.meta.env.VITE_SUPABASE_ANON_KEY
 * Fallbacks: process.env or NEXT_PUBLIC_* variables
 */
const DEFAULT_SUPABASE_URL = 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('custom_supabase_url');
    if (customUrl && customUrl.trim()) return customUrl.trim();
  }
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_URL) return metaEnv.VITE_SUPABASE_URL;
    if (metaEnv.NEXT_PUBLIC_SUPABASE_URL) return metaEnv.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  return DEFAULT_SUPABASE_URL;
};

const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('custom_supabase_anon_key');
    if (customKey && customKey.trim()) return customKey.trim();
  }
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_ANON_KEY) return metaEnv.VITE_SUPABASE_ANON_KEY;
    if (metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) return metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return DEFAULT_SUPABASE_ANON_KEY;
};

export const getSavedSupabaseConfig = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isCustom = typeof window !== 'undefined' && Boolean(localStorage.getItem('custom_supabase_url'));
  return { url, key, isCustom };
};

export const saveCustomSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const resetCustomSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('custom_supabase_url');
    localStorage.removeItem('custom_supabase_anon_key');
    window.location.reload();
  }
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseUrl.includes('your-project')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = supabaseInstance;

export interface FetchQuestionsResult {
  questions: Question[];
  isFromSupabase: boolean;
  error?: string | null;
}

async function fetchWithTimeout<T>(promisePromise: Promise<T>, timeoutMs = 6000, fallbackVal: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Supabase network request timed out after ${timeoutMs}ms`);
      resolve(fallbackVal);
    }, timeoutMs);
  });

  return Promise.race([promisePromise, timeoutPromise]).then((res) => {
    clearTimeout(timer);
    return res;
  });
}

/**
 * Fetches published questions from Supabase table 'public.questions'
 * Only fetches rows where status = 'published'
 */
export async function fetchPublishedQuestions(): Promise<FetchQuestionsResult> {
  let cachedQuestions: Question[] = [];
  try {
    const raw = localStorage.getItem('miniquiz_questions_cache');
    if (raw) cachedQuestions = JSON.parse(raw);
  } catch {}

  if (!supabaseInstance) {
    return {
      questions: cachedQuestions,
      isFromSupabase: false,
      error: cachedQuestions.length > 0 ? null : 'Supabase এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই।',
    };
  }

  try {
    const queryPromise = Promise.resolve(supabaseInstance
      .from('questions')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }));

    const timeoutFallback = { data: null, error: { message: 'Network Timeout (Mobile Data)', code: 'TIMEOUT' } };
    const { data, error } = await fetchWithTimeout(queryPromise, 6000, timeoutFallback as any);

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        questions: cachedQuestions,
        isFromSupabase: true,
        error: cachedQuestions.length > 0 ? null : `Supabase কুয়েরি ত্রুটি: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        questions: cachedQuestions,
        isFromSupabase: true,
        error: null,
      };
    }

    // Cast & format fetched items from public.questions with subject auto-detection fallback
    const questionsList: Question[] = data.map((item: any) => {
      const qObj: Question = {
        id: String(item.id),
        question: String(item.question || ''),
        option_a: String(item.option_a || ''),
        option_b: String(item.option_b || ''),
        option_c: String(item.option_c || ''),
        option_d: String(item.option_d || ''),
        correct_answer: (item.correct_answer || 'option_a') as 'option_a' | 'option_b' | 'option_c' | 'option_d',
        explanation: item.explanation ? String(item.explanation) : null,
        status: item.status || 'published',
        subject: item.subject ? String(item.subject) : null,
        topic: item.topic ? String(item.topic) : null,
        created_at: item.created_at || new Date().toISOString(),
      };

      // Assign detected subject if null
      qObj.subject = detectQuestionSubject(qObj);
      return qObj;
    });

    try {
      localStorage.setItem('miniquiz_questions_cache', JSON.stringify(questionsList));
    } catch {}

    return {
      questions: questionsList,
      isFromSupabase: true,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    return {
      questions: cachedQuestions,
      isFromSupabase: true,
      error: cachedQuestions.length > 0 ? null : `Supabase সংযোগ ত্রুটি: ${errorMsg}`,
    };
  }
}

export interface ExamItem {
  id: string;
  title: string;
  badge: string;
  badge_type: 'free' | 'daily' | 'weekly' | 'live';
  subject: string;
  question_count: number;
  time_minutes: number;
  negative_marks: number;
  total_marks: number;
  description?: string;
  examinee_count?: string;
  examinee_tag?: string;
  is_premium?: boolean;
  status?: string;
  created_at?: string;
}

export interface FetchExamsResult {
  exams: ExamItem[];
  isFromSupabase: boolean;
  error?: string | null;
}

/**
 * Default fallback list of exams when Supabase is empty or not configured
 */
export const DEFAULT_EXAM_PRESETS: ExamItem[] = [
  {
    id: 'free-daily-1',
    title: 'আজকের স্পেশাল ডেইলি মডেল টেস্ট (২৯তম দিন)',
    badge: 'দৈনিক মডেল টেস্ট',
    badge_type: 'daily',
    subject: 'আরবি ব্যাকরণ (নাহু ও সরফ)',
    question_count: 25,
    time_minutes: 25,
    negative_marks: 0.50,
    total_marks: 25,
    description: '১৮তম ও ১৯তম শিক্ষক নিবন্ধন পরীক্ষার্থীদের জন্য স্পেশাল ডেইলি প্রাকটিস টেস্ট।',
    examinee_count: '২,৮৫০+',
    examinee_tag: 'আজকের টেস্ট',
    is_premium: false,
    status: 'active',
  },
  {
    id: 'free-topic-1',
    title: 'সহকারী মৌলভী বিষয়ভিত্তিক ফ্রি প্র্যাকটিস টেস্ট',
    badge: 'ফ্রি এক্সাম',
    badge_type: 'free',
    subject: 'ফিকহ ও উসূলে ফিকহ',
    question_count: 30,
    time_minutes: 30,
    negative_marks: 0.50,
    total_marks: 30,
    description: 'ফিকহ ও উসূলে ফিকহ বিষয়ের ১০০% গুরুত্বপূর্ণ বাছাইকৃত প্রশ্নাবলী।',
    examinee_count: '৩,২০০+',
    examinee_tag: 'চলতি সপ্তাহ',
    is_premium: false,
    status: 'active',
  },
  {
    id: 'vip-mega-1',
    title: 'ভিআইপি প্রভাষক (আরবি ক্যাডার) প্রিমিয়াম মেগা মডেল টেস্ট',
    badge: 'প্রিমিয়াম ভিআইপি',
    badge_type: 'weekly',
    subject: 'আল-কুরআন, হাদিস, বালাগাত ও ফিকহুস সুন্নাহ',
    question_count: 100,
    time_minutes: 90,
    negative_marks: 0.50,
    total_marks: 100,
    description: '১০০ নম্বরের মেগা মডেল টেস্ট উইথ বিস্তারিত ব্যাখ্যা ও নেগেটিভ মার্কিং।',
    examinee_count: '১,৯৮০+',
    examinee_tag: 'স্পেশাল ভিআইপি',
    is_premium: true,
    status: 'active',
  },
  {
    id: 'free-live-1',
    title: 'আগামীকালের লাইভ সাবজেক্ট উইকলি ব্যাটল',
    badge: 'লাইভ পরীক্ষা',
    badge_type: 'live',
    subject: 'নাহু-সরফ ও আরবি সাহিত্য',
    question_count: 40,
    time_minutes: 40,
    negative_marks: 0.50,
    total_marks: 40,
    description: 'সারা দেশের হাজারো পরীক্ষার্থীর সাথে সরাসরি লাইভ লিডারবোর্ডে অংশ নিন।',
    examinee_count: '২,১০০+',
    examinee_tag: 'লাইভ চলছে',
    is_premium: false,
    status: 'active',
  },
];

/**
 * Fetches exams/model tests from Supabase table 'public.exams'
 */
export async function fetchExamsFromSupabase(): Promise<FetchExamsResult> {
  let cachedExams: ExamItem[] = DEFAULT_EXAM_PRESETS;
  try {
    const raw = localStorage.getItem('miniquiz_exams_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) cachedExams = parsed;
    }
  } catch {}

  if (!supabaseInstance) {
    return {
      exams: cachedExams,
      isFromSupabase: false,
      error: null,
    };
  }

  try {
    const queryPromise = Promise.resolve(supabaseInstance
      .from('exams')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false }));

    const timeoutFallback = { data: null, error: { message: 'Network Timeout (Mobile Data)', code: 'TIMEOUT' } };
    const { data, error } = await fetchWithTimeout(queryPromise, 6000, timeoutFallback as any);

    if (error) {
      console.warn('Supabase fetch exams error:', error);
      // Fallback to default presets or cached exams
      return {
        exams: cachedExams,
        isFromSupabase: true,
        error: `Supabase Table 'exams' পাওয়া যায়নি। ডেমো লিস্ট দেখানো হচ্ছে। (ত্রুটি: ${error.message})`,
      };
    }

    if (!data || data.length === 0) {
      return {
        exams: cachedExams,
        isFromSupabase: true,
        error: null,
      };
    }

    const fetchedExams: ExamItem[] = data.map((item: any) => ({
      id: String(item.id),
      title: String(item.title || 'পরীক্ষা'),
      badge: String(item.badge || 'ফ্রি পরীক্ষা'),
      badge_type: (item.badge_type || 'free') as 'free' | 'daily' | 'weekly' | 'live',
      subject: String(item.subject || 'সকল বিষয়'),
      question_count: Number(item.question_count || 25),
      time_minutes: Number(item.time_minutes || 20),
      negative_marks: Number(item.negative_marks || 0.5),
      total_marks: Number(item.total_marks || item.question_count || 25),
      description: item.description ? String(item.description) : undefined,
      examinee_count: item.examinee_count ? String(item.examinee_count) : '২,৫০০+',
      examinee_tag: item.examinee_tag ? String(item.examinee_tag) : 'আজকের টেস্ট',
      is_premium: Boolean(item.is_premium),
      status: item.status || 'active',
      created_at: item.created_at,
    }));

    try {
      localStorage.setItem('miniquiz_exams_cache', JSON.stringify(fetchedExams));
    } catch {}

    return {
      exams: fetchedExams,
      isFromSupabase: true,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      exams: cachedExams,
      isFromSupabase: true,
      error: `Supabase ত্রুটি: ${msg}`,
    };
  }
}

/**
 * Inserts a new exam into Supabase 'public.exams' table
 */
export async function addExamToSupabase(input: Omit<ExamItem, 'id'>): Promise<{ success: boolean; data?: ExamItem; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ সেটআপ করা নেই।',
    };
  }

  try {
    const newRecord = {
      title: input.title.trim(),
      badge: input.badge.trim(),
      badge_type: input.badge_type || 'free',
      subject: input.subject.trim(),
      question_count: input.question_count,
      time_minutes: input.time_minutes,
      negative_marks: input.negative_marks,
      total_marks: input.total_marks,
      description: input.description?.trim() || null,
      status: input.status || 'active',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseInstance
      .from('exams')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase add exam error:', error);
      return {
        success: false,
        error: `পরীক্ষা যুক্ত করা যায়নি: ${error.message}`,
      };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        title: data.title,
        badge: data.badge,
        badge_type: data.badge_type,
        subject: data.subject,
        question_count: data.question_count,
        time_minutes: data.time_minutes,
        negative_marks: data.negative_marks,
        total_marks: data.total_marks,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
    return {
      success: false,
      error: `Supabase ত্রুটি: ${msg}`,
    };
  }
}

/**
 * Deletes an exam from Supabase table 'public.exams'
 */
export async function deleteExamFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ নেই।',
    };
  }

  try {
    const { error } = await supabaseInstance
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
    return { success: false, error: msg };
  }
}

export interface NewQuestionInput {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'option_a' | 'option_b' | 'option_c' | 'option_d';
  subject: string;
  topic?: string;
  explanation?: string;
  status?: string;
}

/**
 * Inserts a new MCQ question into Supabase 'public.questions' table
 */
export async function addQuestionToSupabase(input: NewQuestionInput): Promise<{ success: boolean; data?: Question; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ নেই। ডেমো মোডে নতুন প্রশ্ন যুক্ত হচ্ছে।',
    };
  }

  try {
    const newRecord = {
      question: input.question.trim(),
      option_a: input.option_a.trim(),
      option_b: input.option_b.trim(),
      option_c: input.option_c.trim(),
      option_d: input.option_d.trim(),
      correct_answer: input.correct_answer,
      subject: input.subject.trim(),
      topic: input.topic?.trim() || null,
      explanation: input.explanation?.trim() || null,
      status: input.status || 'published',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseInstance
      .from('questions')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: `প্রশ্ন যুক্ত করতে ব্যর্থ: ${error.message}`,
      };
    }

    return {
      success: true,
      data: {
        id: String(data.id),
        question: data.question,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        subject: data.subject,
        topic: data.topic,
        status: data.status,
        created_at: data.created_at,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
    return {
      success: false,
      error: `Supabase ইনসার্ট ত্রুটি: ${msg}`,
    };
  }
}

/**
 * Deletes a question from Supabase by ID
 */
export async function deleteQuestionFromSupabase(id: string | number): Promise<{ success: boolean; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ নেই।',
    };
  }

  try {
    const { error } = await supabaseInstance
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
    return { success: false, error: msg };
  }
}

export interface LeaderboardEntry {
  id: string;
  exam_id: string;
  exam_title: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  created_at: string;
}

const LOCAL_LEADERBOARD_KEY = 'tamreen_leaderboard_entries';

export function getLocalLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalLeaderboardEntry(entry: LeaderboardEntry): void {
  try {
    const current = getLocalLeaderboardEntries();
    // Match strictly by exact entry ID so distinct users are never merged or overwritten
    const existingIndex = current.findIndex((item) => item.id === entry.id);
    if (existingIndex >= 0) {
      current[existingIndex] = entry;
    } else {
      current.push(entry);
    }
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(current));

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('tamreen_leaderboard_channel');
        bc.postMessage({ type: 'LEADERBOARD_UPDATED', entry });
        bc.close();
      } catch {}
    }
  } catch {}
}

export async function saveLeaderboardEntryToSupabase(entry: LeaderboardEntry): Promise<{ success: boolean; error?: string }> {
  saveLocalLeaderboardEntry(entry);

  // 1. Post to Express Server API for cross-user/cross-device leaderboard sharing
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (apiErr) {
    console.warn('Server API leaderboard post error:', apiErr);
  }

  // 2. Post to Supabase if configured
  if (!supabaseInstance) {
    return { success: true };
  }

  try {
    const record = {
      id: entry.id,
      exam_id: entry.exam_id,
      exam_title: entry.exam_title,
      user_id: entry.user_id || null,
      user_name: entry.user_name,
      user_avatar: entry.user_avatar || null,
      score: entry.score,
      total_questions: entry.total_questions,
      correct_count: entry.correct_count,
      wrong_count: entry.wrong_count,
      accuracy: entry.accuracy,
      created_at: entry.created_at || new Date().toISOString(),
    };

    const { error } = await supabaseInstance
      .from('leaderboard_entries')
      .insert([record]);

    if (error) {
      console.warn('Supabase leaderboard_entries insert warning:', error.message);
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: true, error: msg };
  }
}

export async function fetchLeaderboardEntriesFromSupabase(examId?: string): Promise<LeaderboardEntry[]> {
  const localEntries = getLocalLeaderboardEntries();
  let serverEntries: LeaderboardEntry[] = [];

  // 1. Fetch from Express Server API (contains submissions from all users)
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.entries)) {
        serverEntries = data.entries.map((item: any) => ({
          id: String(item.id || `srv_${Math.random()}`),
          exam_id: String(item.exam_id || 'general'),
          exam_title: String(item.exam_title || 'পরীক্ষা'),
          user_id: item.user_id ? String(item.user_id) : undefined,
          user_name: String(item.user_name || 'পরীক্ষার্থী'),
          user_avatar: item.user_avatar ? String(item.user_avatar) : undefined,
          score: Number(item.score || 0),
          total_questions: Number(item.total_questions || 0),
          correct_count: Number(item.correct_count || 0),
          wrong_count: Number(item.wrong_count || 0),
          accuracy: Number(item.accuracy || 0),
          created_at: String(item.created_at || new Date().toISOString()),
        }));
      }
    }
  } catch (srvErr) {
    console.warn('Could not fetch server leaderboard entries:', srvErr);
  }

  let dbEntries: LeaderboardEntry[] = [];

  // 2. Fetch from Supabase if configured
  if (supabaseInstance) {
    try {
      let query = supabaseInstance
        .from('leaderboard_entries')
        .select('id, exam_id, exam_title, user_id, user_name, user_avatar, score, total_questions, correct_count, wrong_count, accuracy, created_at')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);

      const queryPromise = Promise.resolve(query);
      const timeoutFallback = { data: null, error: { message: 'Timeout' } };
      const { data, error } = await fetchWithTimeout(queryPromise, 6000, timeoutFallback as any);

      if (data && !error && Array.isArray(data)) {
        dbEntries = data.map((item: any) => ({
          id: String(item.id || `db_${Math.random()}`),
          exam_id: String(item.exam_id || 'general'),
          exam_title: String(item.exam_title || 'পরীক্ষা'),
          user_id: item.user_id ? String(item.user_id) : undefined,
          user_name: String(item.user_name || 'পরীক্ষার্থী'),
          user_avatar: item.user_avatar ? String(item.user_avatar) : undefined,
          score: Number(item.score || 0),
          total_questions: Number(item.total_questions || 0),
          correct_count: Number(item.correct_count || 0),
          wrong_count: Number(item.wrong_count || 0),
          accuracy: Number(item.accuracy || 0),
          created_at: String(item.created_at || new Date().toISOString()),
        }));
      }
    } catch (dbErr) {
      console.warn('Supabase fetch error:', dbErr);
    }
  }

  // Combine and deduplicate across server, db, and local
  const mergedMap = new Map<string, LeaderboardEntry>();
  [...serverEntries, ...dbEntries, ...localEntries].forEach((e) => {
    const key = e.id || `${e.user_id || e.user_name}_${e.exam_id}_${e.score}_${e.created_at}`;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, e);
    } else {
      const existing = mergedMap.get(key)!;
      mergedMap.set(key, {
        ...existing,
        user_id: existing.user_id || e.user_id,
        user_avatar: existing.user_avatar || e.user_avatar,
      });
    }
  });

  const mergedList = Array.from(mergedMap.values());

  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(mergedList));
  } catch {}

  if (examId && examId !== 'all') {
    return mergedList.filter((e) => e.exam_id === examId || e.exam_title === examId);
  }

  return mergedList;
}

/**
 * ==========================================
 * COURSES SUPABASE CRUD & PERSISTENCE ENGINE
 * ==========================================
 */

/**
 * Helper to normalize category strings across Bengali and English identifiers
 */
export function normalizeCourseCategory(cat: string | undefined): string {
  if (!cat) return 'general';
  const c = String(cat).trim();
  if (c.includes('আরবি') || c.includes('প্রভাষক') || c.toLowerCase().includes('arabic')) {
    return 'arabic_lecturer';
  }
  if (c.includes('মৌলভী') || c.includes('মৌলভি') || c.toLowerCase().includes('assistant_moulvi') || c.toLowerCase().includes('moulvi')) {
    return 'assistant_moulvi';
  }
  if (c.includes('ইবতেদায়ী') || c.includes('ইবতেদায়ি') || c.includes('কারী') || c.includes('ক্বারী') || c.toLowerCase().includes('ebtedayi') || c.toLowerCase().includes('qari')) {
    return 'ebtedayi';
  }
  if (c.includes('জেনারেল') || c.toLowerCase().includes('general')) {
    return 'general';
  }
  return c;
}

export async function fetchCoursesFromSupabase(): Promise<{ courses: CourseModule[]; isFromSupabase: boolean; error?: string | null }> {
  let cachedCourses: CourseModule[] = [];
  try {
    const raw = localStorage.getItem('tamreen_courses_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedCourses = parsed;
      }
    }
  } catch {}

  if (!supabaseInstance) {
    return {
      courses: cachedCourses,
      isFromSupabase: false,
      error: null,
    };
  }

  try {
    // Select all courses directly from Supabase
    const { data, error } = await supabaseInstance
      .from('courses')
      .select('*');

    if (error) {
      console.warn('Supabase courses query notice:', error.message);
      return {
        courses: cachedCourses,
        isFromSupabase: false,
        error: error.message,
      };
    }

    // When data is returned (even if empty array []), parse and update cache
    const fetchedCourses: CourseModule[] = (data || [])
      .filter((item: any) => item && item.status !== 'archived' && item.status !== 'inactive')
      .map((item: any) => {
        let parsedTopics: string[] = [];
        if (Array.isArray(item.topics)) {
          parsedTopics = item.topics.map(String);
        } else if (typeof item.topics === 'string' && item.topics.trim()) {
          try {
            const p = JSON.parse(item.topics);
            parsedTopics = Array.isArray(p) ? p.map(String) : [String(item.topics)];
          } catch {
            parsedTopics = item.topics.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
          }
        }

        const rawCat = item.category || item.subject || item.course_category || 'general';
        const normalizedCategory = normalizeCourseCategory(rawCat);

        // Detect routine and routine url
        const rawRoutine = item.routine || item.course_routine || item.schedule || item.routine_text || item.class_routine || item.exam_routine || undefined;
        let routineUrl = item.routine_url || item.routine_link || item.routine_file || item.routine_pdf || undefined;
        if (!routineUrl && typeof rawRoutine === 'string' && (rawRoutine.startsWith('http://') || rawRoutine.startsWith('https://'))) {
          routineUrl = rawRoutine;
        }

        // Detect syllabus and syllabus url
        const rawSyllabus = item.syllabus || item.course_syllabus || item.syllabus_text || item.curriculum || item.outline || undefined;
        let syllabusUrl = item.syllabus_url || item.syllabus_link || item.syllabus_file || item.syllabus_pdf || undefined;
        if (!syllabusUrl && typeof rawSyllabus === 'string' && (rawSyllabus.startsWith('http://') || rawSyllabus.startsWith('https://'))) {
          syllabusUrl = rawSyllabus;
        }

        const driveLink = item.drive_link || item.google_drive || item.drive || item.materials_link || undefined;
        const liveClassUrl = item.live_class_url || item.zoom_link || item.meet_link || item.live_link || item.class_link || undefined;
        const whatsappGroup = item.whatsapp_group || item.whatsapp_link || item.whatsapp || item.telegram_group || undefined;

        return {
          id: String(item.id || item.course_id || item.uuid || `course_${Date.now()}`),
          title: String(item.title || item.name || item.course_title || item.course_name || 'কোর্স'),
          subtitle: item.subtitle ? String(item.subtitle) : (item.sub_title ? String(item.sub_title) : undefined),
          description: item.description ? String(item.description) : (item.details ? String(item.details) : (item.about ? String(item.about) : (item.overview ? String(item.overview) : undefined))),
          syllabus: rawSyllabus,
          routine: rawRoutine,
          routineUrl,
          syllabusUrl,
          driveLink,
          liveClassUrl,
          whatsappGroup,
          category: normalizedCategory,
          badge: item.badge ? String(item.badge) : (item.batch ? String(item.batch) : (item.category ? String(item.category) : 'কোর্স')),
          badgeSub: item.badge_sub ? String(item.badge_sub) : (item.batch_sub ? String(item.batch_sub) : undefined),
          classesCount: Number(item.classes_count || item.classesCount || item.total_classes || item.classes || 0),
          sheetsCount: Number(item.sheets_count || item.sheetsCount || item.total_sheets || item.sheets || 0),
          examsCount: Number(item.exams_count || item.examsCount || item.total_exams || item.exams || 0),
          enrolledCount: item.enrolled_count !== undefined && item.enrolled_count !== null ? String(item.enrolled_count) : (item.enrolledCount !== undefined ? String(item.enrolledCount) : (item.students_count ? String(item.students_count) : undefined)),
          price: item.price !== undefined && item.price !== null ? String(item.price) : (item.fee !== undefined ? String(item.fee) : (item.cost !== undefined ? String(item.cost) : '০')),
          accentColor: (item.accent_color || item.accentColor || (normalizedCategory === 'arabic_lecturer' ? 'purple' : normalizedCategory === 'assistant_moulvi' ? 'emerald' : 'amber')) as 'emerald' | 'purple' | 'amber',
          topics: parsedTopics.length > 0 ? parsedTopics : undefined,
          instructor: item.instructor ? String(item.instructor) : (item.teacher ? String(item.teacher) : (item.ustad ? String(item.ustad) : (item.mentor ? String(item.mentor) : undefined))),
          isEnrolled: Boolean(item.is_enrolled || item.isEnrolled),
          isLocked: item.is_locked !== undefined ? Boolean(item.is_locked) : false,
          status: item.status || 'active',
        };
      });

    // Update localStorage cache directly with fresh database state
    try {
      localStorage.setItem('tamreen_courses_cache', JSON.stringify(fetchedCourses));
    } catch {}

    return {
      courses: fetchedCourses,
      isFromSupabase: true,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      courses: cachedCourses,
      isFromSupabase: false,
      error: msg,
    };
  }
}

/**
 * Realtime listener for course database changes
 */
export function subscribeToCoursesTable(onCoursesChange: () => void): () => void {
  if (!supabaseInstance) return () => {};

  try {
    const channel = supabaseInstance
      .channel('courses_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          onCoursesChange();
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export async function addCourseToSupabase(course: Partial<CourseModule>): Promise<{ success: boolean; data?: CourseModule; error?: string }> {
  const newRecord = {
    title: course.title || 'নতুন কোর্স',
    category: course.category || 'general',
    badge: course.badge || 'রেকর্ড ব্যাচ',
    badge_sub: course.badgeSub || course.title,
    classes_count: course.classesCount || 0,
    sheets_count: course.sheetsCount || 0,
    exams_count: course.examsCount || 0,
    enrolled_count: course.enrolledCount || '0',
    price: course.price || '৯৫০',
    accent_color: course.accentColor || 'purple',
    topics: course.topics || [],
    instructor: course.instructor || 'উস্তাদ আহমেদ',
    is_enrolled: Boolean(course.isEnrolled),
    status: 'active',
    created_at: new Date().toISOString(),
  };

  if (!supabaseInstance) {
    const localId = course.id || `course_${Date.now()}`;
    const createdCourse: CourseModule = {
      id: localId,
      ...course,
      title: newRecord.title,
      category: newRecord.category,
      badge: newRecord.badge,
      badgeSub: newRecord.badge_sub,
      classesCount: newRecord.classes_count,
      sheetsCount: newRecord.sheets_count,
      examsCount: newRecord.exams_count,
      enrolledCount: newRecord.enrolled_count,
      price: newRecord.price,
      accentColor: newRecord.accent_color as 'emerald' | 'purple' | 'amber',
      topics: newRecord.topics,
      instructor: newRecord.instructor,
      isEnrolled: newRecord.is_enrolled,
    };
    return { success: true, data: createdCourse };
  }

  try {
    const { data, error } = await supabaseInstance
      .from('courses')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const createdCourse: CourseModule = {
      id: String(data.id),
      title: data.title,
      category: data.category,
      badge: data.badge,
      badgeSub: data.badge_sub,
      classesCount: Number(data.classes_count || 0),
      sheetsCount: Number(data.sheets_count || 0),
      examsCount: Number(data.exams_count || 0),
      enrolledCount: String(data.enrolled_count || '0'),
      price: String(data.price || '৯৫০'),
      accentColor: (data.accent_color || 'purple') as 'emerald' | 'purple' | 'amber',
      topics: Array.isArray(data.topics) ? data.topics : [],
      instructor: data.instructor,
      isEnrolled: Boolean(data.is_enrolled),
    };

    return { success: true, data: createdCourse };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateCourseInSupabase(id: string, updates: Partial<CourseModule>): Promise<{ success: boolean; data?: CourseModule; error?: string }> {
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
  if (updates.badgeSub !== undefined) dbUpdates.badge_sub = updates.badgeSub;
  if (updates.classesCount !== undefined) dbUpdates.classes_count = updates.classesCount;
  if (updates.sheetsCount !== undefined) dbUpdates.sheets_count = updates.sheetsCount;
  if (updates.examsCount !== undefined) dbUpdates.exams_count = updates.examsCount;
  if (updates.enrolledCount !== undefined) dbUpdates.enrolled_count = updates.enrolledCount;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
  if (updates.topics !== undefined) dbUpdates.topics = updates.topics;
  if (updates.instructor !== undefined) dbUpdates.instructor = updates.instructor;
  if (updates.isEnrolled !== undefined) dbUpdates.is_enrolled = updates.isEnrolled;

  if (!supabaseInstance) {
    return { success: true, data: { id, ...updates } as CourseModule };
  }

  try {
    const { data, error } = await supabaseInstance
      .from('courses')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedCourse: CourseModule = {
      id: String(data.id),
      title: data.title,
      category: data.category,
      badge: data.badge,
      badgeSub: data.badge_sub,
      classesCount: Number(data.classes_count || 0),
      sheetsCount: Number(data.sheets_count || 0),
      examsCount: Number(data.exams_count || 0),
      enrolledCount: String(data.enrolled_count || '0'),
      price: String(data.price || '৯৫০'),
      accentColor: (data.accent_color || 'purple') as 'emerald' | 'purple' | 'amber',
      topics: Array.isArray(data.topics) ? data.topics : [],
      instructor: data.instructor,
      isEnrolled: Boolean(data.is_enrolled),
    };

    return { success: true, data: updatedCourse };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteCourseFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = localStorage.getItem('tamreen_courses_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((c: any) => c && String(c.id) !== String(id));
        localStorage.setItem('tamreen_courses_cache', JSON.stringify(filtered));
      }
    }
  } catch {}

  if (!supabaseInstance) {
    return { success: true };
  }

  try {
    const { error } = await supabaseInstance
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// =========================================================
// Course Enrollments & Applications Table Functions
// (public.course_applications & public.course_enrollments)
// =========================================================

export async function submitEnrollmentToSupabase(
  enrollment: CourseEnrollmentRecord
): Promise<{ success: boolean; data?: CourseEnrollmentRecord; error?: string; isLocalFallback?: boolean }> {
  const payload = {
    course_id: String(enrollment.course_id),
    course_title: String(enrollment.course_title),
    student_name: String(enrollment.student_name).trim(),
    phone_number: String(enrollment.phone_number).trim(),
    email: enrollment.email ? String(enrollment.email).trim() : null,
    payment_method: enrollment.payment_method || 'bkash',
    amount: String(enrollment.amount || '৯৫০'),
    transaction_id: String(enrollment.transaction_id || '').trim().toUpperCase(),
    status: enrollment.status || 'pending',
    created_at: enrollment.created_at || new Date().toISOString()
  };

  if (!supabaseInstance) {
    return { success: true, data: { ...payload, id: `local_enr_${Date.now()}` }, isLocalFallback: true };
  }

  try {
    // Primary: insert into course_applications
    const { data: insertedData, error: insertError } = await supabaseInstance
      .from('course_applications')
      .insert([payload])
      .select();

    if (!insertError && insertedData && insertedData.length > 0) {
      return { success: true, data: insertedData[0] as CourseEnrollmentRecord };
    }

    // If .select() failed (e.g. RLS allows INSERT but blocks SELECT), try bare insert without .select()
    if (insertError) {
      console.warn('course_applications insert with select error:', insertError);
      
      const { error: bareError } = await supabaseInstance
        .from('course_applications')
        .insert([payload]);

      if (!bareError) {
        return { success: true, data: { ...payload, id: `app_${Date.now()}` } };
      }

      console.error('course_applications bare insert error:', bareError);

      // Fallback: try course_enrollments table
      const { data: enrData, error: enrError } = await supabaseInstance
        .from('course_enrollments')
        .insert([payload])
        .select();

      if (!enrError && enrData && enrData.length > 0) {
        return { success: true, data: enrData[0] as CourseEnrollmentRecord };
      }

      return {
        success: false,
        error: insertError.message || bareError.message || enrError?.message || 'Database RLS error',
        data: { ...payload, id: `local_enr_${Date.now()}` },
        isLocalFallback: true
      };
    }

    return { success: true, data: { ...payload, id: `app_${Date.now()}` } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg, data: { ...payload, id: `local_enr_${Date.now()}` }, isLocalFallback: true };
  }
}

export async function updateEnrollmentStatusInSupabase(
  id: string,
  newStatus: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseInstance) return { success: true };
  try {
    const { error: err1 } = await supabaseInstance
      .from('course_applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (!err1) return { success: true };

    const { error: err2 } = await supabaseInstance
      .from('course_enrollments')
      .update({ status: newStatus })
      .eq('id', id);

    if (!err2) return { success: true };
    return { success: false, error: err1.message || err2.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteEnrollmentFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseInstance) return { success: true };
  try {
    await supabaseInstance.from('course_applications').delete().eq('id', id);
    await supabaseInstance.from('course_enrollments').delete().eq('id', id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function fetchCourseApplicationsFromSupabase(
  phoneNumber?: string
): Promise<{ applications: CourseEnrollmentRecord[]; error?: string | null }> {
  let cached: CourseEnrollmentRecord[] = [];
  try {
    const raw = localStorage.getItem('tamreen_enrollments');
    if (raw) cached = JSON.parse(raw);
  } catch {}

  if (!supabaseInstance) {
    return { applications: cached, error: null };
  }

  try {
    // First attempt: query 'course_applications'
    let query = supabaseInstance
      .from('course_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (phoneNumber) {
      query = query.eq('phone_number', phoneNumber);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const records = data as CourseEnrollmentRecord[];
      try {
        localStorage.setItem('tamreen_enrollments', JSON.stringify(records));
      } catch {}
      return { applications: records, error: null };
    }

    // Second attempt: query 'course_enrollments'
    let fallbackQuery = supabaseInstance
      .from('course_enrollments')
      .select('*')
      .order('created_at', { ascending: false });

    if (phoneNumber) {
      fallbackQuery = fallbackQuery.eq('phone_number', phoneNumber);
    }

    const fallbackRes = await fallbackQuery;
    if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
      const records = fallbackRes.data as CourseEnrollmentRecord[];
      try {
        localStorage.setItem('tamreen_enrollments', JSON.stringify(records));
      } catch {}
      return { applications: records, error: null };
    }

    return { applications: cached, error: error?.message || fallbackRes.error?.message || null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { applications: cached, error: msg };
  }
}

export async function fetchEnrollmentsFromSupabase(
  phoneNumber?: string
): Promise<{ enrollments: CourseEnrollmentRecord[]; error?: string | null }> {
  const res = await fetchCourseApplicationsFromSupabase(phoneNumber);
  return { enrollments: res.applications, error: res.error };
}

// =========================================================
// Course Sheets & Course Exams Functions (public.course_sheets, public.course_exams)
// =========================================================

export async function fetchCourseSheetsFromSupabase(
  courseId: string,
  courseTitle?: string
): Promise<{ sheets: CourseSheet[]; error?: string | null }> {
  if (!supabaseInstance) {
    return { sheets: [], error: null };
  }

  try {
    const targetId = String(courseId || '').trim().toLowerCase();
    const targetTitle = String(courseTitle || '').trim().toLowerCase();

    // Query course_sheets safely without strict .or() that fails on non-existent columns
    const { data, error } = await supabaseInstance
      .from('course_sheets')
      .select('*');

    if (error || !data) {
      return { sheets: [], error: error?.message || null };
    }

    const sheets: CourseSheet[] = data
      .filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || item.course_uuid || '').trim().toLowerCase();
        const itemTitle = String(item.course_title || item.courseName || item.course || '').trim().toLowerCase();
        const itemSubject = String(item.subject || '').trim().toLowerCase();

        // 1. Direct course ID match
        if (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) {
          return true;
        }
        // 2. Title match
        if (itemTitle && targetTitle && (itemTitle === targetTitle || targetTitle.includes(itemTitle) || itemTitle.includes(targetTitle))) {
          return true;
        }
        // 3. Subject match
        if (itemSubject && targetTitle && (itemSubject === targetTitle || targetTitle.includes(itemSubject) || itemSubject.includes(targetTitle))) {
          return true;
        }
        // 4. If itemCourseId stored course title
        if (itemCourseId && targetTitle && (itemCourseId === targetTitle || targetTitle.includes(itemCourseId) || itemCourseId.includes(targetTitle))) {
          return true;
        }
        return false;
      })
      .map((item: any, idx: number) => ({
        id: String(item.id || `sheet_${idx + 1}`),
        course_id: item.course_id ? String(item.course_id) : courseId,
        title: String(item.title || item.name || item.sheet_title || `লেকচার শিট ${idx + 1}`),
        name: String(item.name || item.title || item.sheet_title || `লেকচার শিট.pdf`),
        file_url: item.file_url || item.url || item.pdf_url || item.link || undefined,
        size: item.size || 'PDF Sheet',
        created_at: item.created_at
      }));

    return { sheets, error: null };
  } catch (err: unknown) {
    return { sheets: [], error: null };
  }
}

export async function fetchCourseExamsFromSupabase(
  courseId: string,
  courseTitle?: string
): Promise<{ exams: CourseExam[]; error?: string | null }> {
  if (!supabaseInstance) {
    return { exams: [], error: null };
  }

  try {
    const targetId = String(courseId || '').trim().toLowerCase();
    const targetTitle = String(courseTitle || '').trim().toLowerCase();

    // 1. First fetch all course_exams safely without column-specific PostgREST filters
    const { data: courseExamsData, error: courseExamsError } = await supabaseInstance
      .from('course_exams')
      .select('*');

    if (!courseExamsError && courseExamsData && courseExamsData.length > 0) {
      const matchedExams = courseExamsData.filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || item.course_uuid || '').trim().toLowerCase();
        const itemCourseTitle = String(item.course_title || item.courseName || item.course || '').trim().toLowerCase();
        const itemSubject = String(item.subject || '').trim().toLowerCase();

        // 1. Exact ID / UUID match (e.g. 49e2-86ea-71...)
        if (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) {
          return true;
        }
        // 2. Title match
        if (itemCourseTitle && targetTitle && (itemCourseTitle === targetTitle || targetTitle.includes(itemCourseTitle) || itemCourseTitle.includes(targetTitle))) {
          return true;
        }
        // 3. Subject match
        if (itemSubject && targetTitle && (itemSubject === targetTitle || targetTitle.includes(itemSubject) || itemSubject.includes(targetTitle))) {
          return true;
        }
        // 4. Course title stored in course_id
        if (itemCourseId && targetTitle && (itemCourseId === targetTitle || targetTitle.includes(itemCourseId) || itemCourseId.includes(targetTitle))) {
          return true;
        }
        return false;
      });

      if (matchedExams.length > 0) {
        const exams: CourseExam[] = matchedExams.map((item: any, idx: number) => ({
          id: String(item.id || `exam_${idx + 1}`),
          course_id: String(item.course_id || courseId),
          title: String(item.title || item.name || item.exam_title || `পরীক্ষা -০${idx + 1}`),
          topic: item.topic || item.subject || item.chapter || 'মডেল টেস্ট',
          date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('bn-BD') : undefined),
          specs: item.specs || (item.total_questions || item.question_count ? `${item.total_questions || item.question_count}টি প্রশ্ন • ${item.time_minutes || 30} মিনিট` : undefined),
          question_count: Number(item.total_questions || item.question_count || 50),
          time_minutes: Number(item.time_minutes || item.duration || 30),
          created_at: item.created_at
        }));
        return { exams, error: null };
      }
    }

    // 2. Fallback check on 'exams' table for course_id === courseId
    const { data: generalExamsData, error: generalExamsError } = await supabaseInstance
      .from('exams')
      .select('*');

    if (!generalExamsError && generalExamsData && generalExamsData.length > 0) {
      const matchedGeneral = generalExamsData.filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || '').trim().toLowerCase();
        const itemSubject = String(item.subject || item.category || '').trim().toLowerCase();
        if (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) {
          return true;
        }
        if (itemSubject && targetTitle && (itemSubject === targetTitle || targetTitle.includes(itemSubject))) {
          return true;
        }
        return false;
      });

      if (matchedGeneral.length > 0) {
        const exams: CourseExam[] = matchedGeneral.map((item: any, idx: number) => ({
          id: String(item.id || `gen_exam_${idx + 1}`),
          course_id: String(item.course_id || courseId),
          title: String(item.title || item.name || `পরীক্ষা -০${idx + 1}`),
          topic: item.topic || item.subject || item.category || 'মডেল টেস্ট',
          date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('bn-BD') : undefined),
          specs: item.specs || (item.total_questions || item.question_count ? `${item.total_questions || item.question_count}টি প্রশ্ন • ${item.time_minutes || 30} মিনিট` : undefined),
          question_count: Number(item.total_questions || item.question_count || 50),
          time_minutes: Number(item.time_minutes || 30),
          created_at: item.created_at
        }));
        return { exams, error: null };
      }
    }

    return { exams: [], error: null };
  } catch (err: unknown) {
    return { exams: [], error: null };
  }
}

/**
 * Fetch course routines from dedicated table if available (course_routines / routines)
 */
export async function fetchCourseRoutinesFromSupabase(
  courseId: string,
  courseTitle?: string
): Promise<{ routines: CourseRoutineItem[]; error?: string | null }> {
  if (!supabaseInstance) {
    return { routines: [], error: null };
  }

  try {
    const targetId = String(courseId || '').trim().toLowerCase();
    const targetTitle = String(courseTitle || '').trim().toLowerCase();

    // 1. Try course_routines
    const { data: routineData, error: routineError } = await supabaseInstance
      .from('course_routines')
      .select('*');

    if (!routineError && routineData && routineData.length > 0) {
      const matched = routineData.filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || '').trim().toLowerCase();
        const itemTitle = String(item.course_title || item.courseName || item.subject || '').trim().toLowerCase();
        return (
          (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) ||
          (itemTitle && targetTitle && (itemTitle === targetTitle || targetTitle.includes(itemTitle) || itemTitle.includes(targetTitle))) ||
          (itemCourseId && targetTitle && (itemCourseId === targetTitle || targetTitle.includes(itemCourseId)))
        );
      });

      if (matched.length > 0) {
        return {
          routines: matched.map((r: any, idx: number) => ({
            id: String(r.id || `routine_${idx + 1}`),
            course_id: String(r.course_id || courseId),
            day: r.day || r.date || r.schedule_day,
            time: r.time || r.schedule_time || r.class_time,
            subject: r.subject || r.course_title || r.title,
            topic: r.topic || r.chapter || r.lesson,
            instructor: r.instructor || r.teacher || r.ustad,
            room_or_link: r.room_or_link || r.live_link || r.link,
            notes: r.notes || r.description
          })),
          error: null
        };
      }
    }

    // 2. Try routines table
    const { data: generalRoutines, error: generalError } = await supabaseInstance
      .from('routines')
      .select('*');

    if (!generalError && generalRoutines && generalRoutines.length > 0) {
      const matched = generalRoutines.filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || '').trim().toLowerCase();
        const itemTitle = String(item.course_title || item.subject || item.title || '').trim().toLowerCase();
        return (
          (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) ||
          (itemTitle && targetTitle && (itemTitle === targetTitle || targetTitle.includes(itemTitle)))
        );
      });

      if (matched.length > 0) {
        return {
          routines: matched.map((r: any, idx: number) => ({
            id: String(r.id || `routine_${idx + 1}`),
            course_id: String(r.course_id || courseId),
            day: r.day || r.date,
            time: r.time || r.class_time,
            subject: r.subject || r.title,
            topic: r.topic || r.lesson,
            instructor: r.instructor || r.teacher,
            room_or_link: r.link || r.live_link,
            notes: r.notes || r.description
          })),
          error: null
        };
      }
    }

    return { routines: [], error: null };
  } catch {
    return { routines: [], error: null };
  }
}

/**
 * Fetch course syllabus from dedicated table if available (course_syllabus / syllabuses)
 */
export async function fetchCourseSyllabusFromSupabase(
  courseId: string,
  courseTitle?: string
): Promise<{ syllabusList: CourseSyllabusItem[]; error?: string | null }> {
  if (!supabaseInstance) {
    return { syllabusList: [], error: null };
  }

  try {
    const targetId = String(courseId || '').trim().toLowerCase();
    const targetTitle = String(courseTitle || '').trim().toLowerCase();

    // 1. Try course_syllabus table
    const { data, error } = await supabaseInstance
      .from('course_syllabus')
      .select('*');

    if (!error && data && data.length > 0) {
      const matched = data.filter((item: any) => {
        if (!item) return false;
        const itemCourseId = String(item.course_id || item.courseId || '').trim().toLowerCase();
        const itemTitle = String(item.course_title || item.subject || item.courseName || '').trim().toLowerCase();
        return (
          (itemCourseId && (itemCourseId === targetId || targetId.includes(itemCourseId) || itemCourseId.includes(targetId))) ||
          (itemTitle && targetTitle && (itemTitle === targetTitle || targetTitle.includes(itemTitle) || itemTitle.includes(targetTitle))) ||
          (itemCourseId && targetTitle && (itemCourseId === targetTitle || targetTitle.includes(itemCourseId)))
        );
      });

      if (matched.length > 0) {
        return {
          syllabusList: matched.map((s: any, idx: number) => ({
            id: String(s.id || `syl_${idx + 1}`),
            course_id: String(s.course_id || courseId),
            chapter: s.chapter || s.module || s.part || `অধ্যায় - ০${idx + 1}`,
            subject: s.subject || s.title,
            topic: s.topic || s.title || s.name,
            details: s.details || s.description || s.summary,
            classes_count: Number(s.classes_count || s.total_classes || 0)
          })),
          error: null
        };
      }
    }

    return { syllabusList: [], error: null };
  } catch {
    return { syllabusList: [], error: null };
  }
}

/**
 * Realtime listener for course-specific updates (exams, sheets, courses, routines, syllabus)
 */
export function subscribeToCourseDetails(onChange: () => void): () => void {
  if (!supabaseInstance) return () => {};

  try {
    const channel = supabaseInstance
      .channel('course_details_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_exams' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_sheets' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_routines' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_syllabus' },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}





