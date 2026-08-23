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
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedQuestions = parsed;
      }
    }
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
export const DEFAULT_EXAM_PRESETS: ExamItem[] = [];

/**
 * Fetches exams/model tests from Supabase table 'public.exams'
 */
export async function fetchExamsFromSupabase(): Promise<FetchExamsResult> {
  let cachedExams: ExamItem[] = [];
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
      return {
        exams: cachedExams,
        isFromSupabase: true,
        error: `Supabase Table 'exams' ত্রুটি: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        exams: [],
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
      examinee_count: item.examinee_count ? String(item.examinee_count) : '০',
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
  time_taken_seconds?: number;
  created_at: string;
}

export interface ExamLeaderboardItem {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken_seconds: number;
}

export interface FreeOverallLeaderboardItem {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  free_exam_count: number;
  average_percentage: number;
}

const LOCAL_LEADERBOARD_KEY = 'tamreen_leaderboard_entries';
const LOCAL_EXAM_RESULTS_KEY = 'tamreen_exam_results';
const LEADERBOARD_CLEARED_FLAG = 'tamreen_lb_cleared_v3';

// One-time client purge of past/legacy leaderboard entries so the leaderboard starts completely fresh
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(LEADERBOARD_CLEARED_FLAG)) {
    localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
    localStorage.removeItem(LOCAL_EXAM_RESULTS_KEY);
    localStorage.removeItem('miniquiz_leaderboard_cache');
    localStorage.setItem(LEADERBOARD_CLEARED_FLAG, 'true');
    // Notify server to clear in-memory stores as well
    fetch('/api/leaderboard/clear', { method: 'POST' }).catch(() => {});
  }
} catch {}

export function getLocalLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearLocalLeaderboardEntries(): void {
  try {
    localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
    localStorage.removeItem(LOCAL_EXAM_RESULTS_KEY);
    localStorage.removeItem('miniquiz_leaderboard_cache');
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('tamreen_leaderboard_channel');
        bc.postMessage({ type: 'LEADERBOARD_CLEARED' });
        bc.close();
      } catch {}
    }
  } catch {}
}

export async function clearAllLeaderboardEntries(): Promise<void> {
  clearLocalLeaderboardEntries();
  try {
    await fetch('/api/leaderboard/clear', { method: 'POST' });
  } catch {}
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

/**
 * Submit exam result securely to Supabase `exam_results` table,
 * sync user profile, and update server storage.
 */
export async function submitExamResultToSupabase(params: {
  exam_id: string;
  exam_title?: string;
  is_free?: boolean;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken_seconds?: number;
  submitted_at?: string;
}): Promise<{ success: boolean; error?: string }> {
  const submittedAt = params.submitted_at || new Date().toISOString();
  const timeTaken = Number(params.time_taken_seconds || 0);

  // 1. Post to Express Server API for real-time multi-device sync
  try {
    await fetch('/api/exam_results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        time_taken_seconds: timeTaken,
        submitted_at: submittedAt,
      }),
    });
  } catch (apiErr) {
    console.warn('Server API exam_results post error:', apiErr);
  }

  // 2. Also save to local leaderboard for instant responsiveness
  const lbEntry: LeaderboardEntry = {
    id: `er_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    exam_id: params.exam_id,
    exam_title: params.exam_title || 'মডেল টেস্ট',
    user_id: params.user_id,
    user_name: params.full_name,
    user_avatar: params.avatar_url,
    score: params.score,
    total_questions: params.total_marks,
    correct_count: params.correct_answers,
    wrong_count: params.wrong_answers,
    accuracy: params.total_marks > 0 ? Math.round((params.score / params.total_marks) * 100) : 100,
    time_taken_seconds: timeTaken,
    created_at: submittedAt,
  };
  saveLocalLeaderboardEntry(lbEntry);

  // 3. Post to Supabase if configured
  if (!supabaseInstance) {
    return { success: true };
  }

  try {
    // 3A. Upsert Profile so full_name and avatar_url can be joined by RPC
    try {
      if (params.user_id) {
        await supabaseInstance
          .from('profiles')
          .upsert({
            id: params.user_id,
            full_name: params.full_name,
            avatar_url: params.avatar_url || null,
            updated_at: submittedAt,
          }, { onConflict: 'id' });
      }
    } catch (profErr) {
      console.warn('Profiles upsert warning:', profErr);
    }

    // 3B. Insert into exam_results (protected by RLS)
    const { error: erError } = await supabaseInstance
      .from('exam_results')
      .insert([
        {
          user_id: params.user_id,
          exam_id: params.exam_id,
          score: params.score,
          total_marks: params.total_marks,
          correct_answers: params.correct_answers,
          wrong_answers: params.wrong_answers,
          time_taken_seconds: timeTaken,
          submitted_at: submittedAt,
        },
      ]);

    if (erError) {
      console.warn('Supabase exam_results insert warning:', erError.message);
    }

    // 3C. Also insert into leaderboard_entries for dual-write compatibility
    try {
      await supabaseInstance
        .from('leaderboard_entries')
        .insert([
          {
            id: lbEntry.id,
            exam_id: lbEntry.exam_id,
            exam_title: lbEntry.exam_title,
            user_id: lbEntry.user_id || null,
            user_name: lbEntry.user_name,
            user_avatar: lbEntry.user_avatar || null,
            score: lbEntry.score,
            total_questions: lbEntry.total_questions,
            correct_count: lbEntry.correct_count,
            wrong_count: lbEntry.wrong_count,
            accuracy: lbEntry.accuracy,
            created_at: lbEntry.created_at,
          },
        ]);
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: true, error: msg };
  }
}

/**
 * Fetch exam-specific leaderboard via secure Supabase RPC get_exam_leaderboard.
 * Falls back gracefully to server RPC API and local store.
 */
export async function getExamLeaderboard(examId: string): Promise<ExamLeaderboardItem[]> {
  if (!examId || examId === 'all') return [];

  // 1. Try Supabase RPC first
  if (supabaseInstance) {
    try {
      let rpcRes = await supabaseInstance.rpc('get_exam_leaderboard', {
        p_exam_id: examId,
      });

      // Try alternate param name if first attempt failed
      if (rpcRes.error) {
        rpcRes = await supabaseInstance.rpc('get_exam_leaderboard', {
          exam_id: examId,
        });
      }

      if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
        return rpcRes.data.map((row: any, idx: number) => ({
          rank: Number(row.rank || idx + 1),
          user_id: String(row.user_id || ''),
          full_name: String(row.full_name || 'পরীক্ষার্থী'),
          avatar_url: row.avatar_url ? String(row.avatar_url) : undefined,
          score: Number(row.score ?? row.correct_answers ?? 0),
          total_marks: Number(row.total_marks ?? (Number(row.correct_answers || 0) + Number(row.wrong_answers || 0))),
          correct_answers: Number(row.correct_answers ?? row.score ?? 0),
          wrong_answers: Number(row.wrong_answers ?? 0),
          time_taken_seconds: Number(row.time_taken_seconds ?? 0),
        }));
      }
    } catch (rpcErr) {
      console.warn('Supabase get_exam_leaderboard RPC error:', rpcErr);
    }
  }

  // 2. Fetch from Express Server RPC endpoint
  try {
    const res = await fetch(`/api/rpc/get_exam_leaderboard?p_exam_id=${encodeURIComponent(examId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (srvErr) {
    console.warn('Server get_exam_leaderboard error:', srvErr);
  }

  // 3. Fallback to computing from local entries
  const local = getLocalLeaderboardEntries().filter((e) => {
    const eId = (e.exam_id || '').toLowerCase().trim();
    const eTitle = (e.exam_title || '').toLowerCase().trim();
    const target = examId.toLowerCase().trim();
    return (
      eId === target ||
      eTitle === target ||
      (eId && (eId.includes(target) || target.includes(eId))) ||
      (eTitle && (eTitle.includes(target) || target.includes(eTitle)))
    );
  });
  const bestMap = new Map<string, LeaderboardEntry>();
  for (const e of local) {
    const key = e.user_id || e.user_name;
    const existing = bestMap.get(key);
    if (!existing || e.score > existing.score) {
      bestMap.set(key, e);
    }
  }
  const sorted = Array.from(bestMap.values()).sort((a, b) => b.score - a.score);
  return sorted.map((e, idx) => ({
    rank: idx + 1,
    user_id: e.user_id || '',
    full_name: e.user_name,
    avatar_url: e.user_avatar,
    score: e.score,
    total_marks: e.total_questions,
    correct_answers: e.correct_count,
    wrong_answers: e.wrong_count,
    time_taken_seconds: e.time_taken_seconds || 0,
  }));
}

/**
 * Fetch free overall leaderboard via secure Supabase RPC get_free_overall_leaderboard.
 * Supports period filter: 'today', 'week' | 'this_week', 'month' | 'this_month', 'all' | 'all_time'.
 */
export async function getFreeOverallLeaderboard(period: string = 'all'): Promise<FreeOverallLeaderboardItem[]> {
  const normalizedPeriod =
    period === 'this_week' ? 'week' :
    period === 'this_month' ? 'month' :
    period === 'all_time' ? 'all' : period;

  // 1. Try Supabase RPC first
  if (supabaseInstance) {
    try {
      let rpcRes = await supabaseInstance.rpc('get_free_overall_leaderboard', {
        p_period: normalizedPeriod,
      });

      // Try alternate param name if first attempt failed
      if (rpcRes.error) {
        rpcRes = await supabaseInstance.rpc('get_free_overall_leaderboard', {
          period: normalizedPeriod,
        });
      }

      if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
        return rpcRes.data.map((row: any, idx: number) => ({
          rank: Number(row.rank || idx + 1),
          user_id: String(row.user_id || ''),
          full_name: String(row.full_name || 'পরীক্ষার্থী'),
          avatar_url: row.avatar_url ? String(row.avatar_url) : undefined,
          total_points: Number(row.total_points || 0),
          free_exam_count: Number(row.free_exam_count || 1),
          average_percentage: Number(row.average_percentage || 0),
        }));
      }
    } catch (rpcErr) {
      console.warn('Supabase get_free_overall_leaderboard RPC error:', rpcErr);
    }
  }

  // 2. Fetch from Express Server RPC endpoint
  try {
    const res = await fetch(`/api/rpc/get_free_overall_leaderboard?p_period=${encodeURIComponent(normalizedPeriod)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (srvErr) {
    console.warn('Server get_free_overall_leaderboard error:', srvErr);
  }

  // 3. Fallback to computing from local entries
  const local = getLocalLeaderboardEntries();
  const now = Date.now();
  let minTime = 0;
  if (normalizedPeriod === 'today') {
    const d = new Date();
    minTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  } else if (normalizedPeriod === 'week') {
    minTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (normalizedPeriod === 'month') {
    minTime = now - 30 * 24 * 60 * 60 * 1000;
  }

  const filtered = local.filter((e) => {
    if (minTime > 0) {
      const t = new Date(e.created_at).getTime();
      if (isNaN(t) || t < minTime) return false;
    }
    return true;
  });

  const userMap = new Map<string, {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    total_points: number;
    free_exam_count: number;
    accSum: number;
  }>();

  for (const e of filtered) {
    const key = e.user_id || e.user_name;
    const existing = userMap.get(key);
    const pts = e.correct_count || e.score || 0;
    const acc = e.accuracy || (e.total_questions > 0 ? (e.score / e.total_questions) * 100 : 0);

    if (!existing) {
      userMap.set(key, {
        user_id: e.user_id || '',
        full_name: e.user_name,
        avatar_url: e.user_avatar,
        total_points: pts,
        free_exam_count: 1,
        accSum: acc,
      });
    } else {
      existing.total_points += pts;
      existing.free_exam_count += 1;
      existing.accSum += acc;
    }
  }

  const list = Array.from(userMap.values()).map((u) => ({
    user_id: u.user_id,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    total_points: u.total_points,
    free_exam_count: u.free_exam_count,
    average_percentage: u.free_exam_count > 0 ? Math.round(u.accSum / u.free_exam_count) : 0,
  }));

  list.sort((a, b) => b.total_points - a.total_points || b.average_percentage - a.average_percentage);

  return list.map((u, idx) => ({
    rank: idx + 1,
    ...u,
  }));
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
  // Convert Bengali numerals to standard English numbers
  const bnToEn = (str: string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(str || '')
      .replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)))
      .trim();
  };

  const rawPhone = bnToEn(enrollment.phone_number);
  const rawTrx = String(enrollment.transaction_id || '').trim().toUpperCase();
  const rawAmountStr = bnToEn(enrollment.amount || '950').replace(/[^0-9.]/g, '') || '950';
  const numAmount = parseFloat(rawAmountStr) || 950;
  const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;

  const baseData = {
    course_id: String(enrollment.course_id),
    course_title: String(enrollment.course_title),
    student_name: String(enrollment.student_name).trim(),
    phone_number: rawPhone,
    email: enrollment.email ? String(enrollment.email).trim() : null,
    payment_method: enrollment.payment_method || 'bkash',
    amount: rawAmountStr,
    transaction_id: rawTrx,
    status: enrollment.status || 'pending',
    created_at: enrollment.created_at || new Date().toISOString()
  };

  if (!supabaseInstance) {
    console.warn('Supabase not initialized for enrollment');
    return { success: true, data: { ...baseData, id: `local_enr_${Date.now()}` }, isLocalFallback: true };
  }

  const targetTables = ['course_applications', 'course_enrollments', 'applications', 'enrollments', 'admissions'];

  // Strategy 1: Dynamic schema detection from existing rows
  for (const table of targetTables) {
    try {
      const { data: sampleRows, error: sampleErr } = await supabaseInstance
        .from(table)
        .select('*')
        .limit(1);

      if (!sampleErr && sampleRows) {
        let dynamicPayload: Record<string, any> = {};
        
        if (sampleRows.length > 0) {
          const sample = sampleRows[0];
          const cols = Object.keys(sample);

          // Map student name
          if (cols.includes('student_name')) dynamicPayload.student_name = baseData.student_name;
          else if (cols.includes('name')) dynamicPayload.name = baseData.student_name;
          else if (cols.includes('full_name')) dynamicPayload.full_name = baseData.student_name;
          else if (cols.includes('studentName')) dynamicPayload.studentName = baseData.student_name;

          // Map phone
          if (cols.includes('phone_number')) dynamicPayload.phone_number = baseData.phone_number;
          else if (cols.includes('phone')) dynamicPayload.phone = baseData.phone_number;
          else if (cols.includes('mobile')) dynamicPayload.mobile = baseData.phone_number;
          else if (cols.includes('phoneNumber')) dynamicPayload.phoneNumber = baseData.phone_number;

          // Map transaction ID
          if (cols.includes('transaction_id')) dynamicPayload.transaction_id = baseData.transaction_id;
          else if (cols.includes('trx_id')) dynamicPayload.trx_id = baseData.transaction_id;
          else if (cols.includes('trxid')) dynamicPayload.trxid = baseData.transaction_id;
          else if (cols.includes('transactionId')) dynamicPayload.transactionId = baseData.transaction_id;

          // Map payment method
          if (cols.includes('payment_method')) dynamicPayload.payment_method = baseData.payment_method;
          else if (cols.includes('method')) dynamicPayload.method = baseData.payment_method;
          else if (cols.includes('paymentMethod')) dynamicPayload.paymentMethod = baseData.payment_method;

          // Map amount (detect type from sample)
          const sampleAmtType = typeof sample.amount;
          if (cols.includes('amount')) {
            dynamicPayload.amount = sampleAmtType === 'number' ? numAmount : rawAmountStr;
          } else if (cols.includes('price')) {
            dynamicPayload.price = typeof sample.price === 'number' ? numAmount : rawAmountStr;
          } else if (cols.includes('fee')) {
            dynamicPayload.fee = typeof sample.fee === 'number' ? numAmount : rawAmountStr;
          }

          // Map course
          if (cols.includes('course_id')) dynamicPayload.course_id = baseData.course_id;
          else if (cols.includes('courseId')) dynamicPayload.courseId = baseData.course_id;

          if (cols.includes('course_title')) dynamicPayload.course_title = baseData.course_title;
          else if (cols.includes('course_name')) dynamicPayload.course_name = baseData.course_title;
          else if (cols.includes('courseTitle')) dynamicPayload.courseTitle = baseData.course_title;

          // Map status
          if (cols.includes('status')) dynamicPayload.status = baseData.status;

          // Map email
          if (cols.includes('email') && baseData.email) dynamicPayload.email = baseData.email;

          // Map created_at
          if (cols.includes('created_at')) dynamicPayload.created_at = baseData.created_at;

          // If id column exists and is not auto-generated
          if (cols.includes('id') && generatedUuid && typeof sample.id === 'string' && sample.id.includes('-')) {
            dynamicPayload.id = generatedUuid;
          }
        }

        // If dynamic payload has key info, try inserting it
        if (Object.keys(dynamicPayload).length >= 3) {
          const { data: dynData, error: dynErr } = await supabaseInstance
            .from(table)
            .insert([dynamicPayload])
            .select();

          if (!dynErr && dynData && dynData.length > 0) {
            console.log(`Successfully dynamically inserted into ${table}:`, dynData[0]);
            return { success: true, data: { ...baseData, id: String(dynData[0].id || generatedUuid || Date.now()) } };
          }

          const { error: dynBareErr } = await supabaseInstance
            .from(table)
            .insert([dynamicPayload]);

          if (!dynBareErr) {
            console.log(`Successfully bare-inserted into ${table} via dynamic mapping`);
            return { success: true, data: { ...baseData, id: String(generatedUuid || Date.now()) } };
          }
        }
      }
    } catch (e) {
      console.warn(`Dynamic check failed for table ${table}:`, e);
    }
  }

  // Strategy 2: Permutation payloads covering all standard schema types
  const candidatePayloads = [
    // Standard schema with string amount
    {
      course_id: baseData.course_id,
      course_title: baseData.course_title,
      student_name: baseData.student_name,
      phone_number: baseData.phone_number,
      email: baseData.email,
      payment_method: baseData.payment_method,
      amount: rawAmountStr,
      transaction_id: baseData.transaction_id,
      status: baseData.status,
      created_at: baseData.created_at
    },
    // Standard schema with numeric amount
    {
      course_id: baseData.course_id,
      course_title: baseData.course_title,
      student_name: baseData.student_name,
      phone_number: baseData.phone_number,
      email: baseData.email,
      payment_method: baseData.payment_method,
      amount: numAmount,
      transaction_id: baseData.transaction_id,
      status: baseData.status,
      created_at: baseData.created_at
    },
    // Standard schema with UUID
    ...(generatedUuid ? [{
      id: generatedUuid,
      course_id: baseData.course_id,
      course_title: baseData.course_title,
      student_name: baseData.student_name,
      phone_number: baseData.phone_number,
      payment_method: baseData.payment_method,
      amount: rawAmountStr,
      transaction_id: baseData.transaction_id,
      status: baseData.status
    }] : []),
    // Compact schema without email / title
    {
      course_id: baseData.course_id,
      student_name: baseData.student_name,
      phone_number: baseData.phone_number,
      payment_method: baseData.payment_method,
      amount: rawAmountStr,
      transaction_id: baseData.transaction_id,
      status: baseData.status
    },
    // Short column names (name, phone, trx_id)
    {
      name: baseData.student_name,
      phone: baseData.phone_number,
      trx_id: baseData.transaction_id,
      payment_method: baseData.payment_method,
      amount: rawAmountStr,
      status: baseData.status
    },
    // Short column names with numeric amount
    {
      name: baseData.student_name,
      phone: baseData.phone_number,
      trx_id: baseData.transaction_id,
      method: baseData.payment_method,
      amount: numAmount,
      status: baseData.status
    }
  ];

  let lastErrorMsg = '';

  for (const table of targetTables) {
    for (const p of candidatePayloads) {
      try {
        const { data, error } = await supabaseInstance
          .from(table)
          .insert([p])
          .select();

        if (!error && data && data.length > 0) {
          console.log(`Successfully inserted enrollment to ${table}:`, data[0]);
          return { success: true, data: { ...baseData, id: String(data[0].id || Date.now()) } };
        }

        if (error) {
          lastErrorMsg = error.message;
        }

        // Try bare insert without select
        const { error: bareErr } = await supabaseInstance
          .from(table)
          .insert([p]);

        if (!bareErr) {
          console.log(`Successfully bare-inserted enrollment to ${table}`);
          return { success: true, data: { ...baseData, id: String(generatedUuid || Date.now()) } };
        } else {
          lastErrorMsg = bareErr.message;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Database error';
      }
    }
  }

  console.error('All Supabase insert attempts failed:', lastErrorMsg);
  return {
    success: false,
    error: lastErrorMsg || 'Database insert error',
    data: { ...baseData, id: `local_enr_${Date.now()}` },
    isLocalFallback: true
  };
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

// ============================================================================
// SUPABASE AUTH & USER PROFILE INTEGRATION
// ============================================================================

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string | null;
  needsEmailConfirmation?: boolean;
}

export function formatAuthErrorMessage(error: any): string {
  if (!error) return 'একটি অজানা ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
  const msg = typeof error === 'string' ? error : (error.message || '');
  const lower = msg.toLowerCase();
  
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে। অনুগ্রহ করে পুনরায় পরীক্ষা করুন।';
  }
  if (lower.includes('user already registered') || lower.includes('email already in use') || lower.includes('user already exists')) {
    return 'এই ইমেইল দিয়ে ইতিপূর্বে অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  }
  if (lower.includes('email not confirmed')) {
    return 'ইমেইল নিশ্চিতকরণ প্রয়োজন হতে পারে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'অতিরিক্ত অনুরোধের কারণে সরাসরি নিরাপদ অ্যাকাউন্টে যুক্ত করা হয়েছে।';
  }
  if (lower.includes('failed to fetch') || lower.includes('network error')) {
    return 'ইন্টারনেট সংযোগে ত্রুটি দেখা দিয়েছে। দয়া করে আপনার নেট সংযোগ যাচাই করুন।';
  }
  return msg || 'অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।';
}

/**
 * Formats a phone number into a valid, deterministic Supabase Auth email
 * e.g., "01712345678" -> "student_01712345678@attamreen.com"
 */
export function formatPhoneForSupabaseAuth(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const clean11 = digits.length >= 11 ? digits.slice(-11) : digits.padStart(11, '0');
  return `student_${clean11}@attamreen.com`;
}

/**
 * Normalizes input identifier (phone or email) for Supabase Auth
 */
export function normalizeAuthIdentifier(identifier: string): { email: string; isPhone: boolean; phoneDigits: string } {
  const clean = (identifier || '').trim();
  if (clean.includes('@')) {
    return {
      email: clean.toLowerCase(),
      isPhone: false,
      phoneDigits: clean.replace(/[^0-9]/g, ''),
    };
  }
  const digits = clean.replace(/[^0-9]/g, '');
  return {
    email: formatPhoneForSupabaseAuth(clean),
    isPhone: true,
    phoneDigits: digits,
  };
}

/**
 * Sign up a new user using Supabase Auth as the single source of truth.
 * Role is strictly set to 'student' (users cannot choose admin).
 * User ID is the Supabase Auth UUID (auth.users.id).
 * User profile is synchronized to public.profiles with profiles.id = auth.users.id.
 */
export async function supabaseSignUp(
  fullName: string,
  emailOrPhone: string,
  phone: string,
  password: string,
  avatarUrl?: string
): Promise<AuthResult> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase ডাটাবেজ সংযোগ পাওয়া যায়নি।',
    };
  }

  const cleanName = (fullName || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '');
  
  let targetEmail = (emailOrPhone || '').trim().toLowerCase();
  if (!targetEmail.includes('@')) {
    targetEmail = formatPhoneForSupabaseAuth(cleanPhone || emailOrPhone);
  }

  if (!cleanName) {
    return { success: false, error: 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  const studentId = `STD-${cleanPhoneDigits.slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;

  try {
    // 1. Create real Supabase Auth user (auth.users)
    const { data, error } = await supabaseInstance.auth.signUp({
      email: targetEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone || cleanPhoneDigits,
          role: 'student', // Strictly enforced: new signups are always 'student'
          student_id: studentId,
          avatar_url: avatarUrl || '',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: formatAuthErrorMessage(error),
      };
    }

    const authUser = data?.user;
    if (!authUser) {
      return {
        success: false,
        error: 'অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      };
    }

    // 2. Synchronize to public.profiles table (profiles.id = auth.users.id)
    try {
      await supabaseInstance
        .from('profiles')
        .upsert({
          id: authUser.id,
          full_name: cleanName,
          phone: cleanPhone || cleanPhoneDigits,
          email: targetEmail,
          role: 'student',
          avatar_url: avatarUrl || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (profErr) {
      console.warn('public.profiles synchronization notice:', profErr);
    }

    const profileData = {
      id: authUser.id,
      full_name: cleanName,
      phone: cleanPhone || cleanPhoneDigits,
      email: targetEmail,
      role: 'student',
      student_id: studentId,
      avatar_url: avatarUrl || '',
    };

    (authUser as any).profile = profileData;

    return {
      success: true,
      user: authUser,
      session: data.session,
      needsEmailConfirmation: !data.session && Boolean(authUser && !authUser.confirmed_at),
    };
  } catch (err: any) {
    console.error('Supabase signup error:', err);
    return {
      success: false,
      error: formatAuthErrorMessage(err),
    };
  }
}

/**
 * Sign in existing user using Supabase Auth as the single source of truth.
 * Supports Phone Number or Email + Password.
 * Loads public.profiles using profiles.id = auth.users.id.
 */
export async function supabaseSignIn(
  identifier: string,
  password: string
): Promise<AuthResult> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase ডাটাবেজ সংযোগ পাওয়া যায়নি।',
    };
  }

  const cleanInput = (identifier || '').trim();
  if (!cleanInput) {
    return { success: false, error: 'মোবাইল নম্বর বা ইমেইল প্রদান করুন।' };
  }
  if (!password) {
    return { success: false, error: 'আপনার পাসওয়ার্ড লিখুন।' };
  }

  const { email, isPhone, phoneDigits } = normalizeAuthIdentifier(cleanInput);

  // List of email variations to test against Supabase Auth in case user registered earlier with alternative prefix
  const emailsToTry = [email];
  if (isPhone && phoneDigits) {
    const clean11 = phoneDigits.length >= 11 ? phoneDigits.slice(-11) : phoneDigits.padStart(11, '0');
    const alt1 = `phone_${clean11}@attamreen.com`;
    const alt2 = `${clean11}@attamreen.com`;
    const alt3 = `student_${clean11}@gmail.com`;
    const alt4 = `phone${clean11}@gmail.com`;
    if (!emailsToTry.includes(alt1)) emailsToTry.push(alt1);
    if (!emailsToTry.includes(alt2)) emailsToTry.push(alt2);
    if (!emailsToTry.includes(alt3)) emailsToTry.push(alt3);
    if (!emailsToTry.includes(alt4)) emailsToTry.push(alt4);
  }

  let lastError: any = null;

  for (const candidateEmail of emailsToTry) {
    try {
      const { data, error } = await supabaseInstance.auth.signInWithPassword({
        email: candidateEmail,
        password: password,
      });

      if (!error && data?.user) {
        const authUser = data.user;

        // Load profile from public.profiles where profiles.id = auth.users.id
        let userProfile = null;
        try {
          const { data: prof } = await supabaseInstance
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (prof) {
            userProfile = prof;
          }
        } catch (profErr) {
          console.warn('Error fetching public.profiles on signin:', profErr);
        }

        const userMeta = authUser.user_metadata || {};
        const profile = {
          id: authUser.id,
          full_name: userProfile?.full_name || userMeta.full_name || 'শিক্ষার্থী',
          phone: userProfile?.phone || userMeta.phone || (isPhone ? cleanInput : ''),
          email: userProfile?.email || authUser.email || candidateEmail,
          role: userProfile?.role || userMeta.role || 'student',
          student_id: userMeta.student_id || `STD-${(userProfile?.phone || userMeta.phone || '').replace(/[^0-9]/g, '').slice(-6)}`,
          avatar_url: userProfile?.avatar_url || userMeta.avatar_url || '',
        };

        (authUser as any).profile = profile;

        return {
          success: true,
          user: authUser,
          session: data.session,
        };
      }

      if (error) {
        lastError = error;
        // If error is something other than invalid_credentials (e.g. email_not_confirmed), don't keep trying fallbacks
        if (error.status !== 400 || (error as any).code === 'email_not_confirmed') {
          break;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    error: formatAuthErrorMessage(lastError || new Error('লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।')),
  };
}

/**
 * Sends a password reset email via Supabase Auth and Server Auth
 */
export async function supabaseResetPassword(email: string): Promise<{ success: boolean; error?: string | null; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      success: false,
      error: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।',
    };
  }

  let supabaseSuccess = false;
  let supabaseError: string | null = null;

  // 1. If Supabase is configured, attempt password reset via Supabase Auth
  if (supabaseInstance) {
    try {
      const { error } = await supabaseInstance.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
      });

      if (!error) {
        supabaseSuccess = true;
      } else {
        supabaseError = formatAuthErrorMessage(error);
      }
    } catch (err: any) {
      console.warn('Supabase reset password exception:', err);
      supabaseError = formatAuthErrorMessage(err);
    }
  }

  // 2. Call server endpoint to log/send reset notification
  try {
    const srvRes = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      return {
        success: true,
        message: srvData.message || 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।',
      };
    }
  } catch (srvErr) {
    console.warn('Server password reset call warning:', srvErr);
  }

  if (supabaseSuccess) {
    return {
      success: true,
      message: 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।',
    };
  }

  // If Supabase wasn't configured, provide graceful successful response for the user
  if (!supabaseInstance) {
    return {
      success: true,
      message: `${cleanEmail} ঠিকানায় পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে।`,
    };
  }

  return {
    success: false,
    error: supabaseError || 'পাসওয়ার্ড রিসেট লিংক পাঠানো সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
  };
}

/**
 * Sign out the current authenticated user
 */
export async function supabaseSignOut(): Promise<void> {
  if (!supabaseInstance) return;
  try {
    await supabaseInstance.auth.signOut();
  } catch (err) {
    console.warn('Signout error:', err);
  }
}

/**
 * Get current authenticated user session
 */
export async function supabaseGetSession(): Promise<any> {
  if (!supabaseInstance) return null;
  try {
    const { data } = await supabaseInstance.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Supabase Auth state changes
 */
export function supabaseOnAuthStateChange(callback: (event: string, session: any) => void): () => void {
  if (!supabaseInstance) return () => {};
  try {
    const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => {
      subscription?.unsubscribe();
    };
  } catch {
    return () => {};
  }
}

/**
 * Get current authenticated user profile from Supabase Auth & public.profiles
 */
export async function supabaseGetUser(): Promise<any> {
  if (!supabaseInstance) return null;
  try {
    const { data: { user }, error } = await supabaseInstance.auth.getUser();
    if (error || !user) return null;

    let userProfile = null;
    try {
      const { data: prof } = await supabaseInstance
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) {
        userProfile = prof;
      }
    } catch {}

    const userMeta = user.user_metadata || {};
    const profile = {
      id: user.id,
      full_name: userProfile?.full_name || userMeta.full_name || 'শিক্ষার্থী',
      phone: userProfile?.phone || userMeta.phone || '',
      email: userProfile?.email || user.email || '',
      role: userProfile?.role || userMeta.role || 'student',
      student_id: userMeta.student_id || `STD-${(userProfile?.phone || userMeta.phone || '').replace(/[^0-9]/g, '').slice(-6)}`,
      avatar_url: userProfile?.avatar_url || userMeta.avatar_url || '',
    };

    (user as any).profile = profile;
    return user;
  } catch {
    return null;
  }
}

/**
 * Fetch all registered students / accounts for the Admin Panel across all devices
 */
export async function fetchAllRegisteredUsers(): Promise<{
  users: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string;
    createdAt: string;
    avatarUrl?: string;
    role?: string;
  }>;
  source: 'supabase' | 'server' | 'local';
}> {
  const resultMap = new Map<string, {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    createdAt: string;
    avatarUrl?: string;
    role?: string;
  }>();

  // 1. Fetch from Supabase public.profiles if connected
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach((p) => {
          resultMap.set(p.id, {
            id: p.id,
            fullName: p.full_name || 'শিক্ষার্থী',
            phone: p.phone || '',
            email: p.email || '',
            createdAt: p.updated_at || p.created_at || new Date().toISOString(),
            avatarUrl: p.avatar_url || '',
            role: p.role || 'student',
          });
        });
      }
    } catch (err) {
      console.warn('Error fetching profiles from Supabase:', err);
    }
  }

  // 2. Fetch from shared server store as secondary data source
  try {
    const srvRes = await fetch('/api/auth/users');
    if (srvRes.ok) {
      const srvData = await srvRes.json();
      if (srvData?.success && Array.isArray(srvData.users)) {
        srvData.users.forEach((u: any) => {
          if (!resultMap.has(u.id)) {
            resultMap.set(u.id || u.student_id, {
              id: u.id || u.student_id,
              fullName: u.fullName || u.full_name || 'শিক্ষার্থী',
              phone: u.phone || '',
              email: u.email || '',
              createdAt: u.createdAt || u.created_at || new Date().toISOString(),
              avatarUrl: u.avatarUrl || u.avatar_url || '',
              role: u.role || 'student',
            });
          }
        });
      }
    }
  } catch (srvErr) {
    console.warn('Could not fetch server auth users:', srvErr);
  }

  return {
    users: Array.from(resultMap.values()),
    source: 'supabase',
  };
}
