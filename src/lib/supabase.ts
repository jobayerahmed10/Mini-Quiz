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

/**
 * Fetches published questions from Supabase table 'public.questions'
 * Only fetches rows where status = 'published'
 */
export async function fetchPublishedQuestions(): Promise<FetchQuestionsResult> {
  if (!supabaseInstance) {
    return {
      questions: [],
      isFromSupabase: false,
      error: 'Supabase এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই। VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY আপনার .env ফাইলে প্রদান করুন।',
    };
  }

  try {
    const { data, error } = await supabaseInstance
      .from('questions')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        questions: [],
        isFromSupabase: true,
        error: `Supabase কুয়েরি ত্রুটি: ${error.message} (Code: ${error.code || 'N/A'})`,
      };
    }

    if (!data || data.length === 0) {
      return {
        questions: [],
        isFromSupabase: true,
        error: null,
      };
    }

    // Cast & format fetched items from public.questions with subject auto-detection fallback
    const questionsList: Question[] = data.map((item) => {
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

    return {
      questions: questionsList,
      isFromSupabase: true,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    return {
      questions: [],
      isFromSupabase: true,
      error: `Supabase সংযোগ ত্রুটি: ${errorMsg}`,
    };
  }
}



