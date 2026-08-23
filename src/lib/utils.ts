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
 * Formats a date string into Bengali date with day of the week, e.g. "১১ আগস্ট ২০২৬, মঙ্গলবার"
 */
export function formatBengaliDateWithDay(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) {
    return 'আজকের মডেল টেস্ট';
  }
  const bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const bengaliDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  const dayNum = toBengaliNumeral(date.getDate());
  const monthName = bengaliMonths[date.getMonth()];
  const yearNum = toBengaliNumeral(date.getFullYear());
  const dayName = bengaliDays[date.getDay()];

  return `${dayNum} ${monthName} ${yearNum}, ${dayName}`;
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

  // Cross-browser progress sync to cloud server
  try {
    const uId = getUserUniqueId();
    const prof = getUserProfile();
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uId,
        phone: prof?.phone || '',
        email: prof?.email || '',
        fullName: prof?.name || '',
        studentStats: updated,
      }),
    }).catch(() => {});
  } catch {}

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
  email?: string;
  isRegistered?: boolean;
}

export function isUserRegistered(): boolean {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    if (!parsed || !parsed.name) return false;
    if (parsed.isRegistered === true) return true;
    if (parsed.phone && parsed.phone.trim().length >= 6) return true;
    if (parsed.email && parsed.email.includes('@') && !parsed.email.endsWith('@attamreen.academy')) return true;
    const authStatus = localStorage.getItem('tamreen_user_auth_status');
    if (authStatus === 'registered' || authStatus === 'logged_in') return true;
    return false;
  } catch {
    return false;
  }
}

export function getUserUniqueId(): string {
  try {
    let uId = localStorage.getItem('tamreen_user_id');
    if (!uId) {
      uId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('tamreen_user_id', uId);
    }
    return uId;
  } catch {
    return `usr_temp_${Math.random().toString(36).substring(2, 9)}`;
  }
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
        email: parsed.email || '',
        isRegistered: Boolean(parsed.isRegistered || (parsed.phone && parsed.phone.length >= 6)),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveUserProfile(
  name: string, 
  phone: string = '', 
  avatar?: string, 
  isRegistered: boolean = true, 
  email?: string
): UserProfile {
  const previousProfile = getUserProfile();
  const oldName = previousProfile?.name?.trim()?.toLowerCase();

  const profile: UserProfile = {
    name: name.trim(),
    phone: phone ? phone.trim() : '',
    avatar: avatar || '',
    email: email || '',
    isRegistered: isRegistered,
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (isRegistered) {
      localStorage.setItem('tamreen_user_auth_status', 'registered');
    }
  } catch {
    // ignore localstorage errors
  }

  // Also update existing local leaderboard entries for this user
  try {
    const rawLb = localStorage.getItem('tamreen_leaderboard_entries');
    if (rawLb) {
      const entries: any[] = JSON.parse(rawLb);
      let updated = false;
      const newNameClean = name.trim();
      const newAvatarClean = avatar || '';

      entries.forEach((entry) => {
        const eName = (entry.user_name || '').trim().toLowerCase();
        // Match old profile name or current name
        if (!oldName || eName === oldName || eName === newNameClean.toLowerCase()) {
          entry.user_name = newNameClean;
          entry.user_avatar = newAvatarClean;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('tamreen_leaderboard_entries', JSON.stringify(entries));
      }
    }
  } catch {}

  // Update profile on shared server leaderboard as well
  try {
    fetch('/api/leaderboard/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldName: previousProfile?.name?.trim() || '',
        newName: name.trim(),
        newAvatar: avatar || '',
      }),
    }).catch(() => {});
  } catch {}

  // Sync profile to cloud server progress store
  try {
    const uId = getUserUniqueId();
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uId,
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        fullName: name.trim(),
        avatarUrl: avatar || '',
      }),
    }).catch(() => {});
  } catch {}

  // Broadcast events for real-time UI refresh across windows/components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tamreen_profile_updated', { detail: profile }));
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('tamreen_leaderboard_channel');
        bc.postMessage({ type: 'PROFILE_UPDATED', profile });
        bc.close();
      } catch {}
    }
  }

  return profile;
}

export function clearUserProfile(): void {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem('tamreen_user_auth_status');
    localStorage.removeItem('tamreen_auth_token');
    localStorage.removeItem('supabase_auth_session');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tamreen_profile_updated'));
    window.dispatchEvent(new Event('tamreen_auth_status_changed'));
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('tamreen_leaderboard_channel');
        bc.postMessage({ type: 'AUTH_LOGOUT' });
        bc.close();
      } catch {}
    }
  }
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

    // Cross-browser progress sync to cloud server
    try {
      const uId = getUserUniqueId();
      const prof = getUserProfile();
      fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uId,
          phone: prof?.phone || '',
          email: prof?.email || '',
          fullName: prof?.name || '',
          completedExamId: examIdentifier,
        }),
      }).catch(() => {});
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_exam_completed', { detail: { examIdentifier } }));
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
 * Premium Membership Status Helper
 */
const PREMIUM_STORAGE_KEY = 'tamreen_is_premium';

export function isUserPremium(): boolean {
  try {
    const status = localStorage.getItem('tamreen_premium_status');
    if (status === 'approved') return true;
    if (status === 'pending' || status === 'rejected') return false;

    const data = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (data === null) return true; // Default for preview
    return data === 'true';
  } catch {
    return true;
  }
}

export function setUserPremium(isPremium: boolean): void {
  try {
    localStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');
    localStorage.setItem('tamreen_premium_status', isPremium ? 'approved' : 'none');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_premium_updated', { detail: isPremium }));
      window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: isPremium ? 'approved' : 'none' }));
    }
  } catch {}
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

/**
 * Formats a course price cleanly ensuring the Taka symbol (৳) appears exactly once.
 * Handles strings that already contain '৳', English/Bengali digits, and free indicators.
 * E.g., '৳৯৫০' -> '৳৯৫০', '৯৫০' -> '৳৯৫০', '৳ 950' -> '৳৯৫০', 950 -> '৳৯৫০', '0' -> 'বিনামূল্যে'
 */
export function formatCoursePrice(price?: string | number | null): string {
  if (price === null || price === undefined || price === '') {
    return '৳৯৫০';
  }
  const str = String(price).trim();
  if (str === '০' || str === '0' || str === 'ফ্রি' || str === 'বিনামূল্যে') {
    return 'বিনামূল্যে';
  }
  // Strip any leading ৳, Tk, TK, টাকা and extra whitespace/symbols
  const cleanStr = str.replace(/^(৳|Tk\.?|TK\.?|টাকা)\s*/gi, '').trim();
  if (!cleanStr) return '৳৯৫০';
  return `৳${toBengaliNumeral(cleanStr)}`;
}

/**
 * Returns clean price digits/amount without currency symbol for transaction payloads
 */
export function getCleanPriceAmount(price?: string | number | null): string {
  if (price === null || price === undefined || price === '') {
    return '৯৫০';
  }
  const str = String(price).trim();
  const cleanStr = str.replace(/^(৳|Tk\.?|TK\.?|টাকা)\s*/gi, '').trim();
  return cleanStr ? toBengaliNumeral(cleanStr) : '৯৫০';
}



