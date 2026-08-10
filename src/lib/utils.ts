import { QuizResult } from '../types';

/**
 * Removes Arabic Tashkeel / Harakat (diacritics) from text
 * Includes: Fathan, Damman, Kasran, Fatha, Damma, Kasra, Sukun, Shadda, Maddah, Dagger Alif, Quranic signs
 */
export function removeHarakat(text: string): string {
  if (!text) return '';
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/**
 * Format text according to harakat display setting
 */
export function formatArabicText(text: string, showHarakat: boolean = true): string {
  if (!text) return '';
  if (showHarakat) return text;
  return removeHarakat(text);
}

/**
 * Converts English digits (0-9) to Bengali digits (০-৯)
 */
export function toBengaliNumeral(number: number | string): string {
  if (number === null || number === undefined) return '';
  const str = number.toString();
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

/**
 * Option key to Bengali Prefix mapping
 */
export const OPTION_BENGLI_LABEL: Record<string, string> = {
  option_a: 'ক',
  option_b: 'খ',
  option_c: 'গ',
  option_d: 'ঘ',
};

/**
 * Normalizes any variation of correct_answer from database into standard 'option_a' | 'option_b' | 'option_c' | 'option_d'
 */
export function normalizeCorrectOption(rawCorrect: string, optionA: string, optionB: string, optionC: string, optionD: string): 'option_a' | 'option_b' | 'option_c' | 'option_d' {
  if (!rawCorrect) return 'option_a';
  const trimmed = rawCorrect.trim().toLowerCase();

  // Explicit option keys
  if (trimmed === 'option_a' || trimmed === 'optiona' || trimmed === 'a' || trimmed === 'ক' || trimmed === '1') {
    return 'option_a';
  }
  if (trimmed === 'option_b' || trimmed === 'optionb' || trimmed === 'b' || trimmed === 'খ' || trimmed === '2') {
    return 'option_b';
  }
  if (trimmed === 'option_c' || trimmed === 'optionc' || trimmed === 'c' || trimmed === 'গ' || trimmed === '3') {
    return 'option_c';
  }
  if (trimmed === 'option_d' || trimmed === 'optiond' || trimmed === 'd' || trimmed === 'ঘ' || trimmed === '4') {
    return 'option_d';
  }

  // Exact option text match
  if (rawCorrect === optionA) return 'option_a';
  if (rawCorrect === optionB) return 'option_b';
  if (rawCorrect === optionC) return 'option_c';
  if (rawCorrect === optionD) return 'option_d';

  return 'option_a';
}

/**
 * LocalStorage keys for student practice analytics
 */
const STATS_STORAGE_KEY = 'miniquiz_student_stats';

export interface StudentStats {
  todayPracticeCount: number;
  lastPracticeDate: string;
  totalQuestionsAnswered: number;
  lastQuizScore: {
    correct: number;
    total: number;
    percentage: number;
    date: string;
  } | null;
}

export function getStudentStats(): StudentStats {
  try {
    const data = localStorage.getItem(STATS_STORAGE_KEY);
    if (!data) {
      return {
        todayPracticeCount: 0,
        lastPracticeDate: new Date().toISOString().split('T')[0],
        totalQuestionsAnswered: 0,
        lastQuizScore: null,
      };
    }
    const parsed: StudentStats = JSON.parse(data);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset today's count if date changed
    if (parsed.lastPracticeDate !== todayStr) {
      parsed.todayPracticeCount = 0;
      parsed.lastPracticeDate = todayStr;
    }
    return parsed;
  } catch {
    return {
      todayPracticeCount: 0,
      lastPracticeDate: new Date().toISOString().split('T')[0],
      totalQuestionsAnswered: 0,
      lastQuizScore: null,
    };
  }
}

export function saveQuizResultToStats(correctCount: number, totalQuestions: number): StudentStats {
  const current = getStudentStats();
  const todayStr = new Date().toISOString().split('T')[0];
  const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);

  const updated: StudentStats = {
    todayPracticeCount: (current.todayPracticeCount || 0) + totalQuestions,
    lastPracticeDate: todayStr,
    totalQuestionsAnswered: (current.totalQuestionsAnswered || 0) + totalQuestions,
    lastQuizScore: {
      correct: correctCount,
      total: totalQuestions,
      percentage,
      date: new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
  };

  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore localstorage errors
  }
  return updated;
}

/**
 * User Profile interface & Storage Key
 */
const PROFILE_STORAGE_KEY = 'tamreen_user_profile';

export interface UserProfile {
  name: string;
  phone: string;
  avatar?: string;
}

export function getUserProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
      return {
        name: parsed.name.trim(),
        phone: parsed.phone ? parsed.phone.trim() : '',
        avatar: parsed.avatar || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveUserProfile(name: string, phone: string, avatar?: string): UserProfile {
  const profile: UserProfile = {
    name: name.trim(),
    phone: phone.trim(),
    avatar: avatar || '',
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore localstorage errors
  }
  return profile;
}

/**
 * Completed Exam Tracking Storage
 */
const COMPLETED_EXAMS_KEY = 'tamreen_completed_exams';

export function getCompletedExamIds(): string[] {
  try {
    const data = localStorage.getItem(COMPLETED_EXAMS_KEY);
    if (!data) return [];
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}

export function addCompletedExamId(examIdentifier: string): void {
  if (!examIdentifier) return;
  const current = getCompletedExamIds();
  if (!current.includes(examIdentifier)) {
    current.push(examIdentifier);
    try {
      localStorage.setItem(COMPLETED_EXAMS_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}

export function isExamCompleted(examId: string, examTitle?: string): boolean {
  const completedList = getCompletedExamIds();
  if (examId && completedList.includes(examId)) return true;
  if (examTitle && completedList.includes(examTitle)) return true;
  return false;
}

/**
 * Saved Exam Results Storage
 */
const SAVED_EXAM_RESULTS_KEY = 'tamreen_saved_exam_results';

export function saveExamResult(examIdentifier: string, result: QuizResult): void {
  if (!result) return;
  try {
    const raw = localStorage.getItem(SAVED_EXAM_RESULTS_KEY);
    const map: Record<string, QuizResult> = raw ? JSON.parse(raw) : {};
    if (examIdentifier) {
      map[examIdentifier] = result;
    }
    if (result.selectedSubject) {
      map[result.selectedSubject] = result;
    }
    map['latest_exam_result'] = result;
    localStorage.setItem(SAVED_EXAM_RESULTS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getExamResult(examIdentifier?: string): QuizResult | null {
  try {
    const raw = localStorage.getItem(SAVED_EXAM_RESULTS_KEY);
    if (!raw) return null;
    const map: Record<string, QuizResult> = JSON.parse(raw);
    if (examIdentifier && map[examIdentifier]) {
      return map[examIdentifier];
    }
    return map['latest_exam_result'] || null;
  } catch {
    return null;
  }
}

/**
 * Bookmarked Questions Storage
 */
const BOOKMARKS_KEY = 'tamreen_bookmarked_ids';

export function getBookmarkedIds(): string[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkId(id: string): boolean {
  const list = getBookmarkedIds();
  const idx = list.indexOf(id);
  let isSaved = false;
  if (idx >= 0) {
    list.splice(idx, 1);
    isSaved = false;
  } else {
    list.push(id);
    isSaved = true;
  }
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return isSaved;
}

/**
 * User Exam Target / Goal Storage
 */
const GOAL_STORAGE_KEY = 'tamreen_user_exam_goal';

export function getUserGoal(): string {
  try {
    return localStorage.getItem(GOAL_STORAGE_KEY) || '১৮তম শিক্ষক নিবন্ধন প্রিলি/ভাইভা';
  } catch {
    return '১৮তম শিক্ষক নিবন্ধন প্রিলি/ভাইভা';
  }
}

export function saveUserGoal(goal: string): void {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, goal);
  } catch {
    // ignore
  }
}

/**
 * User Practice Streak
 */
const STREAK_KEY = 'tamreen_user_streak';

export function getUserStreakDays(): number {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    if (!data) return 14; // Default baseline streak for demo
    return parseInt(data, 10) || 14;
  } catch {
    return 14;
  }
}

/**
 * Determines if text is FULLY Arabic (has Arabic letters and NO Bengali or English letters).
 * If a question/option starts with 1 or 2 Arabic words but is followed by Bengali or English text, returns false.
 */
export function isFullyArabic(text?: string): boolean {
  if (!text) return false;
  // If text contains any Bengali character or English/Latin character, it's NOT fully Arabic
  if (/[\u0980-\u09FFa-zA-Z]/.test(text)) {
    return false;
  }
  // Must contain Arabic characters
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/**
 * Check if text or subject has Arabic characters
 */
export function isArabicText(text?: string, subject?: string): boolean {
  if (subject && (subject.includes('আরবি') || subject.toLowerCase().includes('arabic') || subject.includes('কোরআন') || subject.includes('হাদিস'))) {
    return true;
  }
  if (!text) return false;
  // Match Arabic unicode range
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}


