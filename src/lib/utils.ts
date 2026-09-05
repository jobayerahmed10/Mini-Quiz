import { QuizResult, Question } from '../types';

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
export function normalizeCorrectOption(
  rawCorrect: string | number | null | undefined,
  optionA: string = '',
  optionB: string = '',
  optionC: string = '',
  optionD: string = ''
): 'option_a' | 'option_b' | 'option_c' | 'option_d' {
  if (rawCorrect === null || rawCorrect === undefined) return 'option_a';

  // 1. If it's a numeric type (0-based: 0=option_a, 1=option_b, 2=option_c, 3=option_d)
  if (typeof rawCorrect === 'number') {
    if (rawCorrect === 0) return 'option_a';
    if (rawCorrect === 1) return 'option_b';
    if (rawCorrect === 2) return 'option_c';
    if (rawCorrect === 3) return 'option_d';
    if (rawCorrect === 4) return 'option_d';
  }

  const rawStr = String(rawCorrect).trim();
  if (!rawStr) return 'option_a';

  const lower = rawStr.toLowerCase();
  // Clean parentheses, brackets, dots, colons, trailing/leading whitespace e.g. "(ক)", "ক)", "a.", "1.", "[b]"
  const cleaned = lower.replace(/^[\(\[\s]+|[\)\]\.\:\s]+$/g, '').trim();

  // 2. Direct option key match
  if (['option_a', 'optiona', 'a', 'ক', '0', 'ans_a', 'answera', 'answer_a'].includes(cleaned)) return 'option_a';
  if (['option_b', 'optionb', 'b', 'খ', 'ans_b', 'answerb', 'answer_b'].includes(cleaned)) return 'option_b';
  if (['option_c', 'optionc', 'c', 'গ', 'ans_c', 'answerc', 'answer_c'].includes(cleaned)) return 'option_c';
  if (['option_d', 'optiond', 'd', 'ঘ', 'ans_d', 'answerd', 'answer_d'].includes(cleaned)) return 'option_d';

  // Numeric strings '1','2','3','4'
  if (cleaned === '1') return 'option_a';
  if (cleaned === '2') return 'option_b';
  if (cleaned === '3') return 'option_c';
  if (cleaned === '4') return 'option_d';

  // 3. Exact option text match (Normalized text matching)
  const normRaw = lower.replace(/\s+/g, ' ');
  const normA = String(optionA || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normB = String(optionB || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normC = String(optionC || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normD = String(optionD || '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (normRaw && normA && normRaw === normA) return 'option_a';
  if (normRaw && normB && normRaw === normB) return 'option_b';
  if (normRaw && normC && normRaw === normC) return 'option_c';
  if (normRaw && normD && normRaw === normD) return 'option_d';

  // 4. Substring matching if rawCorrect contains option text or vice versa
  if (normRaw && normA && (normRaw.includes(normA) || normA.includes(normRaw))) return 'option_a';
  if (normRaw && normB && (normRaw.includes(normB) || normB.includes(normRaw))) return 'option_b';
  if (normRaw && normC && (normRaw.includes(normC) || normC.includes(normRaw))) return 'option_c';
  if (normRaw && normD && (normRaw.includes(normD) || normD.includes(normRaw))) return 'option_d';

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
        lastPracticeDate: '',
        totalQuestionsAnswered: 0,
        lastQuizScore: null,
      };
    }
    const parsed: StudentStats = JSON.parse(data);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset today's count if date changed
    if (parsed.lastPracticeDate && parsed.lastPracticeDate !== todayStr) {
      parsed.todayPracticeCount = 0;
      parsed.lastPracticeDate = todayStr;
    }
    return parsed;
  } catch {
    return {
      todayPracticeCount: 0,
      lastPracticeDate: '',
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
    // Update streak if practicing today
    incrementUserStreak();
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
const USER_ROLL_KEY = 'tamreen_user_roll_number';

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  avatar?: string;
  email?: string;
  isRegistered?: boolean;
  student_id?: string;
  roll_number?: string;
}

export function getUserRollNumber(phone?: string): string {
  try {
    const cachedRoll = localStorage.getItem(USER_ROLL_KEY);
    if (cachedRoll && cachedRoll.trim().length > 0) {
      return cachedRoll.trim();
    }
    const prof = getUserProfile();
    if (prof?.roll_number) {
      localStorage.setItem(USER_ROLL_KEY, prof.roll_number);
      return prof.roll_number;
    }
    if (prof?.student_id) {
      localStorage.setItem(USER_ROLL_KEY, prof.student_id);
      return prof.student_id;
    }

    // Generate clean unique 6-digit roll
    const cleanDigits = (phone || '').replace(/[^0-9]/g, '');
    const suffix = cleanDigits.length >= 6 ? cleanDigits.slice(-6) : Math.floor(100000 + Math.random() * 900000);
    const newRoll = `TM-${suffix}`;
    localStorage.setItem(USER_ROLL_KEY, newRoll);
    return newRoll;
  } catch {
    return `TM-${Math.floor(100000 + Math.random() * 900000)}`;
  }
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

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getGuestDeviceId(): string {
  try {
    let devId = localStorage.getItem('tamreen_guest_device_id');
    if (!devId) {
      devId = 'guest_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      localStorage.setItem('tamreen_guest_device_id', devId);
    }
    return devId;
  } catch {
    return 'guest_device_' + Date.now();
  }
}

export function getUserUniqueId(): string {
  try {
    const prof = getUserProfile();
    if (prof) {
      const pid = (prof as any).id || prof.roll_number || prof.student_id;
      if (pid && String(pid).trim().length > 0) {
        return String(pid).trim();
      }
    }
    let uId = localStorage.getItem('tamreen_user_id');
    if (uId && uId.trim().length > 0 && uId !== 'undefined' && uId !== 'null') {
      return uId.trim();
    }
    uId = getGuestDeviceId();
    localStorage.setItem('tamreen_user_id', uId);
    return uId;
  } catch {
    return getGuestDeviceId();
  }
}

export async function compressAndResizeAvatar(
  file: File,
  maxDimension: number = 280,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(readerEvent.target?.result as string);
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
}

export function getUserProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
      const roll = parsed.roll_number || parsed.student_id || getUserRollNumber(parsed.phone);
      const storedId = parsed.id || (typeof window !== 'undefined' ? localStorage.getItem('tamreen_user_id') : undefined) || undefined;
      const isAuthRegistered = typeof window !== 'undefined' && localStorage.getItem('tamreen_user_auth_status') === 'registered';
      return {
        id: storedId,
        name: parsed.name.trim(),
        phone: parsed.phone ? parsed.phone.trim() : '',
        avatar: parsed.avatar || '',
        email: parsed.email || '',
        isRegistered: Boolean(parsed.isRegistered || (parsed.phone && parsed.phone.length >= 6) || isAuthRegistered),
        student_id: roll,
        roll_number: roll,
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
  email?: string,
  rollNumber?: string,
  userId?: string
): UserProfile {
  const previousProfile = getUserProfile();

  // If avatar is provided as a non-empty string, use it; otherwise preserve existing avatar
  const finalAvatar = (avatar && avatar.trim().length > 0) ? avatar.trim() : (previousProfile?.avatar || '');
  const finalRoll = rollNumber || previousProfile?.roll_number || previousProfile?.student_id || getUserRollNumber(phone);
  const finalId = userId || previousProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('tamreen_user_id') : undefined) || undefined;

  const profile: UserProfile = {
    id: finalId,
    name: name.trim(),
    phone: phone ? phone.trim() : (previousProfile?.phone || ''),
    avatar: finalAvatar,
    email: email !== undefined ? email : (previousProfile?.email || ''),
    isRegistered: isRegistered,
    student_id: finalRoll,
    roll_number: finalRoll,
  };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (finalRoll) {
      localStorage.setItem(USER_ROLL_KEY, finalRoll);
    }
    if (finalId) {
      localStorage.setItem('tamreen_user_id', finalId);
    }
    if (isRegistered) {
      localStorage.setItem('tamreen_user_auth_status', 'registered');
    }
  } catch {
    // ignore localstorage errors
  }

  // Update registered user's avatar or profile on shared server leaderboard
  try {
    const currentUId = getUserUniqueId();
    if (isRegistered && currentUId && !currentUId.startsWith('guest_') && !currentUId.startsWith('anon_')) {
      fetch('/api/leaderboard/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUId,
          newName: name.trim(),
          newAvatar: finalAvatar,
          phone: phone ? phone.trim() : (previousProfile?.phone || ''),
          email: email !== undefined ? email : (previousProfile?.email || ''),
          rollNumber: finalRoll,
        }),
      }).catch(() => {});
    }
  } catch {}

  // Sync profile to cloud server progress store
  try {
    const uId = getUserUniqueId();
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uId,
        phone: phone ? phone.trim() : (previousProfile?.phone || ''),
        email: email ? email.trim() : (previousProfile?.email || ''),
        fullName: name.trim(),
        avatarUrl: finalAvatar,
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

export function clearGuestExamSession(): void {
  try {
    localStorage.removeItem('tamreen_guest_device_id');
    localStorage.removeItem('tamreen_completed_exams');
    localStorage.removeItem('tamreen_saved_exam_results');
    localStorage.removeItem('tamreen_exam_history_list');
    localStorage.removeItem('tamreen_student_stats');
    localStorage.removeItem('miniquiz_student_stats');
    localStorage.removeItem('tamreen_wrong_answers_bank');
    localStorage.removeItem('tamreen_exam_completion_times');
    localStorage.removeItem('tamreen_total_exams_count');
  } catch {
    // ignore
  }
}

export function clearUserProfile(): void {
  try {
    clearGuestExamSession();
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(USER_ROLL_KEY);
    localStorage.removeItem('tamreen_user_auth_status');
    localStorage.removeItem('tamreen_auth_token');
    localStorage.removeItem('supabase_auth_session');
    localStorage.removeItem('tamreen_completed_exams');
    localStorage.removeItem('tamreen_saved_exam_results');
    localStorage.removeItem('tamreen_exam_history_list');
    localStorage.removeItem('tamreen_wrong_answers_bank');
    localStorage.removeItem('tamreen_user_exam_goal');
    localStorage.removeItem('tamreen_user_id');
    localStorage.removeItem('miniquiz_student_stats');
    localStorage.removeItem('tamreen_user_streak');
    localStorage.removeItem('tamreen_last_streak_date');
    localStorage.removeItem('tamreen_enrollments');
    localStorage.removeItem('tamreen_user_enrollments');
    localStorage.removeItem('tamreen_bookmarked_ids');
    localStorage.removeItem('tamreen_bookmarked_questions');
    localStorage.removeItem('tamreen_user_liked_question_ids');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tamreen_profile_updated'));
    window.dispatchEvent(new Event('tamreen_auth_status_changed'));
    window.dispatchEvent(new CustomEvent('tamreen_exam_completed', { detail: {} }));
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
const COMPLETION_TIMES_KEY = 'tamreen_exam_completion_times';

export function getCompletionTimes(): Record<string, string> {
  try {
    const data = localStorage.getItem(COMPLETION_TIMES_KEY);
    if (!data) return {};
    return JSON.parse(data) || {};
  } catch {
    return {};
  }
}

export function resetExamAttemptCache(examIdentifier: string): void {
  if (!examIdentifier) return;
  try {
    const current = getCompletedExamIds();
    const updated = current.filter(id => id !== examIdentifier && id !== String(examIdentifier));
    localStorage.setItem(COMPLETED_EXAMS_KEY, JSON.stringify(updated));

    const times = getCompletionTimes();
    delete times[examIdentifier];
    localStorage.setItem(COMPLETION_TIMES_KEY, JSON.stringify(times));

    const rawResults = localStorage.getItem(SAVED_EXAM_RESULTS_KEY);
    if (rawResults) {
      const map = JSON.parse(rawResults);
      delete map[examIdentifier];
      localStorage.setItem(SAVED_EXAM_RESULTS_KEY, JSON.stringify(map));
    }
  } catch {}
}

const TOTAL_EXAMS_COUNT_KEY = 'tamreen_total_exams_count';

export function getTotalExamsCount(): number {
  try {
    const val = localStorage.getItem(TOTAL_EXAMS_COUNT_KEY);
    const count = val ? parseInt(val, 10) : 0;
    const completedList = getCompletedExamIds();
    return Math.max(isNaN(count) ? 0 : count, completedList.length);
  } catch {
    return 0;
  }
}

export function incrementTotalExamsCount(): number {
  try {
    const current = getTotalExamsCount();
    const nextCount = current + 1;
    localStorage.setItem(TOTAL_EXAMS_COUNT_KEY, String(nextCount));
    
    // Also update profile object in localStorage if present
    const profData = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profData) {
      try {
        const parsed = JSON.parse(profData);
        parsed.total_exams = (parsed.total_exams || 0) + 1;
        parsed.totalExams = (parsed.totalExams || 0) + 1;
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_profile_updated'));
    }
    return nextCount;
  } catch {
    return 1;
  }
}

export function getCompletedExamIds(): string[] {
  try {
    const data = localStorage.getItem(COMPLETED_EXAMS_KEY);
    const list: string[] = data ? (JSON.parse(data) || []) : [];
    
    // Merge keys from SAVED_EXAM_RESULTS_KEY map for 100% local coverage
    const savedRaw = localStorage.getItem(SAVED_EXAM_RESULTS_KEY);
    if (savedRaw) {
      try {
        const map = JSON.parse(savedRaw);
        if (map && typeof map === 'object') {
          Object.keys(map).forEach((k) => {
            if (k && k !== 'latest_exam_result' && !list.includes(k)) {
              list.push(k);
            }
          });
        }
      } catch {}
    }
    return list;
  } catch {
    return [];
  }
}

export function addCompletedExamId(examIdentifier: string): void {
  if (!examIdentifier) return;
  const current = getCompletedExamIds();
  const times = getCompletionTimes();
  times[examIdentifier] = new Date().toISOString();
  try {
    localStorage.setItem(COMPLETION_TIMES_KEY, JSON.stringify(times));
  } catch {}

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
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tamreen_exam_completed', { detail: { examIdentifier } }));
  }
}

export const markExamCompleted = addCompletedExamId;

export function isExamCompleted(examId?: string | number | null, examTitle?: string | null): boolean {
  const completedList = getCompletedExamIds();
  if (!completedList || completedList.length === 0) return false;

  const targetId = examId !== undefined && examId !== null ? String(examId).trim().toLowerCase() : '';
  const targetTitle = examTitle ? String(examTitle).trim().toLowerCase() : '';

  if (!targetId && !targetTitle) return false;

  return completedList.some(item => {
    if (item === undefined || item === null) return false;
    const cleanItem = String(item).trim().toLowerCase();
    if (!cleanItem) return false;
    if (targetId && cleanItem === targetId) return true;
    if (targetTitle && cleanItem === targetTitle) return true;
    if (targetId && (cleanItem.endsWith(`_${targetId}`) || cleanItem.endsWith(`-${targetId}`) || cleanItem.startsWith(`${targetId}_`) || cleanItem.startsWith(`${targetId}-`))) return true;
    if (targetTitle && cleanItem.includes(targetTitle)) return true;
    return false;
  });
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
 * Bookmarked & Liked Questions Storage
 */
const BOOKMARKS_KEY = 'tamreen_bookmarked_ids';
const BOOKMARKED_QUESTIONS_KEY = 'tamreen_bookmarked_questions_store';
const LIKES_KEY = 'tamreen_user_liked_question_ids';
const LIKED_QUESTIONS_KEY = 'tamreen_liked_questions_store';
const QUESTION_LIKE_COUNTS_KEY = 'tamreen_question_like_counts';

export function getBookmarkedIds(): string[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSavedBookmarkedQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveBookmarkedQuestion(q: Question): void {
  if (!q || !q.id) return;
  try {
    const list = getSavedBookmarkedQuestions();
    const existingIdx = list.findIndex((item) => String(item.id) === String(q.id));
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...q };
    } else {
      list.unshift(q);
    }
    localStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(list));

    const ids = getBookmarkedIds();
    const idStr = String(q.id);
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids, questions: list } }));
    }
  } catch {}
}

export function removeBookmarkedQuestion(id: string | number): void {
  const idStr = String(id);
  try {
    const list = getSavedBookmarkedQuestions().filter((q) => String(q.id) !== idStr);
    localStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(list));

    const ids = getBookmarkedIds().filter((qId) => qId !== idStr);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids, questions: list } }));
    }
  } catch {}
}

export function toggleBookmarkId(id: string, questionObj?: Question): boolean {
  const list = getBookmarkedIds();
  const idx = list.indexOf(id);
  let isSaved = false;
  if (idx >= 0) {
    list.splice(idx, 1);
    isSaved = false;
    if (questionObj) {
      removeBookmarkedQuestion(id);
    }
  } else {
    list.push(id);
    isSaved = true;
    if (questionObj) {
      saveBookmarkedQuestion(questionObj);
    }
  }
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_bookmarks_updated', { detail: { ids: list } }));
    }
  } catch {
    // ignore
  }
  return isSaved;
}

// Liked Questions Helpers
export function getLikedIds(): string[] {
  try {
    const data = localStorage.getItem(LIKES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSavedLikedQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(LIKED_QUESTIONS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLikedQuestion(q: Question): void {
  if (!q || !q.id) return;
  try {
    const list = getSavedLikedQuestions();
    const existingIdx = list.findIndex((item) => String(item.id) === String(q.id));
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...q };
    } else {
      list.unshift(q);
    }
    localStorage.setItem(LIKED_QUESTIONS_KEY, JSON.stringify(list));

    const ids = getLikedIds();
    const idStr = String(q.id);
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      localStorage.setItem(LIKES_KEY, JSON.stringify(ids));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids, questions: list } }));
    }
  } catch {}
}

export function removeLikedQuestion(id: string | number): void {
  const idStr = String(id);
  try {
    const list = getSavedLikedQuestions().filter((q) => String(q.id) !== idStr);
    localStorage.setItem(LIKED_QUESTIONS_KEY, JSON.stringify(list));

    const ids = getLikedIds().filter((qId) => qId !== idStr);
    localStorage.setItem(LIKES_KEY, JSON.stringify(ids));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids, questions: list } }));
    }
  } catch {}
}

export function getLocalQuestionLikeCount(id: string | number): number {
  try {
    const raw = localStorage.getItem(QUESTION_LIKE_COUNTS_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw);
    return typeof map[String(id)] === 'number' ? map[String(id)] : 0;
  } catch {
    return 0;
  }
}

export function setLocalQuestionLikeCount(id: string | number, count: number): void {
  try {
    const raw = localStorage.getItem(QUESTION_LIKE_COUNTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[String(id)] = Math.max(0, count);
    localStorage.setItem(QUESTION_LIKE_COUNTS_KEY, JSON.stringify(map));
  } catch {}
}

export function toggleLikedId(id: string, questionObj?: Question): { isLiked: boolean; newCount: number } {
  const list = getLikedIds();
  const idx = list.indexOf(id);
  let isLiked = false;
  let currentCount = getLocalQuestionLikeCount(id);

  if (idx >= 0) {
    list.splice(idx, 1);
    isLiked = false;
    currentCount = Math.max(0, currentCount - 1);
    if (questionObj) {
      removeLikedQuestion(id);
    }
  } else {
    list.push(id);
    isLiked = true;
    currentCount = Math.max(1, currentCount + 1);
    if (questionObj) {
      saveLikedQuestion(questionObj);
    }
  }

  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(list));
    setLocalQuestionLikeCount(id, currentCount);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_likes_updated', { detail: { ids: list, questionId: id, count: currentCount } }));
    }
  } catch {}

  return { isLiked, newCount: currentCount };
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
const LAST_STREAK_DATE_KEY = 'tamreen_last_streak_date';

export function getUserStreakDays(): number {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    if (!data) return 0; // 0 days for new accounts
    return parseInt(data, 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementUserStreak(): number {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(LAST_STREAK_DATE_KEY);
    const currentStreak = getUserStreakDays();

    if (lastDate === todayStr) {
      return currentStreak; // Already counted today
    }

    let newStreak = 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1; // Broken streak reset
      }
    }

    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(LAST_STREAK_DATE_KEY, todayStr);
    return newStreak;
  } catch {
    return 1;
  }
}

/**
 * Full Exam History Persistence
 */
const EXAM_HISTORY_KEY = 'tamreen_exam_history_list';

export function getSavedExamHistory(): QuizResult[] {
  try {
    const raw = localStorage.getItem(EXAM_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveExamToHistory(result: QuizResult): void {
  try {
    const history = getSavedExamHistory();
    // Prepend latest exam at the top, keep last 50
    const updated = [result, ...history].slice(0, 50);
    localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Real Wrong Answers Persistence (ভুল উত্তরের ব্যাংক)
 */
const WRONG_ANSWERS_KEY = 'tamreen_wrong_answers_bank';

export interface SavedWrongQuestion {
  questionId: string | number;
  questionText: string;
  subject?: string | null;
  options: {
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
  };
  selectedOption: string | null;
  correctOption: string;
  explanation?: string | null;
  examTitle?: string | null;
  savedAt: string;
}

export function getSavedWrongQuestions(): SavedWrongQuestion[] {
  try {
    const raw = localStorage.getItem(WRONG_ANSWERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveWrongAnswersFromQuiz(quizResult: QuizResult): void {
  try {
    if (!quizResult.userAnswers || quizResult.userAnswers.length === 0) return;
    const existing = getSavedWrongQuestions();
    const existingIds = new Set(existing.map((q) => String(q.questionId)));

    const newWrong: SavedWrongQuestion[] = [];
    quizResult.userAnswers.forEach((ans) => {
      if (!ans.isCorrect && !existingIds.has(String(ans.questionId))) {
        newWrong.push({
          questionId: ans.questionId,
          questionText: ans.questionText,
          subject: ans.subject || quizResult.selectedSubject || null,
          options: ans.options,
          selectedOption: ans.selectedOption,
          correctOption: ans.correctOption,
          explanation: ans.explanation,
          examTitle: quizResult.examTitle,
          savedAt: new Date().toISOString(),
        });
        existingIds.add(String(ans.questionId));
      }
    });

    if (newWrong.length > 0) {
      const combined = [...newWrong, ...existing].slice(0, 100);
      localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify(combined));
    }
  } catch {
    // ignore
  }
}

export function removeSavedWrongQuestion(questionId: string | number): void {
  try {
    const existing = getSavedWrongQuestions();
    const filtered = existing.filter((q) => String(q.questionId) !== String(questionId));
    localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/**
 * Overall Accuracy and Best Exam Metrics
 */
export function calculateRealUserMetrics(): {
  totalExams: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  bestExamsCount: number;
  subjectStats: Record<string, { total: number; correct: number }>;
} {
  const history = getSavedExamHistory();
  const completedIds = getCompletedExamIds();
  const studentStats = getStudentStats();
  const subjectStats: Record<string, { total: number; correct: number }> = {};

  if (history.length === 0 && (studentStats.totalQuestionsAnswered || 0) === 0) {
    return {
      totalExams: completedIds.length,
      totalQuestions: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      bestExamsCount: 0,
      subjectStats: {},
    };
  }

  let totalQuestions = 0;
  let totalCorrect = 0;
  let bestExams = 0;

  if (history.length > 0) {
    history.forEach((h) => {
      totalQuestions += h.totalQuestions || 0;
      totalCorrect += h.correctCount || 0;
      if (h.percentage >= 80) {
        bestExams += 1;
      }
      if (h.userAnswers && Array.isArray(h.userAnswers)) {
        h.userAnswers.forEach((ans) => {
          const subj = ans.subject || h.selectedSubject || 'অন্যান্য';
          if (!subjectStats[subj]) {
            subjectStats[subj] = { total: 0, correct: 0 };
          }
          subjectStats[subj].total += 1;
          if (ans.isCorrect) {
            subjectStats[subj].correct += 1;
          }
        });
      }
    });
  } else if (studentStats.totalQuestionsAnswered > 0) {
    totalQuestions = studentStats.totalQuestionsAnswered;
    totalCorrect = studentStats.lastQuizScore ? studentStats.lastQuizScore.correct : 0;
  }

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    totalExams: Math.max(completedIds.length, history.length),
    totalQuestions: Math.max(totalQuestions, studentStats.totalQuestionsAnswered || 0),
    totalCorrect,
    overallAccuracy: accuracy,
    bestExamsCount: bestExams,
    subjectStats,
  };
}

/**
 * Premium Membership & Post-Specific Package Access Helpers
 */
const PREMIUM_STORAGE_KEY = 'tamreen_is_premium';
const UNLOCKED_POSTS_KEY = 'tamreen_unlocked_posts';
const PENDING_POSTS_KEY = 'tamreen_pending_posts';

export function getUnlockedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_POSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const status = localStorage.getItem('tamreen_premium_status');
    if (status === 'approved') {
      // By default if full premium is approved, all posts are unlocked
      return ['arabic_lecturer', 'assistant_moulvi', 'assistant_moulvi_qari', 'ebtedayee_moulvi', 'ebtedayee_qari', 'general_subjects'];
    }
    return [];
  } catch {
    return [];
  }
}

export function isPostUnlocked(postId: string): boolean {
  if (!postId) return false;
  const unlocked = getUnlockedPostIds();
  return unlocked.includes(postId);
}

export function unlockPosts(postIds: string[]): void {
  try {
    const current = getUnlockedPostIds();
    const updated = Array.from(new Set([...current, ...postIds]));
    localStorage.setItem(UNLOCKED_POSTS_KEY, JSON.stringify(updated));
    // Remove from pending
    const pending = getPendingPostIds().filter(id => !postIds.includes(id));
    localStorage.setItem(PENDING_POSTS_KEY, JSON.stringify(pending));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_unlocked_posts_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: updated.length > 0 ? 'approved' : 'none' }));
    }
  } catch {}
}

export function getPendingPostIds(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_POSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const status = localStorage.getItem('tamreen_premium_status');
    if (status === 'pending') {
      return ['assistant_moulvi'];
    }
    return [];
  } catch {
    return [];
  }
}

export function isPostPending(postId: string): boolean {
  if (!postId) return false;
  const pending = getPendingPostIds();
  return pending.includes(postId);
}

export function setPendingPosts(postIds: string[]): void {
  try {
    const current = getPendingPostIds();
    const updated = Array.from(new Set([...current, ...postIds]));
    localStorage.setItem(PENDING_POSTS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_unlocked_posts_updated', { detail: updated }));
    }
  } catch {}
}

export function isUserPremium(): boolean {
  try {
    const status = localStorage.getItem('tamreen_premium_status');
    if (status === 'approved') return true;
    if (status === 'pending' || status === 'rejected') return false;

    const unlocked = getUnlockedPostIds();
    if (unlocked.length > 0) return true;

    const data = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (data === null) return false;
    return data === 'true';
  } catch {
    return false;
  }
}

export function setUserPremium(isPremium: boolean): void {
  try {
    localStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');
    localStorage.setItem('tamreen_premium_status', isPremium ? 'approved' : 'none');
    if (isPremium) {
      unlockPosts(['arabic_lecturer', 'assistant_moulvi', 'assistant_moulvi_qari', 'ebtedayee_moulvi', 'ebtedayee_qari', 'general_subjects']);
    } else {
      localStorage.setItem(UNLOCKED_POSTS_KEY, JSON.stringify([]));
      localStorage.setItem(PENDING_POSTS_KEY, JSON.stringify([]));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamreen_premium_updated', { detail: isPremium }));
      window.dispatchEvent(new CustomEvent('tamreen_premium_status_changed', { detail: isPremium ? 'approved' : 'none' }));
      window.dispatchEvent(new CustomEvent('tamreen_unlocked_posts_updated', { detail: isPremium ? ['arabic_lecturer', 'assistant_moulvi', 'assistant_moulvi_qari', 'ebtedayee_moulvi', 'ebtedayee_qari', 'general_subjects'] : [] }));
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



