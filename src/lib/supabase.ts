import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Question,
  CourseModule,
  CourseEnrollmentRecord,
  CourseSheet,
  CourseExam,
  CourseRoutineItem,
  CourseSyllabusItem,
  QuestionCommunityExplanation
} from '../types';
import { detectQuestionSubject, MAIN_SUBJECT_POSTS, MainSubjectPost } from './subjects';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';
import { 
  getUserRollNumber, 
  getUserUniqueId, 
  getUserProfile, 
  getGuestDeviceId, 
  addCompletedExamId, 
  getCompletedExamIds,
  getLikedIds,
  getBookmarkedIds,
  getLocalQuestionLikeCount,
  setLocalQuestionLikeCount
} from './utils';

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
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
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

export async function fetchWithTimeout<T>(promisePromise: Promise<T>, timeoutMs = 8000, fallbackVal: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Supabase network request timed out after ${timeoutMs}ms (Mobile Data Resiliency Mode active)`);
      resolve(fallbackVal);
    }, timeoutMs);
  });

  return Promise.race([promisePromise, timeoutPromise]).then((res) => {
    clearTimeout(timer);
    return res;
  }).catch((err) => {
    clearTimeout(timer);
    console.warn('Network request exception caught in fetchWithTimeout:', err);
    return fallbackVal;
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

  // Clean cache by removing any legacy sample questions
  if (cachedQuestions.length > 0) {
    cachedQuestions = cachedQuestions.filter((q: any) => q && !String(q.id).startsWith('sample-'));
  }

  if (!supabaseInstance) {
    return {
      questions: cachedQuestions,
      isFromSupabase: false,
      error: cachedQuestions.length > 0 ? null : 'Supabase এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই।',
    };
  }

  try {
    // Select all questions (not restricting strictly to status='published' so admin created questions show up)
    const queryPromise = Promise.resolve(supabaseInstance
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false }));

    const timeoutFallback = { data: null, error: { message: 'Network Timeout (Mobile Data)', code: 'TIMEOUT' } };
    const { data, error } = await fetchWithTimeout(queryPromise, 3500, timeoutFallback as any);

    if (error) {
      console.warn('Supabase fetch notice (using cache/presets):', error.message || error);
      return {
        questions: cachedQuestions,
        isFromSupabase: false,
        error: null,
      };
    }

    if (!data || data.length === 0) {
      try {
        localStorage.setItem('miniquiz_questions_cache', JSON.stringify([]));
      } catch {}
      return {
        questions: [],
        isFromSupabase: true,
        error: null,
      };
    }

    // Cast & format fetched items from public.questions with subject auto-detection fallback
    const questionsList: Question[] = data
      .filter((item: any) => item && item.status !== 'draft')
      .map((item: any) => {
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
        exam_id: item.exam_id ? String(item.exam_id) : null,
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
    return {
      questions: cachedQuestions,
      isFromSupabase: false,
      error: null,
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
  question_ids?: string[] | number[];
  selected_question_codes?: string[];
  created_at?: string;
  updated_at?: string;
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
export async function fetchExamsFromSupabase(forceRefresh: boolean = false): Promise<FetchExamsResult> {
  let cachedExams: ExamItem[] = [];
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem('miniquiz_exams_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) cachedExams = parsed;
      }
    } catch {}
  }

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

    const parseIds = (val: any): string[] | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) {
        const list = val.map((v: any) => String(v).trim()).filter(Boolean);
        return list.length > 0 ? list : undefined;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              const list = parsed.map((v: any) => String(v).trim()).filter(Boolean);
              return list.length > 0 ? list : undefined;
            }
          } catch {}
        }
        const list = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
        return list.length > 0 ? list : undefined;
      }
      return [String(val)];
    };

    const fetchedExams: ExamItem[] = data
      .filter((item: any) => item && item.status !== 'inactive' && item.status !== 'draft')
      .map((item: any) => ({
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
      question_ids: parseIds(item.question_ids || item.selected_question_codes || item.question_codes),
      selected_question_codes: parseIds(item.selected_question_codes || item.question_codes || item.question_ids),
      created_at: item.created_at,
      updated_at: item.updated_at,
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

    try {
      localStorage.removeItem('miniquiz_exams_cache');
      localStorage.removeItem('miniquiz_questions_cache');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tamreen_data_changed'));
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
  exam_id?: string;
}

function isUuidString(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Fetches questions strictly matching a specific exam_id or selected_question_codes from Supabase
 * Strict Requirements:
 * 1. Fetch by Question Code Array: Queries exams table to get 'selected_question_codes' (or 'question_ids'),
 *    then queries questions table using .in() to retrieve only those specific questions in exact order.
 * 2. Disabled Auto Range/Pagination: No range/offset queries, renders only specifically selected questions.
 */
export async function fetchQuestionsByExamId(examId: string, examSubject?: string, examTitle?: string): Promise<Question[]> {
  if (!supabaseInstance || !examId) return [];

  const cleanExamId = String(examId).trim();
  if (!cleanExamId || cleanExamId === 'general') return [];

  try {
    let rawQuestions: any[] = [];
    let selectedCodesList: string[] = [];

    // Helper to parse question codes/ids from various formats (array, JSON string, comma-separated)
    const extractCodes = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.map((v: any) => String(v).trim()).filter(Boolean);
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.map((v: any) => String(v).trim()).filter(Boolean);
            }
          } catch {}
        }
        return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [String(val).trim()].filter(Boolean);
    };

    // 1. First, lookup the exam record directly in Supabase 'exams' table to ensure fresh data
    let examRecord: any = null;

    let examQuery = supabaseInstance.from('exams').select('*');
    const { data: dbExams } = await examQuery.or(`id.eq.${cleanExamId},title.eq.${cleanExamId}`);
    if (dbExams && dbExams.length > 0) {
      examRecord = dbExams[0];
    } else if (examTitle && examTitle.trim()) {
      const { data: titleExams } = await supabaseInstance.from('exams').select('*').eq('title', examTitle.trim());
      if (titleExams && titleExams.length > 0) {
        examRecord = titleExams[0];
      }
    }

    // Fallback to local cache only if Supabase returned nothing
    if (!examRecord) {
      try {
        const rawExams = localStorage.getItem('miniquiz_exams_cache');
        if (rawExams) {
          const parsedExams = JSON.parse(rawExams);
          if (Array.isArray(parsedExams)) {
            examRecord = parsedExams.find((e: any) => 
              String(e.id).trim().toLowerCase() === cleanExamId.toLowerCase() ||
              (e.title && String(e.title).trim().toLowerCase() === cleanExamId.toLowerCase()) ||
              (examTitle && e.title && String(e.title).trim().toLowerCase() === examTitle.trim().toLowerCase())
            );
          }
        }
      } catch {}
    }

    if (examRecord) {
      const codes = [
        ...extractCodes(examRecord.selected_question_codes),
        ...extractCodes(examRecord.question_ids),
        ...extractCodes(examRecord.question_codes),
        ...extractCodes(examRecord.selected_questions),
      ];
      selectedCodesList = Array.from(new Set(codes));
    }

    // 2. If selected question codes exist, fetch specifically those Question Codes
    if (selectedCodesList.length > 0) {
      // Query questions by id
      const { data: byIdData, error: byIdErr } = await supabaseInstance
        .from('questions')
        .select('*')
        .in('id', selectedCodesList);

      let matchedQuestions: any[] = [];
      if (!byIdErr && byIdData && byIdData.length > 0) {
        matchedQuestions = byIdData;
      }

      // Query questions by question_code column
      if (matchedQuestions.length === 0) {
        const { data: byCodeData, error: byCodeErr } = await supabaseInstance
          .from('questions')
          .select('*')
          .in('question_code', selectedCodesList);
        if (!byCodeErr && byCodeData && byCodeData.length > 0) {
          matchedQuestions = byCodeData;
        }
      }

      // Query questions by slug
      if (matchedQuestions.length === 0) {
        const { data: bySlugData } = await supabaseInstance
          .from('questions')
          .select('*')
          .in('slug', selectedCodesList);
        if (bySlugData && bySlugData.length > 0) {
          matchedQuestions = bySlugData;
        }
      }

      if (matchedQuestions.length > 0) {
        // Maintain the exact ordering of selected_question_codes specified by the admin
        const idMap = new Map<string, any>();
        matchedQuestions.forEach((q: any) => {
          idMap.set(String(q.id).trim(), q);
          if (q.question_code) idMap.set(String(q.question_code).trim(), q);
          if (q.slug) idMap.set(String(q.slug).trim(), q);
        });

        const orderedList: any[] = [];
        selectedCodesList.forEach((code) => {
          const matched = idMap.get(code);
          if (matched && !orderedList.includes(matched)) {
            orderedList.push(matched);
          }
        });

        matchedQuestions.forEach((q: any) => {
          if (!orderedList.includes(q)) orderedList.push(q);
        });

        rawQuestions = orderedList;
      }
    }

    // 3. If no specific question codes were linked or returned 0, fetch questions directly linked via exam_id
    if (rawQuestions.length === 0) {
      const candidateExamKeys = Array.from(new Set([
        cleanExamId,
        examRecord?.id ? String(examRecord.id).trim() : null,
        examRecord?.title ? String(examRecord.title).trim() : null,
        examTitle ? String(examTitle).trim() : null,
      ])).filter(Boolean) as string[];

      const { data: directData, error: directErr } = await supabaseInstance
        .from('questions')
        .select('*')
        .in('exam_id', candidateExamKeys)
        .order('created_at', { ascending: true });

      if (!directErr && directData && directData.length > 0) {
        rawQuestions = directData;
      }
    }

    // 4. Return strictly empty array if no questions are assigned to this exam (NO random pagination/ranges)
    if (rawQuestions.length === 0) {
      return [];
    }

    const formattedQuestions: Question[] = rawQuestions
      .filter((item: any) => item && item.status !== 'draft')
      .map((item: any) => ({
        id: String(item.id),
        question_code: item.question_code ? String(item.question_code) : String(item.id),
        slug: item.slug ? String(item.slug) : String(item.id),
        question: String(item.question || item.question_text || ''),
        option_a: String(item.option_a || ''),
        option_b: String(item.option_b || ''),
        option_c: String(item.option_c || ''),
        option_d: String(item.option_d || ''),
        correct_answer: (item.correct_answer || 'option_a') as any,
        explanation: item.explanation ? String(item.explanation) : null,
        subject: item.subject ? String(item.subject) : null,
        topic: item.topic ? String(item.topic) : null,
        status: item.status || 'published',
        exam_id: item.exam_id ? String(item.exam_id) : null,
        created_at: item.created_at || new Date().toISOString(),
      }));

    return formattedQuestions;
  } catch (err) {
    console.error('Error in fetchQuestionsByExamId:', cleanExamId, err);
    return [];
  }
}

/**
 * Fetches a single question by its slug or ID from Supabase 'public.questions'
 */
export async function fetchQuestionBySlugOrId(slugOrId: string): Promise<Question | null> {
  if (!slugOrId) return null;
  const cleanVal = String(slugOrId).trim();

  if (supabaseInstance) {
    try {
      if (isUuidString(cleanVal)) {
        const { data } = await supabaseInstance
          .from('questions')
          .select('*')
          .eq('id', cleanVal)
          .limit(1);

        if (data && data.length > 0) {
          const item = data[0];
          return {
            id: String(item.id),
            slug: item.slug ? String(item.slug) : String(item.id),
            question: String(item.question || ''),
            option_a: String(item.option_a || ''),
            option_b: String(item.option_b || ''),
            option_c: String(item.option_c || ''),
            option_d: String(item.option_d || ''),
            correct_answer: (item.correct_answer || 'option_a') as any,
            explanation: item.explanation ? String(item.explanation) : null,
            subject: item.subject ? String(item.subject) : null,
            topic: item.topic ? String(item.topic) : null,
            status: item.status || 'published',
            exam_id: item.exam_id ? String(item.exam_id) : null,
            created_at: item.created_at || new Date().toISOString(),
          };
        }
      }

      const { data: slugData } = await supabaseInstance
        .from('questions')
        .select('*')
        .eq('slug', cleanVal)
        .limit(1);

      if (slugData && slugData.length > 0) {
        const item = slugData[0];
        return {
          id: String(item.id),
          slug: item.slug ? String(item.slug) : String(item.id),
          question: String(item.question || ''),
          option_a: String(item.option_a || ''),
          option_b: String(item.option_b || ''),
          option_c: String(item.option_c || ''),
          option_d: String(item.option_d || ''),
          correct_answer: (item.correct_answer || 'option_a') as any,
          explanation: item.explanation ? String(item.explanation) : null,
          subject: item.subject ? String(item.subject) : null,
          topic: item.topic ? String(item.topic) : null,
          status: item.status || 'published',
          exam_id: item.exam_id ? String(item.exam_id) : null,
          created_at: item.created_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('fetchQuestionBySlugOrId error:', err);
    }
  }

  // Fallback to local cache
  try {
    const raw = localStorage.getItem('miniquiz_questions_cache');
    if (raw) {
      const parsed: Question[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = parsed.find(
          (q) => String(q.id) === cleanVal || (q.slug && String(q.slug) === cleanVal)
        );
        if (found) return found;
      }
    }
  } catch {}

  return null;
}

/**
 * Inserts a new MCQ question into Supabase 'public.questions' table
 */
export async function addQuestionToSupabase(input: NewQuestionInput): Promise<{ success: boolean; data?: Question; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ নেই।',
    };
  }

  try {
    const newRecord: any = {
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

    if (input.exam_id && input.exam_id.trim() !== '') {
      newRecord.exam_id = input.exam_id.trim();
    }

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

    try {
      localStorage.removeItem('miniquiz_questions_cache');
      localStorage.removeItem('miniquiz_exams_cache');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tamreen_data_changed'));
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
        exam_id: data.exam_id ? String(data.exam_id) : undefined,
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
 * Inserts multiple MCQ questions into Supabase 'public.questions' table in bulk
 */
export async function addMultipleQuestionsToSupabase(inputs: NewQuestionInput[]): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!supabaseInstance) {
    return {
      success: false,
      error: 'Supabase সংযোগ নেই।',
    };
  }

  try {
    const newRecords = inputs.map(input => ({
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
      exam_id: input.exam_id?.trim() || null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseInstance
      .from('questions')
      .insert(newRecords)
      .select();

    if (error) {
      console.error('Supabase bulk insert error:', error);
      return {
        success: false,
        error: `প্রশ্নগুলো যুক্ত করতে ব্যর্থ: ${error.message}`,
      };
    }

    try {
      localStorage.removeItem('miniquiz_questions_cache');
      localStorage.removeItem('miniquiz_exams_cache');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tamreen_data_changed'));
    }

    return {
      success: true,
      count: data?.length || 0
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
    return { success: false, error: msg };
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

    try {
      localStorage.removeItem('miniquiz_questions_cache');
      localStorage.removeItem('miniquiz_exams_cache');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tamreen_data_changed'));
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
  guest_name?: string;
  full_name?: string;
  user_avatar?: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  time_taken_seconds?: number;
  is_guest?: boolean;
  created_at: string;
}

export interface ExamLeaderboardItem {
  rank: number;
  user_id: string;
  full_name: string;
  guest_name?: string;
  avatar_url?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken_seconds: number;
  is_guest?: boolean;
  submitted_at?: string;
}

export interface FreeOverallLeaderboardItem {
  rank: number;
  user_id: string;
  full_name: string;
  guest_name?: string;
  avatar_url?: string;
  total_points: number;
  free_exam_count: number;
  average_percentage: number;
  is_guest?: boolean;
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
  guest_name?: string;
  is_guest?: boolean;
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
  const isGuest = Boolean(
    params.is_guest !== undefined
      ? params.is_guest
      : (Boolean(params.guest_name) || !params.user_id || params.user_id.startsWith('guest_') || params.user_id.startsWith('anon_'))
  );
  const effectiveName = params.guest_name || params.full_name;

  // 1. Post to Express Server API for real-time multi-device sync
  try {
    await fetch('/api/exam_results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        full_name: effectiveName,
        guest_name: isGuest ? effectiveName : params.guest_name,
        is_guest: isGuest,
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
    user_name: effectiveName,
    guest_name: isGuest ? effectiveName : params.guest_name,
    full_name: effectiveName,
    is_guest: isGuest,
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
    // 3A. Upsert Profile ONLY for registered users (avoid overwriting profiles with guest names)
    try {
      if (params.user_id && !isGuest) {
        await supabaseInstance
          .from('profiles')
          .upsert({
            id: params.user_id,
            full_name: effectiveName,
            avatar_url: params.avatar_url || null,
            updated_at: submittedAt,
          }, { onConflict: 'id' });
      }
    } catch (profErr) {
      console.warn('Profiles upsert warning:', profErr);
    }

    // 3B. Insert into exam_results as requested
    const submissionData = {
      exam_id: String(params.exam_id),
      exam_title: params.exam_title || 'মডেল টেস্ট',
      user_id: isGuest ? null : (params.user_id || null),
      guest_id: isGuest ? params.user_id : null,
      user_name: effectiveName || 'গেস্ট',
      total_marks: Number(params.total_marks),
      score: Number(params.score),
      correct_count: Number(params.correct_answers),
      wrong_count: Number(params.wrong_answers),
      time_taken: Number(timeTaken),
      submitted_at: submittedAt,
      is_free: params.is_free ?? true,
    };

    const { data, error } = await supabaseInstance
      .from('exam_results')
      .insert([submissionData]);

    if (error) {
      console.error("Exam Submit Error:", error.message);
      if (typeof window !== 'undefined') {
        alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে: " + error.message);
      }
      return { success: false, error: error.message };
    }

    // 3C. Also insert into leaderboard_entries for dual-write compatibility if table exists
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
 * Fetch all exam IDs/titles that the current user (registered or guest) has completed from Supabase.
 * Automatically synchronizes with local storage.
 */
export async function fetchUserCompletedExamsFromSupabase(userId?: string): Promise<string[]> {
  let authUserId: string | undefined;
  if (supabaseInstance) {
    try {
      const { data } = await supabaseInstance.auth.getSession();
      if (data?.session?.user?.id) {
        authUserId = data.session.user.id;
      }
    } catch {}
  }

  const currentUId = userId || authUserId || getUserUniqueId();
  const prof = getUserProfile();
  const guestDevId = getGuestDeviceId();
  const candidateIds = Array.from(new Set([
    authUserId,
    currentUId,
    userId,
    prof?.student_id,
    prof?.phone,
    guestDevId,
  ].filter(Boolean) as string[]));

  const completedExamIds: string[] = [];

  // 1. Try Supabase exam_results table
  if (supabaseInstance && candidateIds.length > 0) {
    try {
      const orFilter = candidateIds.map((id) => `user_id.eq.${id},guest_id.eq.${id}`).join(',');
      const query = supabaseInstance
        .from('exam_results')
        .select('exam_id, exam_title, score, total_marks, correct_count, wrong_count, time_taken, is_free')
        .or(orFilter);

      const { data, error } = await fetchWithTimeout(Promise.resolve(query), 5000, { data: null, error: null } as any);
      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach((r: any) => {
          if (r.exam_id) {
            const cleanId = String(r.exam_id).trim();
            completedExamIds.push(cleanId);
            addCompletedExamId(cleanId);
          }
          if (r.exam_title) {
            const cleanTitle = String(r.exam_title).trim();
            completedExamIds.push(cleanTitle);
            addCompletedExamId(cleanTitle);
          }
        });
      }
    } catch (e) {
      console.warn('fetchUserCompletedExamsFromSupabase error:', e);
    }
  }

  // 2. Also check Server API completed exams
  try {
    const srvRes = await fetch(`/api/exam/completed?userId=${encodeURIComponent(currentUId || '')}&guestId=${encodeURIComponent(guestDevId || '')}`);
    if (srvRes.ok) {
      const srvJson = await srvRes.json();
      if (srvJson?.success && Array.isArray(srvJson.completedExamIds)) {
        srvJson.completedExamIds.forEach((id: string) => {
          const clean = String(id).trim();
          if (clean) {
            completedExamIds.push(clean);
            addCompletedExamId(clean);
          }
        });
      }
    }
  } catch {}

  // 3. Also check local storage completed list
  const localCompleted = getCompletedExamIds();
  localCompleted.forEach((id) => {
    if (!completedExamIds.includes(id)) {
      completedExamIds.push(id);
    }
  });

  return Array.from(new Set(completedExamIds));
}

/**
 * Fetch distinct participant counts per exam from Supabase exam_results & leaderboard.
 * Returns a map of examId/examTitle -> distinct participant count.
 */
export async function getDistinctExamParticipantCounts(): Promise<Record<string, number>> {
  const countsMap: Record<string, number> = {};
  const examParticipantSets: Record<string, Set<string>> = {};

  const addParticipant = (examKey: string, participantKey: string) => {
    if (!examKey || !participantKey) return;
    const cleanKey = examKey.trim().toLowerCase();
    if (!examParticipantSets[cleanKey]) {
      examParticipantSets[cleanKey] = new Set<string>();
    }
    examParticipantSets[cleanKey].add(participantKey.toLowerCase().trim());
  };

  // 1. Try global_leaderboard or exam_results from Supabase
  if (supabaseInstance) {
    try {
      let query = supabaseInstance
        .from('exam_results')
        .select('exam_id, exam_title, user_id, guest_id, user_name, full_name, guest_name, id');

      const { data, error } = await fetchWithTimeout(Promise.resolve(query), 5000, { data: null, error: null } as any);
      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          const isReg = Boolean(row.user_id && !row.user_id.startsWith('guest_') && !row.user_id.startsWith('anon_'));
          const pKey = isReg
            ? String(row.user_id)
            : String(row.guest_id || row.guest_name || row.user_name || row.full_name || row.id || '');
          if (row.exam_id) addParticipant(row.exam_id, pKey);
          if (row.exam_title) addParticipant(row.exam_title, pKey);
        }
      }
    } catch (e) {
      console.warn('getDistinctExamParticipantCounts Supabase error:', e);
    }
  }

  // 2. Also check local entries
  const localEntries = getLocalLeaderboardEntries();
  for (const entry of localEntries) {
    const isReg = Boolean(entry.user_id && !entry.user_id.startsWith('guest_') && !entry.user_id.startsWith('anon_'));
    const pKey = isReg
      ? String(entry.user_id)
      : String(entry.guest_name || entry.user_name || entry.full_name || entry.id || '');
    if (entry.exam_id) addParticipant(entry.exam_id, pKey);
    if (entry.exam_title) addParticipant(entry.exam_title, pKey);
  }

  // Calculate distinct counts
  for (const [examKey, setOfParticipants] of Object.entries(examParticipantSets)) {
    countsMap[examKey] = setOfParticipants.size;
  }

  return countsMap;
}

/**
 * Fetch exam-specific leaderboard via Supabase `exam_results` table (Sort by score DESC)
 * or via secure RPC `get_exam_leaderboard`.
 * Falls back gracefully to server RPC API and local store.
 */
export async function getExamLeaderboard(examId: string): Promise<ExamLeaderboardItem[]> {
  if (!examId || examId === 'all') return [];

  // 1. Direct Supabase Query from `exam_results` table sorted by score DESC, time_taken ASC
  if (supabaseInstance) {
    try {
      const cleanExamId = examId.trim();
      
      // Query exam_results directly as requested
      let query = supabaseInstance
        .from('exam_results')
        .select('*')
        .or(`exam_id.eq.${cleanExamId},exam_title.eq.${cleanExamId},exam_id.ilike.%${cleanExamId}%,exam_title.ilike.%${cleanExamId}%`)
        .order('score', { ascending: false })
        .order('time_taken', { ascending: true });

      const directRes = await fetchWithTimeout(Promise.resolve(query), 6000, { data: null, error: null } as any);
      let data = directRes.data;
      let error = directRes.error;

      // Fallback for older entries using time_taken_seconds if time_taken fails
      if (error || !data || data.length === 0) {
        let queryFallback = supabaseInstance
          .from('exam_results')
          .select('*')
          .or(`exam_id.eq.${cleanExamId},exam_title.eq.${cleanExamId},exam_id.ilike.%${cleanExamId}%,exam_title.ilike.%${cleanExamId}%`)
          .order('score', { ascending: false })
          .order('time_taken_seconds', { ascending: true });
        const fallbackRes = await fetchWithTimeout(Promise.resolve(queryFallback), 6000, { data: null, error: null } as any);
        data = fallbackRes.data || [];
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        // Fetch profiles to map names and avatars
        const userIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
        let profilesMap = new Map<string, { full_name?: string; avatar_url?: string }>();
        if (userIds.length > 0) {
          try {
            const { data: profs } = await supabaseInstance
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);
            if (profs && Array.isArray(profs)) {
              profs.forEach((p: any) => {
                if (p.id) profilesMap.set(p.id, p);
              });
            }
          } catch {}
        }

        // Deduplicate best result per distinct participant
        const bestMap = new Map<string, any>();
        for (const row of data) {
          const isReg = Boolean(row.user_id && !row.user_id.startsWith('guest_') && !row.user_id.startsWith('anon_'));
          const uKey = isReg
            ? String(row.user_id).trim()
            : String(row.guest_id || row.guest_name || row.user_name || row.full_name || row.id || '').trim().toLowerCase();
          
          const existing = bestMap.get(uKey);
          const scoreVal = Number(row.obtained_marks ?? row.score ?? row.correct_answers ?? row.correct_count ?? 0);
          const timeVal = Number(row.time_taken ?? row.time_taken_seconds ?? 999999);
          const rowDate = new Date(row.submitted_at || row.created_at || 0).getTime();

          if (!existing) {
            bestMap.set(uKey, row);
          } else {
            const existScore = Number(existing.obtained_marks ?? existing.score ?? existing.correct_answers ?? existing.correct_count ?? 0);
            const existTime = Number(existing.time_taken ?? existing.time_taken_seconds ?? 999999);
            const existDate = new Date(existing.submitted_at || existing.created_at || 0).getTime();

            if (scoreVal > existScore) {
              bestMap.set(uKey, row);
            } else if (scoreVal === existScore) {
              if (timeVal < existTime) {
                bestMap.set(uKey, row);
              } else if (rowDate > existDate) {
                bestMap.set(uKey, row);
              }
            }
          }
        }

        // Sort: 1. Score DESC, 2. Time Taken ASC, 3. Submitted At ASC
        const sortedRows = Array.from(bestMap.values()).sort((a, b) => {
          const scoreA = Number(a.obtained_marks ?? a.score ?? a.correct_answers ?? a.correct_count ?? 0);
          const scoreB = Number(b.obtained_marks ?? b.score ?? b.correct_answers ?? b.correct_count ?? 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          const timeA = Number(a.time_taken ?? a.time_taken_seconds ?? 999999);
          const timeB = Number(b.time_taken ?? b.time_taken_seconds ?? 999999);
          if (timeA !== timeB) return timeA - timeB;
          return new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime();
        });

        return sortedRows.map((row: any, idx: number) => {
          const prof = profilesMap.get(row.user_id);
          const fullName = row.user_name || row.guest_name || row.full_name || prof?.full_name || 'পরীক্ষার্থী';
          const avatarUrl = row.avatar_url || prof?.avatar_url;
          const score = Number(row.obtained_marks ?? row.score ?? row.correct_answers ?? row.correct_count ?? 0);
          const totalMarks = Number(row.total_marks ?? (Number(row.correct_answers ?? row.correct_count ?? 0) + Number(row.wrong_answers ?? row.wrong_count ?? 0)) ?? 0);
          const correctAnswers = Number(row.correct_answers ?? row.correct_count ?? row.score ?? 0);
          const wrongAnswers = Number(row.wrong_answers ?? row.wrong_count ?? 0);
          const timeTaken = Number(row.time_taken ?? row.time_taken_seconds ?? 0);
          const uId = String(row.user_id || '');
          const isGuest = Boolean(
            row.is_guest === true ||
            Boolean(row.guest_name) ||
            !uId ||
            uId.startsWith('guest_') ||
            uId.startsWith('anon_') ||
            fullName.includes('গেস্ট') ||
            fullName.includes('Guest')
          );

          return {
            rank: idx + 1,
            user_id: uId,
            full_name: fullName,
            guest_name: row.guest_name || (isGuest ? fullName : undefined),
            avatar_url: avatarUrl,
            score,
            total_marks: totalMarks,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            time_taken_seconds: timeTaken,
            is_guest: isGuest,
          };
        });
      }
    } catch (directErr) {
      console.warn('Direct exam_results query error:', directErr);
    }
  }

  // 3. Fetch from Express Server RPC endpoint
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

  // 4. Fallback to computing from local entries (sorted by score DESC)
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
 * Fetch free overall leaderboard via Supabase `exam_results` table (Sort by score/points DESC)
 * or via secure RPC `get_free_overall_leaderboard`.
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

    // 2. Direct Supabase Query from `exam_results` table
    try {
      const now = Date.now();
      let minTimestamp = 0;
      if (normalizedPeriod === 'today') {
        const d = new Date();
        minTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      } else if (normalizedPeriod === 'week') {
        minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
      } else if (normalizedPeriod === 'month') {
        minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
      }

      let query = supabaseInstance
        .from('exam_results')
        .select('*')
        .order('score', { ascending: false });

      const { data, error } = await fetchWithTimeout(Promise.resolve(query), 6000, { data: null, error: null } as any);
      if (!error && Array.isArray(data) && data.length > 0) {
        // Filter by date if needed
        const filtered = data.filter((r: any) => {
          if (r.is_free === false) return false;
          if (minTimestamp > 0) {
            const t = new Date(r.submitted_at || r.created_at || 0).getTime();
            if (isNaN(t) || t < minTimestamp) return false;
          }
          return true;
        });

        if (filtered.length > 0) {
          // Fetch profiles
          const userIds = Array.from(new Set(filtered.map((r: any) => r.user_id).filter(Boolean)));
          let profilesMap = new Map<string, { full_name?: string; avatar_url?: string }>();
          if (userIds.length > 0) {
            try {
              const { data: profs } = await supabaseInstance
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);
              if (profs && Array.isArray(profs)) {
                profs.forEach((p: any) => {
                  if (p.id) profilesMap.set(p.id, p);
                });
              }
            } catch {}
          }

          // Group by user_id
          const userAggMap = new Map<string, {
            user_id: string;
            full_name: string;
            avatar_url?: string;
            total_points: number;
            free_exam_count: number;
            percentageSum: number;
          }>();

          for (const r of filtered) {
            const uId = String(r.user_id || '');
            const isGuest = Boolean(
              r.is_guest === true ||
              Boolean(r.guest_name) ||
              !uId ||
              uId.startsWith('guest_') ||
              uId.startsWith('anon_') ||
              (r.full_name || '').includes('গেস্ট') ||
              (r.full_name || '').includes('Guest')
            );
            const prof = profilesMap.get(uId);
            const name = r.guest_name || r.full_name || r.user_name || prof?.full_name || 'পরীক্ষার্থী';
            const avatar = r.avatar_url || prof?.avatar_url;
            const points = Number(r.correct_answers ?? r.score ?? 0);
            const totalQ = Number(r.total_marks ?? (Number(r.correct_answers || 0) + Number(r.wrong_answers || 0)) ?? 0);
            const percentage = totalQ > 0 ? (points / totalQ) * 100 : 100;

            const aggKey = (uId && !uId.startsWith('guest_') && !uId.startsWith('anon_')) ? uId : (r.guest_name || name);
            const existing = userAggMap.get(aggKey);
            if (!existing) {
              userAggMap.set(aggKey, {
                user_id: uId,
                full_name: name,
                avatar_url: avatar,
                total_points: points,
                free_exam_count: 1,
                percentageSum: percentage,
              });
            } else {
              existing.total_points += points;
              existing.free_exam_count += 1;
              existing.percentageSum += percentage;
              if (avatar) existing.avatar_url = avatar;
            }
          }

          const userList = Array.from(userAggMap.values()).map((u) => {
            const uId = String(u.user_id || '');
            const isGuest = Boolean(
              !uId ||
              uId.startsWith('guest_') ||
              uId.startsWith('anon_') ||
              u.full_name.includes('গেস্ট') ||
              u.full_name.includes('Guest')
            );
            return {
              user_id: u.user_id,
              full_name: u.full_name,
              avatar_url: u.avatar_url,
              total_points: u.total_points,
              free_exam_count: u.free_exam_count,
              average_percentage: u.free_exam_count > 0 ? Math.round(u.percentageSum / u.free_exam_count) : 0,
              is_guest: isGuest,
            };
          });

          // Sort by total_points DESC, then average_percentage DESC
          userList.sort((a, b) => {
            if (b.total_points !== a.total_points) return b.total_points - a.total_points;
            return b.average_percentage - a.average_percentage;
          });

          return userList.map((u, idx) => ({
            rank: idx + 1,
            ...u,
          }));
        }
      }
    } catch (directErr) {
      console.warn('Direct free leaderboard query error:', directErr);
    }
  }

  // 3. Fetch from Express Server RPC endpoint
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

  // 4. Fallback to computing from local entries
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

  // 2. Fetch directly from Supabase `global_leaderboard` view or `exam_results` table (Sort by score DESC)
  if (supabaseInstance) {
    try {
      let data: any = null;
      let error: any = null;

      // 2A. Try 'global_leaderboard' VIEW first
      try {
        let viewQuery = supabaseInstance
          .from('global_leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .limit(1000);

        if (examId && examId !== 'all') {
          const cleanExamId = examId.trim();
          viewQuery = viewQuery.or(`exam_id.eq.${cleanExamId},exam_title.eq.${cleanExamId},exam_id.ilike.%${cleanExamId}%,exam_title.ilike.%${cleanExamId}%`);
        }

        const viewRes = await fetchWithTimeout(Promise.resolve(viewQuery), 4000, { data: null, error: null } as any);
        if (!viewRes.error && Array.isArray(viewRes.data) && viewRes.data.length > 0) {
          data = viewRes.data;
        }
      } catch {}

      // 2B. If VIEW not present, query `exam_results` table
      if (!data || data.length === 0) {
        let query = supabaseInstance
          .from('exam_results')
          .select('*')
          .order('score', { ascending: false })
          .limit(1000);

        if (examId && examId !== 'all') {
          const cleanExamId = examId.trim();
          query = query.or(`exam_id.eq.${cleanExamId},exam_title.eq.${cleanExamId},exam_id.ilike.%${cleanExamId}%,exam_title.ilike.%${cleanExamId}%`);
        }

        const queryPromise = Promise.resolve(query);
        const timeoutFallback = { data: null, error: { message: 'Timeout' } };
        const directRes = await fetchWithTimeout(queryPromise, 6000, timeoutFallback as any);
        data = directRes.data;
        error = directRes.error;
      }

      if (data && !error && Array.isArray(data) && data.length > 0) {
        // Fetch profiles
        const userIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
        let profilesMap = new Map<string, { full_name?: string; avatar_url?: string }>();
        if (userIds.length > 0) {
          try {
            const { data: profs } = await supabaseInstance
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);
            if (profs && Array.isArray(profs)) {
              profs.forEach((p: any) => {
                if (p.id) profilesMap.set(p.id, p);
              });
            }
          } catch {}
        }

        dbEntries = data.map((item: any) => {
          const prof = profilesMap.get(item.user_id);
          const rawGuest = item.guest_name;
          const uId = String(item.user_id || '');
          const isGuest = Boolean(
            item.is_guest === true ||
            Boolean(rawGuest) ||
            !uId ||
            uId.startsWith('guest_') ||
            uId.startsWith('anon_') ||
            (item.full_name || item.user_name || '').includes('গেস্ট') ||
            (item.full_name || item.user_name || '').includes('Guest')
          );
          const name = rawGuest || item.full_name || item.user_name || prof?.full_name || 'পরীক্ষার্থী';
          const avatar = item.avatar_url || prof?.avatar_url;
          const score = Number(item.score ?? item.correct_answers ?? item.correct_count ?? 0);
          const totalQuestions = Number(item.total_marks ?? (Number(item.correct_answers ?? item.correct_count ?? 0) + Number(item.wrong_answers ?? item.wrong_count ?? 0)) ?? 0);
          const correctCount = Number(item.correct_answers ?? item.correct_count ?? item.score ?? 0);
          const wrongCount = Number(item.wrong_answers ?? item.wrong_count ?? 0);
          const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100;

          return {
            id: String(item.id || `er_${Math.random()}`),
            exam_id: String(item.exam_id || 'general'),
            exam_title: String(item.exam_title || 'মডেল টেস্ট'),
            user_id: item.user_id ? String(item.user_id) : undefined,
            user_name: name,
            guest_name: rawGuest || (isGuest ? name : undefined),
            full_name: item.full_name || name,
            user_avatar: avatar,
            score,
            total_questions: totalQuestions,
            correct_count: correctCount,
            wrong_count: wrongCount,
            accuracy,
            is_guest: isGuest,
            time_taken_seconds: Number(item.time_taken_seconds ?? item.time_taken ?? 0),
            created_at: String(item.submitted_at || item.created_at || new Date().toISOString()),
          };
        });
      } else {
        // Fallback: try `leaderboard_entries` table if exam_results is empty
        try {
          const lbQuery = supabaseInstance
            .from('leaderboard_entries')
            .select('*')
            .order('score', { ascending: false })
            .limit(1000);
          const { data: lbData } = await fetchWithTimeout(Promise.resolve(lbQuery), 5000, { data: null } as any);
          if (lbData && Array.isArray(lbData)) {
            dbEntries = lbData.map((item: any) => ({
              id: String(item.id || `lb_${Math.random()}`),
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
        } catch {}
      }
    } catch (dbErr) {
      console.warn('Supabase fetch error:', dbErr);
    }
  }

  // Combine and deduplicate across server, db, and local: Keep only BEST result per unique participant per exam
  const bestPerExamAndUser = new Map<string, LeaderboardEntry>();
  [...serverEntries, ...dbEntries, ...localEntries].forEach((e) => {
    const isReg = Boolean(e.user_id && !e.user_id.startsWith('guest_') && !e.user_id.startsWith('anon_'));
    const pKey = isReg
      ? String(e.user_id).trim()
      : String(e.guest_name || e.user_name || e.full_name || e.id).trim().toLowerCase();
    const examKey = (e.exam_id || e.exam_title || 'general').trim().toLowerCase();
    const compoundKey = `${examKey}__${pKey}`;

    const existing = bestPerExamAndUser.get(compoundKey);
    if (!existing) {
      bestPerExamAndUser.set(compoundKey, e);
    } else {
      const eScore = Number(e.score || 0);
      const existScore = Number(existing.score || 0);
      if (eScore > existScore) {
        bestPerExamAndUser.set(compoundKey, e);
      } else if (eScore === existScore) {
        const eAcc = Number(e.accuracy || 0);
        const existAcc = Number(existing.accuracy || 0);
        if (eAcc > existAcc) {
          bestPerExamAndUser.set(compoundKey, e);
        } else if (new Date(e.created_at).getTime() > new Date(existing.created_at).getTime()) {
          // Keep latest submission
          bestPerExamAndUser.set(compoundKey, e);
        }
      }
    }
  });

  const mergedList = Array.from(bestPerExamAndUser.values());

  // Sort by score descending (Sort by score DESC)
  mergedList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(mergedList));
  } catch {}

  if (examId && examId !== 'all') {
    return mergedList.filter((e) => {
      const eId = (e.exam_id || '').toLowerCase().trim();
      const eTitle = (e.exam_title || '').toLowerCase().trim();
      const target = examId.toLowerCase().trim();
      return eId === target || eTitle === target || eId.includes(target) || eTitle.includes(target);
    });
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
    // Select all courses directly from Supabase with timeout protection
    const queryPromise = Promise.resolve(supabaseInstance
      .from('courses')
      .select('*'));

    const { data, error } = await fetchWithTimeout(queryPromise, 3500, { data: null, error: { message: 'Network Timeout' } } as any);

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

/**
 * Realtime listener for exam leaderboard / exam results changes
 */
export function subscribeToLeaderboard(onLeaderboardChange: () => void, examId?: string): () => void {
  if (!supabaseInstance) return () => {};

  try {
    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table: 'exam_results',
    };
    if (examId && examId !== 'all') {
      channelConfig.filter = `exam_id=eq.${examId}`;
    }

    const channel = supabaseInstance
      .channel(`leaderboard_live_sync_${examId || 'global'}`)
      .on(
        'postgres_changes',
        channelConfig,
        () => {
          onLeaderboardChange();
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

/**
 * Realtime listener for exams and questions database changes
 */
export function subscribeToExamsAndQuestionsTable(onDataChange: () => void): () => void {
  const handleLocalEvent = () => {
    onDataChange();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tamreen_data_changed', handleLocalEvent);
  }

  if (!supabaseInstance) {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_data_changed', handleLocalEvent);
      }
    };
  }

  try {
    const channel = supabaseInstance
      .channel('exams_and_questions_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        try { localStorage.removeItem('miniquiz_questions_cache'); } catch {}
        onDataChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        try { localStorage.removeItem('miniquiz_exams_cache'); } catch {}
        onDataChange();
      })
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_data_changed', handleLocalEvent);
      }
    };
  } catch {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tamreen_data_changed', handleLocalEvent);
      }
    };
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

  const studentRollNumber = getUserRollNumber(cleanPhone || targetEmail);

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
          student_id: studentRollNumber,
          roll_number: studentRollNumber,
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
          student_id: studentRollNumber,
          roll_number: studentRollNumber,
          avatar_url: avatarUrl || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (profErr) {
      console.warn('public.profiles synchronization notice:', profErr);
    }

    // 3. Synchronize to server user accounts store for instant cross-device phone lookups
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: authUser.id,
        student_id: studentRollNumber,
        roll_number: studentRollNumber,
        rollNumber: studentRollNumber,
        fullName: cleanName,
        phone: cleanPhone || cleanPhoneDigits,
        email: targetEmail,
        password: password,
        avatarUrl: avatarUrl || '',
        role: 'student',
      }),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tamreen_user_roll_number', studentRollNumber);
      } catch {}
    }

    const profileData = {
      id: authUser.id,
      full_name: cleanName,
      phone: cleanPhone || cleanPhoneDigits,
      email: targetEmail,
      role: 'student',
      student_id: studentRollNumber,
      roll_number: studentRollNumber,
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
  const emailsToTry: string[] = [];

  // If input is a phone number, attempt to look up registered email via server or known accounts
  if (isPhone && phoneDigits) {
    const clean11 = phoneDigits.length >= 11 ? phoneDigits.slice(-11) : phoneDigits.padStart(11, '0');
    
    // Check known account mapping
    if (clean11.endsWith('01779834999') || clean11.endsWith('1779834999')) {
      emailsToTry.push('ntrca999@gmail.com');
    }

    try {
      const lookupRes = await fetch(`/api/auth/lookup-phone?phone=${encodeURIComponent(cleanInput)}`);
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData?.success && lookupData?.email && !emailsToTry.includes(lookupData.email)) {
          emailsToTry.unshift(lookupData.email);
        }
      }
    } catch {}

    const alt0 = `student_${clean11}@attamreen.com`;
    const alt1 = `phone_${clean11}@attamreen.com`;
    const alt2 = `${clean11}@attamreen.com`;
    const alt3 = `${clean11}@attamreen.academy`;
    const alt4 = `student_${clean11}@gmail.com`;
    const alt5 = `phone${clean11}@gmail.com`;
    const alt6 = `${clean11}@gmail.com`;

    [alt0, alt1, alt2, alt3, alt4, alt5, alt6].forEach((e) => {
      if (!emailsToTry.includes(e)) emailsToTry.push(e);
    });
  } else {
    emailsToTry.push(email);
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
 * Synchronize user profile from public.profiles table or user_metadata upon successful authentication
 */
export async function syncUserProfileFromSupabase(user: any): Promise<any> {
  if (!user) return null;
  let userProfile: any = null;

  if (supabaseInstance) {
    try {
      const { data: prof, error } = await supabaseInstance
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && prof) {
        userProfile = prof;
      }
    } catch (profErr) {
      console.warn('public.profiles query error:', profErr);
    }
  }

  const userMeta = user.user_metadata || {};
  let localAvatar = '';
  let localName = '';
  let localPhone = '';
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('tamreen_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        localAvatar = parsed.avatar || '';
        localName = parsed.name || '';
        localPhone = parsed.phone || '';
      }
    } catch {}
  }

  let finalFullName = userProfile?.full_name || userMeta.full_name || localName || 'শিক্ষার্থী';
  let finalPhone = userProfile?.phone || userMeta.phone || localPhone || '';
  let finalEmail = userProfile?.email || user.email || '';
  let finalAvatar = userProfile?.avatar_url || userMeta.avatar_url || localAvatar || '';

  // Synchronize cross-browser progress (exams, stats, avatar) from server
  try {
    const qParams = new URLSearchParams({
      userId: user.id,
      phone: finalPhone,
      email: finalEmail,
    });
    const progressRes = await fetch(`/api/user/progress?${qParams.toString()}`);
    if (progressRes.ok) {
      const progressData = await progressRes.json();
      if (progressData?.success) {
        if (progressData.avatarUrl && !finalAvatar) {
          finalAvatar = progressData.avatarUrl;
        }
        if (progressData.fullName && (!finalFullName || finalFullName === 'শিক্ষার্থী')) {
          finalFullName = progressData.fullName;
        }

        if (typeof window !== 'undefined') {
          // Restore completed exams across browsers
          if (Array.isArray(progressData.completedExams) && progressData.completedExams.length > 0) {
            try {
              const currentExams = JSON.parse(localStorage.getItem('tamreen_completed_exams') || '[]');
              const mergedExams = Array.from(new Set([...currentExams, ...progressData.completedExams]));
              localStorage.setItem('tamreen_completed_exams', JSON.stringify(mergedExams));
            } catch {}
          }

          // Restore practice stats across browsers
          if (progressData.studentStats && typeof progressData.studentStats === 'object') {
            try {
              const currentStatsRaw = localStorage.getItem('tamreen_student_stats');
              const currentStats = currentStatsRaw ? JSON.parse(currentStatsRaw) : null;
              if (!currentStats || (progressData.studentStats.totalQuestionsAnswered > (currentStats.totalQuestionsAnswered || 0))) {
                localStorage.setItem('tamreen_student_stats', JSON.stringify(progressData.studentStats));
              }
            } catch {}
          }

          // Restore bookmarks & goal
          if (Array.isArray(progressData.bookmarkedIds) && progressData.bookmarkedIds.length > 0) {
            try {
              const curBm = JSON.parse(localStorage.getItem('tamreen_bookmarked_ids') || '[]');
              const mergedBm = Array.from(new Set([...curBm, ...progressData.bookmarkedIds]));
              localStorage.setItem('tamreen_bookmarked_ids', JSON.stringify(mergedBm));
            } catch {}
          }
          if (progressData.goal) {
            localStorage.setItem('tamreen_user_exam_goal', progressData.goal);
          }
        }
      }
    }
  } catch (syncErr) {
    console.warn('Cross-browser progress sync notice:', syncErr);
  }

  // If localAvatar exists but auth.user metadata was missing it, update metadata in the background
  if (finalAvatar && !userMeta.avatar_url && supabaseInstance) {
    supabaseInstance.auth.updateUser({
      data: { avatar_url: finalAvatar }
    }).catch(() => {});
  }

  const rollNumber = userProfile?.roll_number || userProfile?.student_id || userMeta.roll_number || userMeta.student_id || getUserRollNumber(finalPhone || user.id);

  const profile = {
    id: user.id,
    full_name: finalFullName,
    phone: finalPhone,
    email: finalEmail,
    role: userProfile?.role || userMeta.role || 'student',
    student_id: userMeta.student_id || rollNumber,
    roll_number: rollNumber,
    avatar_url: finalAvatar,
  };

  (user as any).profile = profile;

  // Persist user ID and profile to browser persistent storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tamreen_user_id', user.id);
      localStorage.setItem('tamreen_user_auth_status', 'registered');
      localStorage.setItem('tamreen_user_roll_number', rollNumber);
    } catch {}
  }

  return profile;
}

/**
 * Get current authenticated user profile from Supabase Auth & public.profiles
 */
export async function supabaseGetUser(): Promise<any> {
  if (!supabaseInstance) return null;
  try {
    const { data: { user }, error } = await supabaseInstance.auth.getUser();
    if (error || !user) return null;

    await syncUserProfileFromSupabase(user);
    return user;
  } catch {
    return null;
  }
}

/**
 * Update authenticated user profile in Supabase Auth and cloud server store
 */
export async function supabaseUpdateUserProfile(updates: {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
}): Promise<boolean> {
  let success = false;
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance.auth.updateUser({
        data: {
          ...(updates.fullName ? { full_name: updates.fullName } : {}),
          ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
          ...(updates.phone ? { phone: updates.phone } : {}),
        },
      });
      if (!error && data?.user) {
        success = true;
      }
    } catch (err) {
      console.warn('Supabase auth.updateUser error:', err);
    }
  }

  // Also sync to server user progress
  try {
    let userId = '';
    if (typeof window !== 'undefined') {
      userId = localStorage.getItem('tamreen_user_id') || '';
    }
    await fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        phone: updates.phone || '',
        fullName: updates.fullName || '',
        avatarUrl: updates.avatarUrl || '',
      }),
    });
  } catch {}

  return success;
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
    rollNumber: string;
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
    rollNumber: string;
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
          const roll = p.roll_number || p.student_id || getUserRollNumber(p.phone || p.id);
          resultMap.set(p.id, {
            id: p.id,
            fullName: p.full_name || 'শিক্ষার্থী',
            phone: p.phone || '',
            email: p.email || '',
            rollNumber: roll,
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
            const roll = u.rollNumber || u.roll_number || u.student_id || getUserRollNumber(u.phone || u.id);
            resultMap.set(u.id || u.student_id, {
              id: u.id || u.student_id,
              fullName: u.fullName || u.full_name || 'শিক্ষার্থী',
              phone: u.phone || '',
              email: u.email || '',
              rollNumber: roll,
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

/**
 * Dynamic Subject Posts & Syllabus Topics Management
 * Fetches custom posts and syllabus topics created from Admin Panel from Supabase or local cache,
 * combining them seamlessly with the default built-in posts. Also seeds default posts to Supabase if empty.
 */
export async function fetchSubjectPostsFromSupabase(): Promise<MainSubjectPost[]> {
  const fallback = MAIN_SUBJECT_POSTS;
  
  // 1. Immediately read local cache if available so UI doesn't delay
  let cached: MainSubjectPost[] | null = null;
  try {
    const raw = localStorage.getItem('tamreen_custom_subject_posts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) cached = parsed;
    }
  } catch {}

  if (supabaseInstance) {
    try {
      const queryPromise = Promise.resolve(supabaseInstance
        .from('subject_posts')
        .select('*')
        .order('created_at', { ascending: true }));

      const { data, error } = await fetchWithTimeout(queryPromise, 3500, { data: null, error: { message: 'Timeout' } } as any);

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const dynamicPosts: MainSubjectPost[] = data.map((item: any) => {
            let topicsList: string[] = [];
            if (Array.isArray(item.topics)) {
              topicsList = item.topics;
            } else if (typeof item.topics === 'string') {
              try {
                topicsList = JSON.parse(item.topics);
              } catch {
                topicsList = item.topics.split(',').map((t: string) => t.trim()).filter(Boolean);
              }
            }

            return {
              id: String(item.id || item.slug || `post_${Date.now()}`),
              name: item.name || item.title || 'বিষয়ভিত্তিক প্রস্তুতি',
              code: item.code || item.post_code || '---',
              tagline: item.tagline || '',
              badge: item.badge || `${item.name || ''} • কোড: ${item.code || ''}`,
              subtitle: item.subtitle || '',
              iconName: item.icon_name || item.iconName || 'BookOpenCheck',
              themeColor: item.theme_color || item.themeColor || '#6366F1',
              accentGradient: item.accent_gradient || item.accentGradient || 'from-[#6366F1] to-[#4338CA]',
              gradientClass: item.gradient_class || item.gradientClass || 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-indigo-500/25',
              topics: topicsList.length > 0 ? topicsList : ['সাধারণ অনুশীলন ও বিষয়ভিত্তিক প্রশ্নব্যাংক'],
              description: item.description || '',
            };
          });

          // Store cached
          try {
            localStorage.setItem('tamreen_custom_subject_posts', JSON.stringify(dynamicPosts));
          } catch {}

          return dynamicPosts;
        } else {
          // Table exists but empty, seed the initial 6 posts automatically in background
          try {
            const seedPayload = MAIN_SUBJECT_POSTS.map(post => ({
              id: post.id,
              name: post.name,
              code: post.code,
              tagline: post.tagline,
              badge: post.badge,
              subtitle: post.subtitle,
              icon_name: post.iconName,
              theme_color: post.themeColor,
              accent_gradient: post.accentGradient,
              gradient_class: post.gradientClass,
              topics: post.topics,
              description: post.description
            }));

            supabaseInstance.from('subject_posts').upsert(seedPayload, { onConflict: 'id' }).then(() => {});
          } catch (seedErr) {
            console.warn('Auto-seeding default posts to Supabase failed:', seedErr);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch subject_posts from Supabase, checking local cache:', err);
    }
  }

  return cached || fallback;
}

// =========================================================================
// QUESTION INTERACTIONS: LIKES, BOOKMARKS, REPORTS & COMMUNITY EXPLANATIONS
// =========================================================================

/**
 * Helper to get the effective authenticated Supabase user ID or client identifier
 */
export async function getEffectiveAuthUserId(fallbackUserId?: string): Promise<string> {
  if (supabaseInstance) {
    try {
      const { data } = await supabaseInstance.auth.getSession();
      if (data?.session?.user?.id) {
        return data.session.user.id;
      }
    } catch {}
  }
  if (fallbackUserId && fallbackUserId.trim()) {
    return fallbackUserId.trim();
  }
  if (typeof window !== 'undefined') {
    const savedId = localStorage.getItem('tamreen_user_id');
    if (savedId && savedId.trim()) return savedId.trim();
  }
  const prof = getUserProfile();
  if (prof?.student_id) return prof.student_id;
  return getUserUniqueId();
}

/**
 * Fetch total likes count for a specific question
 */
export async function fetchQuestionLikesCount(questionId: string | number): Promise<number> {
  const qId = String(questionId).trim();
  if (supabaseInstance) {
    try {
      const { count, error } = await supabaseInstance
        .from('question_likes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', qId);
      if (!error && typeof count === 'number') {
        setLocalQuestionLikeCount(qId, count);
        return count;
      }
    } catch {}
  }

  // Fallback to server API
  try {
    const res = await fetch(`/api/questions/likes?questionId=${encodeURIComponent(qId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && typeof json.likeCount === 'number') {
        setLocalQuestionLikeCount(qId, json.likeCount);
        return json.likeCount;
      }
    }
  } catch {}

  return getLocalQuestionLikeCount(qId);
}

/**
 * Fetch all question IDs liked by a user
 */
export async function fetchUserLikedQuestionIds(userId?: string): Promise<string[]> {
  const uId = await getEffectiveAuthUserId(userId);
  const candidateIds = Array.from(new Set([
    uId,
    userId,
    getUserUniqueId(),
    getUserProfile()?.student_id
  ].filter(Boolean) as string[]));

  // Get local cache
  const cached = getLikedIds();

  if (supabaseInstance && candidateIds.length > 0) {
    try {
      const orFilter = candidateIds.map((id) => `user_id.eq.${id}`).join(',');
      const { data, error } = await supabaseInstance
        .from('question_likes')
        .select('question_id')
        .or(orFilter);
      if (!error && Array.isArray(data)) {
        const dbIds = data.map((item: any) => String(item.question_id).trim()).filter(Boolean);
        const combined = Array.from(new Set([...cached, ...dbIds]));
        try {
          localStorage.setItem('tamreen_user_liked_question_ids', JSON.stringify(combined));
          localStorage.setItem(`tamreen_liked_ids_${uId}`, JSON.stringify(combined));
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids: combined } }));
        }
        return combined;
      }
    } catch (err) {
      console.warn('Supabase fetchUserLikedQuestionIds notice:', err);
    }
  }

  // Fallback to server API
  try {
    const res = await fetch(`/api/questions/likes?userId=${encodeURIComponent(uId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.likedQuestionIds)) {
        const srvIds = json.likedQuestionIds.map((id: any) => String(id).trim()).filter(Boolean);
        const combined = Array.from(new Set([...cached, ...srvIds]));
        try {
          localStorage.setItem('tamreen_user_liked_question_ids', JSON.stringify(combined));
          localStorage.setItem(`tamreen_liked_ids_${uId}`, JSON.stringify(combined));
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids: combined } }));
        }
        return combined;
      }
    }
  } catch {}

  return cached;
}

/**
 * Toggle like for a question (Add or Remove)
 */
export async function toggleQuestionLikeInSupabase(
  questionId: string | number,
  userId?: string,
  userName?: string
): Promise<{ isLiked: boolean; newCount: number }> {
  const qId = String(questionId).trim();
  const uId = await getEffectiveAuthUserId(userId);
  const clientName = userName || getUserProfile()?.name || 'শিক্ষার্থী';

  // 1. Update local cache optimistically
  const currentLiked = getLikedIds();
  const isCurrentlyLiked = currentLiked.includes(qId);
  const nextLiked = isCurrentlyLiked
    ? currentLiked.filter((id) => id !== qId)
    : [...currentLiked, qId];

  try {
    localStorage.setItem('tamreen_user_liked_question_ids', JSON.stringify(nextLiked));
    localStorage.setItem(`tamreen_liked_ids_${uId}`, JSON.stringify(nextLiked));
  } catch {}

  let finalIsLiked = !isCurrentlyLiked;
  let finalCount = getLocalQuestionLikeCount(qId);
  finalCount = isCurrentlyLiked ? Math.max(0, finalCount - 1) : finalCount + 1;
  setLocalQuestionLikeCount(qId, finalCount);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids: nextLiked } }));
  }

  // 2. Sync to Supabase
  if (supabaseInstance) {
    try {
      if (isCurrentlyLiked) {
        // Delete like
        await supabaseInstance
          .from('question_likes')
          .delete()
          .match({ question_id: qId, user_id: uId });
        finalIsLiked = false;
      } else {
        // Insert like
        await supabaseInstance.from('question_likes').insert([
          {
            question_id: qId,
            user_id: uId,
            user_name: clientName,
            created_at: new Date().toISOString(),
          },
        ]);
        finalIsLiked = true;
      }

      // Fetch updated count
      const { count } = await supabaseInstance
        .from('question_likes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', qId);
      if (typeof count === 'number') {
        finalCount = count;
        setLocalQuestionLikeCount(qId, finalCount);
      }
    } catch (sbErr) {
      console.warn('Supabase toggle like error, using server fallback:', sbErr);
    }
  }

  // 3. Always sync to server API
  try {
    const res = await fetch('/api/questions/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: qId, user_id: uId, user_name: clientName }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        finalIsLiked = json.isLiked;
        if (typeof json.likeCount === 'number') {
          finalCount = json.likeCount;
          setLocalQuestionLikeCount(qId, finalCount);
        }
      }
    }
  } catch {}

  return { isLiked: finalIsLiked, newCount: finalCount };
}

/**
 * Fetch all question IDs bookmarked by a user from Supabase / server
 */
export async function fetchUserBookmarkedQuestionIds(userId?: string): Promise<string[]> {
  const uId = await getEffectiveAuthUserId(userId);
  const candidateIds = Array.from(new Set([
    uId,
    userId,
    getUserUniqueId(),
    getUserProfile()?.student_id
  ].filter(Boolean) as string[]));

  // Try local storage cache
  const cached = getBookmarkedIds();

  if (supabaseInstance && candidateIds.length > 0) {
    try {
      const orFilter = candidateIds.map((id) => `user_id.eq.${id}`).join(',');
      const { data, error } = await supabaseInstance
        .from('question_bookmarks')
        .select('question_id')
        .or(orFilter);
      if (!error && Array.isArray(data)) {
        const dbIds = data.map((item: any) => String(item.question_id).trim()).filter(Boolean);
        const combined = Array.from(new Set([...cached, ...dbIds]));
        try {
          localStorage.setItem('tamreen_bookmarked_ids', JSON.stringify(combined));
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids: combined } }));
        }
        return combined;
      }
    } catch (sbErr) {
      console.warn('Supabase fetchUserBookmarkedQuestionIds notice:', sbErr);
    }
  }

  // Fallback to server API
  try {
    const res = await fetch(`/api/questions/bookmarks?userId=${encodeURIComponent(uId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.bookmarkedQuestionIds)) {
        const srvIds = json.bookmarkedQuestionIds.map((id: any) => String(id).trim()).filter(Boolean);
        const combined = Array.from(new Set([...cached, ...srvIds]));
        try {
          localStorage.setItem('tamreen_bookmarked_ids', JSON.stringify(combined));
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids: combined } }));
        }
        return combined;
      }
    }
  } catch {}

  return cached;
}

/**
 * Toggle bookmark for a question in Supabase & Server
 */
export async function toggleQuestionBookmarkInSupabase(
  questionId: string | number,
  userId?: string
): Promise<{ isBookmarked: boolean }> {
  const qId = String(questionId).trim();
  const uId = await getEffectiveAuthUserId(userId);

  const currentBookmarked = getBookmarkedIds();
  const isCurrentlyBookmarked = currentBookmarked.includes(qId);
  const nextBookmarked = isCurrentlyBookmarked
    ? currentBookmarked.filter((id) => id !== qId)
    : [...currentBookmarked, qId];

  try {
    localStorage.setItem('tamreen_bookmarked_ids', JSON.stringify(nextBookmarked));
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids: nextBookmarked } }));
  }

  let finalIsBookmarked = !isCurrentlyBookmarked;

  if (supabaseInstance) {
    try {
      if (isCurrentlyBookmarked) {
        await supabaseInstance
          .from('question_bookmarks')
          .delete()
          .match({ question_id: qId, user_id: uId });
        finalIsBookmarked = false;
      } else {
        await supabaseInstance.from('question_bookmarks').insert([
          {
            question_id: qId,
            user_id: uId,
            created_at: new Date().toISOString(),
          },
        ]);
        finalIsBookmarked = true;
      }
    } catch (sbErr) {
      console.warn('Supabase toggle bookmark error, fallback to server:', sbErr);
    }
  }

  // Always sync to server API
  try {
    const res = await fetch('/api/questions/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: qId, user_id: uId }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && typeof json.isBookmarked === 'boolean') {
        finalIsBookmarked = json.isBookmarked;
      }
    }
  } catch {}

  return { isBookmarked: finalIsBookmarked };
}

/**
 * Submit a question report to Supabase & Server
 */
export async function submitQuestionReportToSupabase(report: {
  question_id: string | number;
  user_id?: string;
  user_name?: string;
  phone?: string;
  email?: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  const payload = {
    question_id: String(report.question_id).trim(),
    user_id: report.user_id ? String(report.user_id).trim() : null,
    user_name: report.user_name || 'শিক্ষার্থী',
    phone: report.phone || null,
    email: report.email || null,
    reason: report.reason,
    details: report.details || null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  if (supabaseInstance) {
    try {
      const { error } = await supabaseInstance.from('question_reports').insert([payload]);
      if (!error) {
        // Also fire and forget to server
        fetch('/api/questions/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Supabase submit question report error:', err);
    }
  }

  // Server API fallback
  try {
    const res = await fetch('/api/questions/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে।' };
  }

  return { success: true };
}

/**
 * Fetch community explanations for a question from Supabase & Server
 */
export async function fetchQuestionCommunityExplanations(
  questionId: string | number
): Promise<QuestionCommunityExplanation[]> {
  const qId = String(questionId).trim();

  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance
        .from('question_explanations')
        .select('*')
        .eq('question_id', qId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((item: any) => ({
          id: String(item.id),
          question_id: String(item.question_id),
          user_id: item.user_id ? String(item.user_id) : undefined,
          author_name: String(item.author_name || 'শিক্ষার্থী'),
          author_avatar: item.author_avatar ? String(item.author_avatar) : undefined,
          explanation: String(item.explanation || ''),
          likes_count: Number(item.likes_count || 0),
          status: (item.status || 'approved') as any,
          created_at: String(item.created_at || new Date().toISOString()),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch explanations error:', err);
    }
  }

  // Server API fallback
  try {
    const res = await fetch(`/api/questions/explanations?question_id=${encodeURIComponent(qId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.explanations)) {
        return json.explanations;
      }
    }
  } catch {}

  return [];
}

/**
 * Submit a community explanation to Supabase & Server
 */
export async function submitQuestionCommunityExplanation(explanation: {
  question_id: string | number;
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  explanation: string;
}): Promise<{ success: boolean; newExplanation?: QuestionCommunityExplanation; error?: string }> {
  const payload = {
    question_id: String(explanation.question_id).trim(),
    user_id: explanation.user_id ? String(explanation.user_id).trim() : null,
    author_name: explanation.author_name.trim() || 'শিক্ষার্থী',
    author_avatar: explanation.author_avatar || null,
    explanation: explanation.explanation.trim(),
    likes_count: 0,
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  let savedItem: QuestionCommunityExplanation | undefined;

  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance
        .from('question_explanations')
        .insert([payload])
        .select();

      if (!error && Array.isArray(data) && data[0]) {
        const item = data[0];
        savedItem = {
          id: String(item.id),
          question_id: String(item.question_id),
          user_id: item.user_id ? String(item.user_id) : undefined,
          author_name: String(item.author_name),
          author_avatar: item.author_avatar ? String(item.author_avatar) : undefined,
          explanation: String(item.explanation),
          likes_count: Number(item.likes_count || 0),
          status: item.status || 'approved',
          created_at: String(item.created_at),
        };
      }
    } catch (err) {
      console.warn('Supabase submit explanation error:', err);
    }
  }

  // Also send to server API
  try {
    const res = await fetch('/api/questions/explanations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.item) {
        if (!savedItem) savedItem = json.item;
        return { success: true, newExplanation: savedItem };
      }
    }
  } catch (err: any) {
    if (!savedItem) {
      return { success: false, error: err?.message || 'ব্যাখ্যা সংরক্ষণ করা সম্ভব হয়নি।' };
    }
  }

  if (savedItem) {
    return { success: true, newExplanation: savedItem };
  }

  // Construct local fallback object if network saved
  const fallbackItem: QuestionCommunityExplanation = {
    id: `expl_${Date.now()}`,
    question_id: String(explanation.question_id),
    user_id: explanation.user_id,
    author_name: explanation.author_name,
    author_avatar: explanation.author_avatar,
    explanation: explanation.explanation,
    likes_count: 0,
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  return { success: true, newExplanation: fallbackItem };
}

export async function customPhoneLoginOrRegister(
  fullName: string,
  phone: string,
  email?: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const cleanPhone = (phone || '').trim();
    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanPhone || !cleanName) {
      return { success: false, error: 'নাম এবং মোবাইল নম্বর প্রদান করা আবশ্যক।' };
    }

    if (!supabaseInstance) {
      return { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি।' };
    }

    // 1. Check if phone exists
    const { data: existingProfile, error: searchError } = await supabaseInstance
      .from('profiles')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (searchError) {
      console.warn('Phone lookup error:', searchError);
    }

    if (existingProfile) {
      // 2. User exists: return existing data and roll number
      const roll = existingProfile.roll_number || existingProfile.student_id || getUserRollNumber(cleanPhone);
      return {
        success: true,
        user: {
          id: existingProfile.id,
          full_name: existingProfile.full_name,
          phone: existingProfile.phone,
          email: existingProfile.email,
          role: existingProfile.role || 'student',
          roll_number: roll,
          student_id: roll,
          avatar_url: existingProfile.avatar_url || ''
        }
      };
    }

    // 3. New User
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newRoll = getUserRollNumber(cleanPhone); // TM-XXXXXX
    const newProfile = {
      id: newId,
      full_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail || null,
      role: 'student',
      roll_number: newRoll,
      student_id: newRoll,
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseInstance
      .from('profiles')
      .insert([newProfile]);

    if (insertError) {
      return { success: false, error: 'প্রোফাইল তৈরি করতে সমস্যা হয়েছে: ' + insertError.message };
    }

    return {
      success: true,
      user: newProfile
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'একটি ত্রুটি ঘটেছে।' };
  }
}
