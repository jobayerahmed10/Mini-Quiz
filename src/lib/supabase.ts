import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question } from '../types';
import { SAMPLE_QUESTIONS } from '../data/sampleQuestions';

// Access env vars safely for both Vite (import.meta.env) and Next.js (process.env)
const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env || {};
const procEnv = (typeof process !== 'undefined' && process.env) || {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabaseUrl !== 'MY_SUPABASE_URL'
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
 * Fetches published questions from Supabase table 'questions'
 * Only fetches rows where status = 'published'
 */
export async function fetchPublishedQuestions(allowDemoFallback: boolean = true): Promise<FetchQuestionsResult> {
  if (!supabaseInstance) {
    if (allowDemoFallback) {
      // In preview/demo mode when Supabase is not connected yet, return sample questions
      return {
        questions: SAMPLE_QUESTIONS,
        isFromSupabase: false,
        error: 'Supabase URL & Anon Key সেটআপ করা হয়নি। ডেমো প্রশ্ন দেখানো হচ্ছে।',
      };
    }
    return {
      questions: [],
      isFromSupabase: false,
      error: 'Supabase credentials missing.',
    };
  }

  try {
    const { data, error } = await supabaseInstance
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      if (allowDemoFallback) {
        return {
          questions: SAMPLE_QUESTIONS,
          isFromSupabase: false,
          error: `Supabase ত্রুটি: ${error.message}। ডেমো প্রশ্ন ব্যবহার করা হচ্ছে।`,
        };
      }
      return {
        questions: [],
        isFromSupabase: true,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        questions: [],
        isFromSupabase: true,
        error: null,
      };
    }

    // Cast & format fetched items
    const questionsList: Question[] = data.map((item) => ({
      id: item.id,
      question: item.question,
      option_a: item.option_a,
      option_b: item.option_b,
      option_c: item.option_c,
      option_d: item.option_d,
      correct_answer: item.correct_answer,
      explanation: item.explanation || null,
      status: item.status || 'published',
      created_at: item.created_at,
    }));

    return {
      questions: questionsList,
      isFromSupabase: true,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    if (allowDemoFallback) {
      return {
        questions: SAMPLE_QUESTIONS,
        isFromSupabase: false,
        error: `সংযোগ ত্রুটি: ${errorMsg}। ডেমো প্রশ্ন দেখানো হচ্ছে।`,
      };
    }
    return {
      questions: [],
      isFromSupabase: false,
      error: errorMsg,
    };
  }
}
