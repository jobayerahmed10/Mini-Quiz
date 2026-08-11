import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question } from '../types';
import { detectQuestionSubject } from './subjects';

/**
 * Safely retrieve Supabase configuration.
 * For this Vite project:
 * Primary: import.meta.env.VITE_SUPABASE_URL & import.meta.env.VITE_SUPABASE_ANON_KEY
 * Fallbacks: process.env or NEXT_PUBLIC_* variables
 */
const getSupabaseUrl = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_URL) return metaEnv.VITE_SUPABASE_URL;
    if (metaEnv.NEXT_PUBLIC_SUPABASE_URL) return metaEnv.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  return '';
};

const getSupabaseAnonKey = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_ANON_KEY) return metaEnv.VITE_SUPABASE_ANON_KEY;
    if (metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) return metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return '';
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
    const existingIndex = current.findIndex(
      (item) => item.id === entry.id || (item.user_name === entry.user_name && item.exam_id === entry.exam_id && item.score === entry.score)
    );
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

  if (!supabaseInstance) {
    return { success: true };
  }

  try {
    const record = {
      id: entry.id,
      exam_id: entry.exam_id,
      exam_title: entry.exam_title,
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

  if (!supabaseInstance) {
    if (examId && examId !== 'all') {
      return localEntries.filter(
        (e) => e.exam_id === examId || e.exam_title === examId
      );
    }
    return localEntries;
  }

  try {
    let query = supabaseInstance
      .from('leaderboard_entries')
      .select('*')
      .order('score', { ascending: false })
      .order('accuracy', { ascending: false });

    if (examId && examId !== 'all') {
      query = query.or(`exam_id.eq.${examId},exam_title.eq.${examId}`);
    }

    const queryPromise = Promise.resolve(query);
    const timeoutFallback = { data: null, error: { message: 'Timeout' } };
    const { data, error } = await fetchWithTimeout(queryPromise, 6000, timeoutFallback as any);

    if (error || !data) {
      if (examId && examId !== 'all') {
        return localEntries.filter((e) => e.exam_id === examId || e.exam_title === examId);
      }
      return localEntries;
    }

    const dbEntries: LeaderboardEntry[] = data.map((item: any) => ({
      id: String(item.id || `db_${Math.random()}`),
      exam_id: String(item.exam_id || 'general'),
      exam_title: String(item.exam_title || 'পরীক্ষা'),
      user_name: String(item.user_name || 'পরীক্ষার্থী'),
      user_avatar: item.user_avatar ? String(item.user_avatar) : undefined,
      score: Number(item.score || 0),
      total_questions: Number(item.total_questions || 0),
      correct_count: Number(item.correct_count || 0),
      wrong_count: Number(item.wrong_count || 0),
      accuracy: Number(item.accuracy || 0),
      created_at: String(item.created_at || new Date().toISOString()),
    }));

    const mergedMap = new Map<string, LeaderboardEntry>();
    [...dbEntries, ...localEntries].forEach((e) => {
      const key = e.id || `${e.user_name}_${e.exam_id}_${e.score}_${e.created_at}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, e);
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
  } catch {
    if (examId && examId !== 'all') {
      return localEntries.filter((e) => e.exam_id === examId || e.exam_title === examId);
    }
    return localEntries;
  }
}




