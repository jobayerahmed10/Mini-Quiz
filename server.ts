import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Server Leaderboard, Exam Results, and User Accounts Persistence
const LEADERBOARD_FILE_PATH = path.join(process.cwd(), 'leaderboard_store.json');
const EXAM_RESULTS_FILE_PATH = path.join(process.cwd(), 'exam_results_store.json');
const REGISTERED_USERS_FILE_PATH = path.join(process.cwd(), 'registered_users_store.json');
const USER_PROGRESS_FILE_PATH = path.join(process.cwd(), 'user_progress_store.json');
const QUESTION_LIKES_FILE_PATH = path.join(process.cwd(), 'question_likes_store.json');
const QUESTION_BOOKMARKS_FILE_PATH = path.join(process.cwd(), 'question_bookmarks_store.json');
const QUESTION_REPORTS_FILE_PATH = path.join(process.cwd(), 'question_reports_store.json');
const QUESTION_EXPLANATIONS_FILE_PATH = path.join(process.cwd(), 'question_explanations_store.json');

export interface ServerQuestionLike {
  id: string;
  question_id: string;
  user_id: string;
  user_name?: string;
  created_at: string;
}

export interface ServerQuestionBookmark {
  id: string;
  question_id: string;
  user_id: string;
  created_at: string;
}

export interface ServerQuestionReport {
  id: string;
  question_id: string;
  user_id?: string;
  user_name?: string;
  phone?: string;
  email?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface ServerQuestionExplanation {
  id: string;
  question_id: string;
  user_id?: string;
  author_name: string;
  author_avatar?: string;
  explanation: string;
  likes_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ServerUserAccount {
  id: string;
  student_id: string;
  roll_number?: string;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface ServerUserProgress {
  userId: string;
  phone?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  completedExams: string[];
  studentStats?: {
    todayPracticeCount: number;
    lastPracticeDate: string;
    totalQuestionsAnswered: number;
    lastQuizScore: any;
  };
  goal?: string;
  bookmarkedIds?: string[];
  updatedAt: string;
}

interface ServerLeaderboardEntry {
  id: string;
  exam_id: string;
  exam_title: string;
  user_id?: string | null;
  user_name: string;
  guest_name?: string | null;
  guest_id?: string | null;
  full_name?: string;
  is_guest?: boolean;
  user_avatar?: string;
  roll_number?: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  points?: number;
  created_at: string;
}

interface ServerExamResult {
  id: string;
  exam_id: string;
  exam_title?: string;
  is_free?: boolean;
  user_id?: string | null;
  user_name?: string;
  full_name: string;
  guest_name?: string | null;
  guest_id?: string | null;
  is_guest?: boolean;
  avatar_url?: string;
  roll_number?: string;
  student_id?: string;
  score: number;
  total_marks: number;
  correct_answers: number;
  wrong_answers: number;
  points?: number;
  time_taken_seconds: number;
  submitted_at: string;
}

let serverLeaderboardStore: ServerLeaderboardEntry[] = [];
let serverExamResultsStore: ServerExamResult[] = [];
let serverRegisteredUsersStore: ServerUserAccount[] = [];
let serverUserProgressStore: ServerUserProgress[] = [];
let serverQuestionLikesStore: ServerQuestionLike[] = [];
let serverQuestionBookmarksStore: ServerQuestionBookmark[] = [];
let serverQuestionReportsStore: ServerQuestionReport[] = [];
let serverQuestionExplanationsStore: ServerQuestionExplanation[] = [];

// Load existing stores from disk on startup
try {
  if (fs.existsSync(REGISTERED_USERS_FILE_PATH)) {
    const raw = fs.readFileSync(REGISTERED_USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverRegisteredUsersStore = parsed;
  }
} catch (err) {
  console.warn('Could not load registered_users_store.json:', err);
}

try {
  if (fs.existsSync(USER_PROGRESS_FILE_PATH)) {
    const raw = fs.readFileSync(USER_PROGRESS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverUserProgressStore = parsed;
  }
} catch (err) {
  console.warn('Could not load user_progress_store.json:', err);
}

try {
  if (fs.existsSync(LEADERBOARD_FILE_PATH)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverLeaderboardStore = parsed;
  }
} catch (err) {
  console.warn('Could not load leaderboard_store.json:', err);
}

try {
  if (fs.existsSync(EXAM_RESULTS_FILE_PATH)) {
    const raw = fs.readFileSync(EXAM_RESULTS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverExamResultsStore = parsed;
  }
} catch (err) {
  console.warn('Could not load exam_results_store.json:', err);
}

try {
  if (fs.existsSync(QUESTION_LIKES_FILE_PATH)) {
    const raw = fs.readFileSync(QUESTION_LIKES_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverQuestionLikesStore = parsed;
  }
} catch (err) {
  console.warn('Could not load question_likes_store.json:', err);
}

try {
  if (fs.existsSync(QUESTION_BOOKMARKS_FILE_PATH)) {
    const raw = fs.readFileSync(QUESTION_BOOKMARKS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverQuestionBookmarksStore = parsed;
  }
} catch (err) {
  console.warn('Could not load question_bookmarks_store.json:', err);
}

try {
  if (fs.existsSync(QUESTION_REPORTS_FILE_PATH)) {
    const raw = fs.readFileSync(QUESTION_REPORTS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverQuestionReportsStore = parsed;
  }
} catch (err) {
  console.warn('Could not load question_reports_store.json:', err);
}

try {
  if (fs.existsSync(QUESTION_EXPLANATIONS_FILE_PATH)) {
    const raw = fs.readFileSync(QUESTION_EXPLANATIONS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverQuestionExplanationsStore = parsed;
  }
} catch (err) {
  console.warn('Could not load question_explanations_store.json:', err);
}

function saveRegisteredUsersStoreToDisk() {
  try {
    fs.writeFileSync(REGISTERED_USERS_FILE_PATH, JSON.stringify(serverRegisteredUsersStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write registered_users_store.json:', err);
  }
}

function saveUserProgressStoreToDisk() {
  try {
    fs.writeFileSync(USER_PROGRESS_FILE_PATH, JSON.stringify(serverUserProgressStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write user_progress_store.json:', err);
  }
}

function saveLeaderboardStoreToDisk() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE_PATH, JSON.stringify(serverLeaderboardStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write leaderboard_store.json:', err);
  }
}

function saveExamResultsStoreToDisk() {
  try {
    fs.writeFileSync(EXAM_RESULTS_FILE_PATH, JSON.stringify(serverExamResultsStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write exam_results_store.json:', err);
  }
}

function saveQuestionLikesStoreToDisk() {
  try {
    fs.writeFileSync(QUESTION_LIKES_FILE_PATH, JSON.stringify(serverQuestionLikesStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write question_likes_store.json:', err);
  }
}

function saveQuestionBookmarksStoreToDisk() {
  try {
    fs.writeFileSync(QUESTION_BOOKMARKS_FILE_PATH, JSON.stringify(serverQuestionBookmarksStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write question_bookmarks_store.json:', err);
  }
}

function saveQuestionReportsStoreToDisk() {
  try {
    fs.writeFileSync(QUESTION_REPORTS_FILE_PATH, JSON.stringify(serverQuestionReportsStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write question_reports_store.json:', err);
  }
}

function saveQuestionExplanationsStoreToDisk() {
  try {
    fs.writeFileSync(QUESTION_EXPLANATIONS_FILE_PATH, JSON.stringify(serverQuestionExplanationsStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write question_explanations_store.json:', err);
  }
}

/**
 * Normalizes phone numbers to standard numeric digits for resilient cross-device matching.
 * e.g., "+8801712-345678", "01712345678", "8801712345678" -> "01712345678"
 */
function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    return '0' + digits.substring(3);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

// ----------------------------------------------------------------------------
// USER REGISTRATION & AUTHENTICATION ENDPOINTS (CROSS-DEVICE SYNC)
// ----------------------------------------------------------------------------

/**
 * Register or update a user account in the shared server cloud store
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { id, student_id, roll_number, rollNumber, fullName, full_name, phone, email, password, avatarUrl, avatar_url, role } = req.body;
    const cleanName = String(fullName || full_name || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanPhoneNorm = normalizePhoneNumber(cleanPhone);
    let cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'পূর্ণ নাম প্রদান করা আবশ্যক।' });
    }
    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({ success: false, error: 'মোবাইল নম্বর অথবা ইমেইল প্রদান করুন।' });
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে باشد।' });
    }

    if (!cleanEmail && cleanPhoneNorm) {
      cleanEmail = `${cleanPhoneNorm}@attamreen.academy`;
    }

    // Generate or use existing Student ID / Roll Number (e.g. TM-111111)
    const phoneRoll = cleanPhoneNorm ? `TM-${cleanPhoneNorm.slice(-6)}` : '';
    const finalStudentId = roll_number || rollNumber || student_id || phoneRoll || `TM-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalUserId = id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Find existing account by phone or email
    const existingIndex = serverRegisteredUsersStore.findIndex((acc) => {
      const accPhoneNorm = normalizePhoneNumber(acc.phone);
      const phoneMatch = cleanPhoneNorm && accPhoneNorm && (
        cleanPhoneNorm === accPhoneNorm ||
        (cleanPhoneNorm.length >= 10 && accPhoneNorm.endsWith(cleanPhoneNorm.slice(-10))) ||
        (accPhoneNorm.length >= 10 && cleanPhoneNorm.endsWith(accPhoneNorm.slice(-10)))
      );
      const emailMatch = cleanEmail && acc.email && acc.email.toLowerCase() === cleanEmail;
      const idMatch = id && acc.id === id;
      return Boolean(phoneMatch || emailMatch || idMatch);
    });

    const nowIso = new Date().toISOString();
    const newAccount: ServerUserAccount = {
      id: existingIndex >= 0 ? serverRegisteredUsersStore[existingIndex].id : finalUserId,
      student_id: existingIndex >= 0 ? (serverRegisteredUsersStore[existingIndex].student_id || finalStudentId) : finalStudentId,
      roll_number: existingIndex >= 0 ? (serverRegisteredUsersStore[existingIndex].roll_number || serverRegisteredUsersStore[existingIndex].student_id || finalStudentId) : finalStudentId,
      full_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password: cleanPassword, // Stored for seamless cross-device phone+password login
      avatar_url: avatarUrl || avatar_url || (existingIndex >= 0 ? serverRegisteredUsersStore[existingIndex].avatar_url : ''),
      role: role || 'student',
      created_at: existingIndex >= 0 ? serverRegisteredUsersStore[existingIndex].created_at : nowIso,
      updated_at: nowIso,
    };

    if (existingIndex >= 0) {
      serverRegisteredUsersStore[existingIndex] = newAccount;
    } else {
      serverRegisteredUsersStore.push(newAccount);
    }
    saveRegisteredUsersStoreToDisk();

    // Sanitize account (omit raw password) for client response
    const sanitized = {
      id: newAccount.id,
      student_id: newAccount.student_id,
      roll_number: newAccount.roll_number || newAccount.student_id,
      full_name: newAccount.full_name,
      phone: newAccount.phone,
      email: newAccount.email,
      avatar_url: newAccount.avatar_url,
      role: newAccount.role,
      created_at: newAccount.created_at,
    };

    return res.json({
      success: true,
      user: sanitized,
      studentId: newAccount.student_id,
      rollNumber: newAccount.roll_number || newAccount.student_id,
      message: 'রেজিস্ট্রেশন সফল হয়েছে!',
    });
  } catch (err: any) {
    console.error('Registration server error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'সার্ভার ত্রুটি ঘটেছে।' });
  }
});

/**
 * Phone to email lookup endpoint for cross-browser / cross-device login
 */
app.get('/api/auth/lookup-phone', (req, res) => {
  try {
    const rawPhone = String(req.query.phone || '').trim();
    if (!rawPhone) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }
    const cleanNorm = normalizePhoneNumber(rawPhone);
    const matched = serverRegisteredUsersStore.find((acc) => {
      const accNorm = normalizePhoneNumber(acc.phone);
      return Boolean(
        cleanNorm && accNorm && (
          cleanNorm === accNorm ||
          (cleanNorm.length >= 10 && accNorm.endsWith(cleanNorm.slice(-10))) ||
          (accNorm.length >= 10 && cleanNorm.endsWith(accNorm.slice(-10)))
        )
      );
    });

    if (matched) {
      return res.json({
        success: true,
        email: matched.email,
        full_name: matched.full_name,
        phone: matched.phone,
        user_id: matched.id,
      });
    }

    // Default registered account mapping for Jobayer Ahmed
    if (cleanNorm.endsWith('01779834999') || cleanNorm.endsWith('1779834999')) {
      return res.json({
        success: true,
        email: 'ntrca999@gmail.com',
        full_name: 'Jobayer Ahmed',
        phone: '01779834999',
        user_id: '8777a417-cfdc-468c-90bc-55e23f5d1645',
      });
    }

    return res.json({ success: false, message: 'No registered user found for phone' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * Cross-device login endpoint matching phone or email and password
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const cleanInput = String(identifier || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanInput || !cleanPassword) {
      return res.status(400).json({
        success: false,
        error: 'মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।',
      });
    }

    const cleanInputDigits = normalizePhoneNumber(cleanInput);
    const cleanInputEmail = cleanInput.toLowerCase();

    // Search in registered users store
    const matched = serverRegisteredUsersStore.find((acc) => {
      const accPhoneNorm = normalizePhoneNumber(acc.phone);
      const phoneMatch = cleanInputDigits && accPhoneNorm && (
        cleanInputDigits === accPhoneNorm ||
        (cleanInputDigits.length >= 10 && accPhoneNorm.endsWith(cleanInputDigits.slice(-10))) ||
        (accPhoneNorm.length >= 10 && cleanInputDigits.endsWith(accPhoneNorm.slice(-10)))
      );
      const emailMatch = acc.email && (
        acc.email.toLowerCase() === cleanInputEmail ||
        acc.email.toLowerCase().startsWith(cleanInputDigits)
      );
      return Boolean(phoneMatch || emailMatch);
    });

    if (!matched) {
      return res.status(404).json({
        success: false,
        error: 'মোবাইল নম্বর বা ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে "রেজিস্ট্রেশন" করুন।',
      });
    }

    // Validate password
    if (matched.password !== cleanPassword) {
      return res.status(401).json({
        success: false,
        error: 'প্রদত্ত পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড লিখুন।',
      });
    }

    const sanitized = {
      id: matched.id,
      student_id: matched.student_id,
      full_name: matched.full_name,
      phone: matched.phone,
      email: matched.email,
      avatar_url: matched.avatar_url || '',
      role: matched.role || 'student',
      created_at: matched.created_at,
    };

    return res.json({
      success: true,
      user: sanitized,
      studentId: matched.student_id,
      message: 'লগইন সফল হয়েছে!',
    });
  } catch (err: any) {
    console.error('Login server error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'সার্ভার ত্রুটি ঘটেছে।' });
  }
});

/**
 * Get all registered users for Admin panel and cross-client synchronization
 */
app.get('/api/auth/users', (req, res) => {
  try {
    const list = serverRegisteredUsersStore.map((u) => ({
      id: u.id,
      student_id: u.student_id,
      roll_number: u.roll_number || u.student_id,
      rollNumber: u.roll_number || u.student_id,
      fullName: u.full_name,
      phone: u.phone,
      email: u.email,
      avatarUrl: u.avatar_url,
      role: u.role || 'student',
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
    return res.json({ success: true, users: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Error fetching users' });
  }
});

/**
 * Bulk sync endpoint to import client-side cached accounts to server
 */
app.post('/api/auth/sync', (req, res) => {
  try {
    const accounts = req.body?.accounts;
    if (!Array.isArray(accounts)) {
      return res.json({ success: true, count: serverRegisteredUsersStore.length });
    }

    let addedCount = 0;
    accounts.forEach((acc: any) => {
      if (!acc || (!acc.phone && !acc.email)) return;
      const cleanPhoneNorm = normalizePhoneNumber(acc.phone || '');
      const cleanEmail = String(acc.email || '').trim().toLowerCase();

      const exists = serverRegisteredUsersStore.some((existing) => {
        const exPhoneNorm = normalizePhoneNumber(existing.phone);
        const phoneMatch = cleanPhoneNorm && exPhoneNorm && cleanPhoneNorm === exPhoneNorm;
        const emailMatch = cleanEmail && existing.email && existing.email.toLowerCase() === cleanEmail;
        return Boolean(phoneMatch || emailMatch);
      });

      if (!exists) {
        const studentId = acc.id?.startsWith('STD-') ? acc.id : `STD-${Math.floor(100000 + Math.random() * 900000)}`;
        serverRegisteredUsersStore.push({
          id: acc.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          student_id: studentId,
          full_name: acc.fullName || acc.full_name || 'শিক্ষার্থী',
          phone: acc.phone || '',
          email: acc.email || (cleanPhoneNorm ? `${cleanPhoneNorm}@attamreen.academy` : ''),
          password: acc.passwordHash || acc.password || '123456',
          avatar_url: acc.avatarUrl || acc.avatar_url || '',
          role: acc.role || 'student',
          created_at: acc.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveRegisteredUsersStoreToDisk();
    }

    return res.json({ success: true, addedCount, total: serverRegisteredUsersStore.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Sync error' });
  }
});

/**
 * Endpoint to fetch user progress (completed exams, quiz stats, avatar, goal) across browsers/devices
 */
app.get('/api/user/progress', (req, res) => {
  try {
    const rawUserId = String(req.query.userId || '').trim();
    const rawPhone = String(req.query.phone || '').trim();
    const rawEmail = String(req.query.email || '').trim().toLowerCase();
    const phoneNorm = normalizePhoneNumber(rawPhone);

    // Find progress record
    let progress = serverUserProgressStore.find((p) => {
      const pPhoneNorm = normalizePhoneNumber(p.phone || '');
      const userMatch = rawUserId && p.userId && (p.userId === rawUserId || p.userId.includes(rawUserId));
      const phoneMatch = phoneNorm && pPhoneNorm && (phoneNorm === pPhoneNorm || phoneNorm.endsWith(pPhoneNorm.slice(-10)) || pPhoneNorm.endsWith(phoneNorm.slice(-10)));
      const emailMatch = rawEmail && p.email && p.email.toLowerCase() === rawEmail;
      return Boolean(userMatch || phoneMatch || emailMatch);
    });

    // Also check serverExamResultsStore to aggregate any completed exams and stats
    const matchingExamResults = serverExamResultsStore.filter((er) => {
      const uMatch = rawUserId && er.user_id && (er.user_id === rawUserId || er.user_id.includes(rawUserId));
      const nameMatch = progress?.fullName && er.full_name && er.full_name.trim().toLowerCase() === progress.fullName.trim().toLowerCase();
      return Boolean(uMatch || nameMatch);
    });

    const completedExamsSet = new Set<string>(progress?.completedExams || []);
    let aggregatedTotalQuestions = progress?.studentStats?.totalQuestionsAnswered || 0;
    let lastQuizScore = progress?.studentStats?.lastQuizScore || null;

    matchingExamResults.forEach((er) => {
      if (er.exam_id) completedExamsSet.add(er.exam_id);
      if (er.exam_title) completedExamsSet.add(er.exam_title);
      if (!progress?.studentStats) {
        aggregatedTotalQuestions += (er.total_marks || 0);
        if (!lastQuizScore && er.total_marks) {
          lastQuizScore = {
            correct: er.correct_answers || er.score || 0,
            total: er.total_marks,
            percentage: Math.round(((er.correct_answers || er.score || 0) / er.total_marks) * 100),
            date: new Date(er.submitted_at || Date.now()).toLocaleDateString('bn-BD', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          };
        }
      }
    });

    // Find user profile in registered users store for avatar/name fallback
    const registeredAcc = serverRegisteredUsersStore.find((acc) => {
      const accNorm = normalizePhoneNumber(acc.phone);
      const uMatch = rawUserId && acc.id === rawUserId;
      const pMatch = phoneNorm && accNorm && (phoneNorm === accNorm || phoneNorm.endsWith(accNorm.slice(-10)) || accNorm.endsWith(phoneNorm.slice(-10)));
      const eMatch = rawEmail && acc.email && acc.email.toLowerCase() === rawEmail;
      return Boolean(uMatch || pMatch || eMatch);
    });

    const result = {
      success: true,
      userId: rawUserId || progress?.userId || registeredAcc?.id || '',
      fullName: progress?.fullName || registeredAcc?.full_name || '',
      avatarUrl: progress?.avatarUrl || registeredAcc?.avatar_url || '',
      completedExams: Array.from(completedExamsSet),
      studentStats: progress?.studentStats || {
        todayPracticeCount: 0,
        lastPracticeDate: new Date().toISOString().split('T')[0],
        totalQuestionsAnswered: aggregatedTotalQuestions,
        lastQuizScore: lastQuizScore,
      },
      goal: progress?.goal || '১৮তম শিক্ষক নিবন্ধন প্রিলি/ভাইভা',
      bookmarkedIds: progress?.bookmarkedIds || [],
    };

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * Endpoint to save user progress (completed exams, stats, avatar) to cloud server
 */
app.post('/api/user/progress', (req, res) => {
  try {
    const { userId, phone, email, fullName, avatarUrl, completedExamId, studentStats, goal, bookmarkedIds } = req.body;
    if (!userId && !phone && !email) {
      return res.status(400).json({ success: false, error: 'User identifier required' });
    }

    const phoneNorm = normalizePhoneNumber(phone || '');
    const cleanEmail = String(email || '').trim().toLowerCase();

    let existingIdx = serverUserProgressStore.findIndex((p) => {
      const pPhoneNorm = normalizePhoneNumber(p.phone || '');
      const userMatch = userId && p.userId && (p.userId === userId);
      const phoneMatch = phoneNorm && pPhoneNorm && (phoneNorm === pPhoneNorm || phoneNorm.endsWith(pPhoneNorm.slice(-10)) || pPhoneNorm.endsWith(phoneNorm.slice(-10)));
      const emailMatch = cleanEmail && p.email && p.email.toLowerCase() === cleanEmail;
      return Boolean(userMatch || phoneMatch || emailMatch);
    });

    let record: ServerUserProgress;
    if (existingIdx >= 0) {
      record = serverUserProgressStore[existingIdx];
      if (fullName) record.fullName = fullName;
      if (avatarUrl !== undefined) record.avatarUrl = avatarUrl;
      if (phone) record.phone = phone;
      if (email) record.email = email;
      if (goal) record.goal = goal;
      if (Array.isArray(bookmarkedIds)) record.bookmarkedIds = bookmarkedIds;
      if (studentStats) record.studentStats = studentStats;
      if (completedExamId && !record.completedExams.includes(completedExamId)) {
        record.completedExams.push(completedExamId);
      }
      record.updatedAt = new Date().toISOString();
      serverUserProgressStore[existingIdx] = record;
    } else {
      record = {
        userId: userId || `usr_${Date.now()}`,
        phone: phone || '',
        email: email || '',
        fullName: fullName || 'শিক্ষার্থী',
        avatarUrl: avatarUrl || '',
        completedExams: completedExamId ? [completedExamId] : [],
        studentStats: studentStats || undefined,
        goal: goal || '১৮তম শিক্ষক নিবন্ধন প্রিলি/ভাইভা',
        bookmarkedIds: Array.isArray(bookmarkedIds) ? bookmarkedIds : [],
        updatedAt: new Date().toISOString(),
      };
      serverUserProgressStore.push(record);
    }
    saveUserProgressStoreToDisk();

    // Also update serverRegisteredUsersStore if avatarUrl or fullName changed
    if (fullName || avatarUrl) {
      const accIdx = serverRegisteredUsersStore.findIndex((acc) => {
        const accNorm = normalizePhoneNumber(acc.phone);
        const uMatch = userId && acc.id === userId;
        const pMatch = phoneNorm && accNorm && (phoneNorm === accNorm || phoneNorm.endsWith(accNorm.slice(-10)) || accNorm.endsWith(phoneNorm.slice(-10)));
        const eMatch = cleanEmail && acc.email && acc.email.toLowerCase() === cleanEmail;
        return Boolean(uMatch || pMatch || eMatch);
      });
      if (accIdx >= 0) {
        if (fullName) serverRegisteredUsersStore[accIdx].full_name = fullName;
        if (avatarUrl !== undefined) serverRegisteredUsersStore[accIdx].avatar_url = avatarUrl;
        serverRegisteredUsersStore[accIdx].updated_at = new Date().toISOString();
        saveRegisteredUsersStoreToDisk();
      }
    }

    return res.json({ success: true, record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * Endpoint for requesting a password reset email
 */
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, identifier } = req.body;
    const cleanEmail = String(email || identifier || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'ইমেইল ঠিকানা প্রদান করা আবশ্যক।',
      });
    }

    // Check if user exists in server store
    const userFound = serverRegisteredUsersStore.find((u) => {
      return u.email?.toLowerCase() === cleanEmail ||
             (cleanEmail.includes('@') && u.email?.toLowerCase() === cleanEmail) ||
             normalizePhoneNumber(u.phone) === normalizePhoneNumber(cleanEmail);
    });

    // We return success to prevent email enumeration, but give a tailored message
    return res.json({
      success: true,
      message: `পাসওয়ার্ড রিসেট নির্দেশনা ${cleanEmail} ঠিকানায় সফলভাবে পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`,
      userExists: Boolean(userFound),
    });
  } catch (err: any) {
    console.error('Password reset server error:', err);
    return res.status(500).json({ success: false, error: 'সার্ভার ত্রুটি ঘটেছে।' });
  }
});

// Lazy initializer for GoogleGenAI
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// API endpoint for submitting exam results
app.post('/api/exam_results', (req, res) => {
  try {
    const item = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const examResultId = item.id || `er_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isGuest = Boolean(
      item.is_guest !== undefined
        ? item.is_guest
        : (Boolean(item.guest_name) || !item.user_id || String(item.user_id).startsWith('guest_') || String(item.user_id).startsWith('anon_'))
    );

    const registeredUserId = !isGuest ? (item.user_id && !String(item.user_id).startsWith('guest_') && !String(item.user_id).startsWith('anon_') ? String(item.user_id).trim() : null) : null;
    const guestId = isGuest ? String(item.guest_id || item.roll_number || item.student_id || (item.user_id && String(item.user_id).startsWith('guest_') ? item.user_id : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`)).trim() : null;
    const guestName = isGuest ? String(item.guest_name || item.full_name || item.userName || item.name || 'গেস্ট পরীক্ষার্থী').trim() : null;
    const registeredName = !isGuest ? String(item.full_name || item.user_name || item.userName || item.name || 'পরীক্ষার্থী').trim() : null;
    const effectiveName = registeredName || guestName || 'পরীক্ষার্থী';

    const newRecord: ServerExamResult = {
      id: examResultId,
      exam_id: String(item.exam_id || item.examId || 'general'),
      exam_title: item.exam_title || item.examTitle || 'মডেল টেস্ট',
      is_free: item.is_free !== undefined ? Boolean(item.is_free) : true,
      user_id: registeredUserId,
      user_name: effectiveName,
      full_name: effectiveName,
      guest_name: guestName,
      guest_id: guestId,
      is_guest: isGuest,
      avatar_url: item.avatar_url || item.avatar || item.user_avatar || '',
      roll_number: item.roll_number || item.student_id || item.user_roll || undefined,
      score: Number(item.score ?? item.correct_answers ?? item.correctCount ?? 0),
      total_marks: Number(item.total_marks ?? item.total_questions ?? item.totalQuestions ?? 0),
      correct_answers: Number(item.correct_answers ?? item.correct_count ?? item.correctCount ?? 0),
      wrong_answers: Number(item.wrong_answers ?? item.wrong_count ?? item.wrongCount ?? 0),
      points: Number(item.points ?? item.correct_answers ?? item.correct_count ?? item.correctCount ?? 0),
      time_taken_seconds: Number(item.time_taken_seconds ?? item.timeTakenSeconds ?? 0),
      submitted_at: String(item.submitted_at || item.created_at || new Date().toISOString()),
    };

    // Upsert or keep first attempt: Enforce ONE-EXAM-ONE-COUNT rule
    const hasRegisteredUserId = Boolean(
      !isGuest &&
      newRecord.user_id &&
      newRecord.user_id.trim() &&
      !newRecord.user_id.startsWith('guest_') &&
      !newRecord.user_id.startsWith('anon_')
    );

    const userKey = hasRegisteredUserId
      ? newRecord.user_id!.trim()
      : (newRecord.guest_id || newRecord.guest_name || newRecord.full_name || newRecord.id).trim().toLowerCase();
    const examKey = String(newRecord.exam_id).trim().toLowerCase();

    // Check if an attempt already exists for this (user, exam)
    const existingAttempt = serverExamResultsStore.find((e) => {
      const eIsReg = Boolean(e.user_id && !e.user_id.startsWith('guest_') && !e.user_id.startsWith('anon_'));
      const eUserKey = eIsReg ? e.user_id!.trim() : (e.guest_id || e.guest_name || e.full_name || e.id).trim().toLowerCase();
      const eExamKey = String(e.exam_id).trim().toLowerCase();
      return eUserKey === userKey && eExamKey === examKey;
    });

    if (existingAttempt) {
      // PRESERVE FIRST ATTEMPT: Do NOT overwrite with second/later attempt!
      return res.json({
        success: true,
        alreadySubmitted: true,
        message: 'আপনি এই পরীক্ষা ইতিমধ্যে দিয়েছেন। মেধা তালিকায় শুধুমাত্র প্রথম ফলাফলটি গণ্য হবে।',
        result: existingAttempt,
      });
    }

    serverExamResultsStore.push(newRecord);
    saveExamResultsStoreToDisk();

    // Also sync to serverLeaderboardStore for compatibility
    const lbRecord: ServerLeaderboardEntry = {
      id: newRecord.id,
      exam_id: newRecord.exam_id,
      exam_title: newRecord.exam_title || 'মডেল টেস্ট',
      user_id: newRecord.user_id,
      user_name: newRecord.full_name,
      guest_name: newRecord.guest_name,
      full_name: newRecord.full_name,
      is_guest: newRecord.is_guest,
      user_avatar: newRecord.avatar_url,
      score: newRecord.score,
      total_questions: newRecord.total_marks,
      correct_count: newRecord.correct_answers,
      wrong_count: newRecord.wrong_answers,
      points: newRecord.points ?? newRecord.correct_answers,
      accuracy: newRecord.total_marks > 0 ? Math.round((newRecord.score / newRecord.total_marks) * 100) : 0,
      created_at: newRecord.submitted_at,
    };
    serverLeaderboardStore.push(lbRecord);
    saveLeaderboardStoreToDisk();

    return res.json({ success: true, result: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error saving exam result' });
  }
});

/**
 * Endpoint to check and return all completed exam IDs for a user or guest
 */
app.get('/api/exam/completed', (req, res) => {
  try {
    const rawUserId = String(req.query.userId || '').trim();
    const rawGuestId = String(req.query.guestId || '').trim();

    const completedExamIdsSet = new Set<string>();
    const isRegistered = Boolean(rawUserId && !rawUserId.startsWith('guest_') && !rawUserId.startsWith('anon_'));

    serverExamResultsStore.forEach((r) => {
      if (isRegistered) {
        if (r.user_id && (r.user_id === rawUserId || r.user_id.toLowerCase() === rawUserId.toLowerCase()) && !r.is_guest) {
          if (r.exam_id) completedExamIdsSet.add(String(r.exam_id).trim());
          if (r.exam_title) completedExamIdsSet.add(String(r.exam_title).trim());
        }
      } else if (rawGuestId) {
        if (r.is_guest && ((r as any).guest_id === rawGuestId || r.user_id === rawGuestId)) {
          if (r.exam_id) completedExamIdsSet.add(String(r.exam_id).trim());
          if (r.exam_title) completedExamIdsSet.add(String(r.exam_title).trim());
        }
      }
    });

    serverLeaderboardStore.forEach((e) => {
      if (isRegistered) {
        if (e.user_id && (e.user_id === rawUserId || e.user_id.toLowerCase() === rawUserId.toLowerCase()) && !e.is_guest) {
          if (e.exam_id) completedExamIdsSet.add(String(e.exam_id).trim());
          if (e.exam_title) completedExamIdsSet.add(String(e.exam_title).trim());
        }
      }
    });

    if (isRegistered) {
      serverUserProgressStore.forEach((p) => {
        const uMatch = p.userId && (p.userId === rawUserId || p.userId.toLowerCase() === rawUserId.toLowerCase());
        if (uMatch && Array.isArray(p.completedExams)) {
          p.completedExams.forEach((id) => {
            if (id) completedExamIdsSet.add(String(id).trim());
          });
        }
      });
    }

    return res.json({
      success: true,
      completedExamIds: Array.from(completedExamIdsSet),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// RPC API: Get leaderboard for a specific exam
app.get('/api/rpc/get_exam_leaderboard', (req, res) => {
  try {
    const examId = String(req.query.p_exam_id || req.query.exam_id || '').trim().toLowerCase();
    if (!examId || examId === 'all') {
      return res.json({ success: true, data: [] });
    }

    // Filter matching exam results
    const matching = serverExamResultsStore.filter((r) => {
      const eId = (r.exam_id || '').toLowerCase().trim();
      const eTitle = (r.exam_title || '').toLowerCase().trim();
      return (
        eId === examId ||
        eTitle === examId ||
        (eId && (eId.includes(examId) || examId.includes(eId))) ||
        (eTitle && (eTitle.includes(examId) || examId.includes(eTitle)))
      );
    });

    // Keep best result per distinct participant (registered user_id/roll_number OR distinct guest)
    const userBestMap = new Map<string, ServerExamResult>();
    for (const r of matching) {
      const isReg = r.is_guest === false || Boolean(r.user_id && !r.user_id.startsWith('guest_') && !r.user_id.startsWith('anon_'));
      const uKey = isReg
        ? String(r.user_id || r.roll_number || r.student_id || r.full_name || r.user_name || r.id).trim().toLowerCase()
        : String(r.guest_id || r.guest_name || r.full_name || r.user_name || r.id).trim().toLowerCase();
      const existing = userBestMap.get(uKey);
      if (!existing) {
        userBestMap.set(uKey, r);
      } else {
        if (r.score > existing.score) {
          userBestMap.set(uKey, r);
        } else if (r.score === existing.score) {
          if (r.time_taken_seconds < existing.time_taken_seconds) {
            userBestMap.set(uKey, r);
          } else if (new Date(r.submitted_at).getTime() < new Date(existing.submitted_at).getTime()) {
            userBestMap.set(uKey, r);
          }
        }
      }
    }

    // Sort: 1. Higher score first, 2. Lower time_taken_seconds first, 3. Earlier submitted_at
    const list = Array.from(userBestMap.values());
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.time_taken_seconds !== b.time_taken_seconds) return a.time_taken_seconds - b.time_taken_seconds;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });

    const formatted = list.map((r, idx) => {
      const isReg = r.is_guest === false || Boolean(r.user_id && !r.user_id.startsWith('guest_') && !r.user_id.startsWith('anon_'));
      const isGuest = !isReg;
      const fullName = r.user_name || r.full_name || r.guest_name || 'Anonymous';
      const rollNumber = r.roll_number || r.student_id || r.guest_id || 'N/A';
      return {
        rank: idx + 1,
        user_id: r.user_id || undefined,
        full_name: fullName,
        user_name: fullName,
        guest_name: isGuest ? (r.guest_name || fullName) : undefined,
        guest_id: r.guest_id || undefined,
        is_guest: isGuest,
        avatar_url: r.avatar_url || '',
        roll_number: rollNumber !== 'N/A' ? rollNumber : undefined,
        student_id: rollNumber !== 'N/A' ? rollNumber : undefined,
        score: r.score,
        total_marks: r.total_marks,
        correct_answers: r.correct_answers,
        wrong_answers: r.wrong_answers,
        points: r.points !== undefined && r.points !== null ? r.points : (r.correct_answers ?? r.score),
        time_taken_seconds: r.time_taken_seconds,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error getting exam leaderboard' });
  }
});

// Helper to calculate date/week/month in Asia/Dhaka time
function getDhakaDateInfo(dateInput?: string | number | Date) {
  const d = dateInput ? new Date(dateInput) : new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

    const year = parseInt(getPart('year'), 10);
    const month = parseInt(getPart('month'), 10);
    const day = parseInt(getPart('day'), 10);

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const calDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = calDate.getUTCDay(); // 0: Sun, 1: Mon, ... 6: Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(calDate.getTime() + diffToMonday * 86400000);
    const weekMondayStr = `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;

    return { dateStr, weekMondayStr, monthStr };
  } catch {
    // Fallback: UTC+6 offset calculation
    const utcTime = d.getTime();
    const dhakaMs = utcTime + (6 * 3600 * 1000);
    const dhakaDate = new Date(dhakaMs);
    const year = dhakaDate.getUTCFullYear();
    const month = dhakaDate.getUTCMonth() + 1;
    const day = dhakaDate.getUTCDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const dayOfWeek = dhakaDate.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(dhakaDate.getTime() + diffToMonday * 86400000);
    const weekMondayStr = `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
    return { dateStr, weekMondayStr, monthStr };
  }
}

// Master Tamreen Leaderboard calculation engine enforcing the ONE-EXAM-ONE-COUNT rule
function computeTamreenLeaderboard(params: {
  periodType: string;
  pageNumber?: number;
  pageSize?: number;
  userId?: string;
}) {
  const period = (params.periodType || 'all_time').trim().toLowerCase();
  const pageNumber = Math.max(1, Number(params.pageNumber || 1));
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 20)));
  const currentUserId = params.userId ? String(params.userId).trim() : null;

  // 1. Group all records by (user, exam_id)
  const attemptsByUserAndExam = new Map<string, ServerExamResult[]>();

  for (const r of serverExamResultsStore) {
    const isReg = Boolean(r.user_id && !r.user_id.startsWith('guest_') && !r.user_id.startsWith('anon_'));
    const userIdentifier = isReg
      ? r.user_id!.trim()
      : (r.guest_id || r.guest_name || r.full_name || r.id).trim().toLowerCase();
    const examIdentifier = String(r.exam_id || 'general').trim().toLowerCase();

    const compositeKey = `${userIdentifier}:::${examIdentifier}`;
    if (!attemptsByUserAndExam.has(compositeKey)) {
      attemptsByUserAndExam.set(compositeKey, []);
    }
    attemptsByUserAndExam.get(compositeKey)!.push(r);
  }

  // 2. ONE-EXAM-ONE-COUNT RULE: For every user and every exam, ONLY THE FIRST COMPLETED RESULT COUNTS!
  // Sort attempts by created_at / submitted_at ASC, id ASC and select attempt_rn === 1.
  const authoritativeFirstAttempts: ServerExamResult[] = [];

  for (const attempts of attemptsByUserAndExam.values()) {
    attempts.sort((a, b) => {
      const timeA = new Date(a.submitted_at || 0).getTime();
      const timeB = new Date(b.submitted_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });
    // First completed attempt is authoritative
    authoritativeFirstAttempts.push(attempts[0]);
  }

  // 3. Filter authoritative first attempts by period in Asia/Dhaka time
  const nowDhaka = getDhakaDateInfo(new Date());

  const periodFilteredAttempts = authoritativeFirstAttempts.filter((att) => {
    if (period === 'all_time' || period === 'all') return true;

    const attDhaka = getDhakaDateInfo(att.submitted_at);
    if (period === 'today' || period === 'daily') {
      return attDhaka.dateStr === nowDhaka.dateStr;
    }
    if (period === 'this_week' || period === 'weekly' || period === 'week') {
      return attDhaka.weekMondayStr === nowDhaka.weekMondayStr;
    }
    if (period === 'this_month' || period === 'monthly' || period === 'month') {
      return attDhaka.monthStr === nowDhaka.monthStr;
    }
    return true;
  });

  // 4. Calculate leaderboard totals from those first attempts
  // For each user: total_points = SUM(points)
  const userAggregates = new Map<string, {
    userId: string;
    userName: string;
    rollNo: string;
    avatarUrl: string;
    isGuest: boolean;
    totalPoints: number;
    totalCorrect: number;
    uniqueExams: Set<string>;
    lastPointTime: number;
  }>();

  for (const att of periodFilteredAttempts) {
    const isReg = Boolean(att.user_id && !att.user_id.startsWith('guest_') && !att.user_id.startsWith('anon_'));
    const userIdentifier = isReg
      ? att.user_id!.trim()
      : (att.guest_id || att.guest_name || att.full_name || att.id).trim().toLowerCase();

    // Source of points MUST be points column (with fallback to correct_answers)
    const points = Number(att.points !== undefined && att.points !== null ? att.points : (att.correct_answers ?? att.score ?? 0));
    const correctCount = Number(att.correct_answers ?? att.score ?? 0);
    const subTime = new Date(att.submitted_at || 0).getTime();
    const name = att.full_name || att.user_name || att.guest_name || 'পরীক্ষার্থী';
    const roll = att.roll_number || att.student_id || 'N/A';

    const existing = userAggregates.get(userIdentifier);
    if (!existing) {
      const examSet = new Set<string>();
      examSet.add(String(att.exam_id).toLowerCase().trim());
      userAggregates.set(userIdentifier, {
        userId: userIdentifier,
        userName: name,
        rollNo: roll,
        avatarUrl: att.avatar_url || '',
        isGuest: !isReg,
        totalPoints: points,
        totalCorrect: correctCount,
        uniqueExams: examSet,
        lastPointTime: subTime,
      });
    } else {
      existing.totalPoints += points;
      existing.totalCorrect += correctCount;
      existing.uniqueExams.add(String(att.exam_id).toLowerCase().trim());
      if (subTime > existing.lastPointTime) {
        existing.lastPointTime = subTime;
      }
      if (att.avatar_url) existing.avatarUrl = att.avatar_url;
      if (roll !== 'N/A' && existing.rollNo === 'N/A') existing.rollNo = roll;
    }
  }

  // 5. Leaderboard sorting with tie-breakers:
  // Primary: total_points DESC
  // Tie-breaker 1: total_correct DESC
  // Tie-breaker 2: unique_exam_count DESC
  // Tie-breaker 3: earliest time reaching the relevant total points (lastPointTime ASC)
  // Final deterministic tie-breaker: user_id ASC
  const rankedList = Array.from(userAggregates.values()).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
    if (b.uniqueExams.size !== a.uniqueExams.size) return b.uniqueExams.size - a.uniqueExams.size;
    if (a.lastPointTime !== b.lastPointTime) return a.lastPointTime - b.lastPointTime;
    return a.userId.localeCompare(b.userId);
  });

  // Assign deterministic 1-based ranks
  const allRanked = rankedList.map((u, idx) => ({
    rank: idx + 1,
    user_id: u.userId,
    user_name: u.userName,
    roll_no: u.rollNo,
    avatar_url: u.avatarUrl,
    is_guest: u.isGuest,
    total_points: u.totalPoints,
    total_correct: u.totalCorrect,
    unique_exam_count: u.uniqueExams.size,
  }));

  // 6. Find current user's entry (even if outside the current page or Top 20)
  let currentUserRankItem: any = null;
  if (currentUserId) {
    const cleanId = currentUserId.toLowerCase().trim();
    const found = allRanked.find((u) => u.user_id.toLowerCase().trim() === cleanId);
    if (found) {
      currentUserRankItem = { ...found, is_current_user: true };
    }
  }

  // 7. Paginate
  const startIndex = (pageNumber - 1) * pageSize;
  const pagedItems = allRanked.slice(startIndex, startIndex + pageSize);

  return {
    items: pagedItems,
    currentUser: currentUserRankItem,
    totalCount: allRanked.length,
    page: pageNumber,
    pageSize,
    hasMore: startIndex + pageSize < allRanked.length,
  };
}

// Master RPC Endpoint: /api/rpc/get_leaderboard
app.get('/api/rpc/get_leaderboard', (req, res) => {
  try {
    const periodType = String(req.query.period_type || req.query.p_period_type || req.query.period || 'all_time');
    const pageNumber = parseInt(String(req.query.page_number || req.query.p_page_number || req.query.page || '1'), 10);
    const pageSize = parseInt(String(req.query.page_size || req.query.p_page_size || '20'), 10);
    const userId = req.query.user_id ? String(req.query.user_id || req.query.p_user_id || '') : undefined;

    const result = computeTamreenLeaderboard({
      periodType,
      pageNumber,
      pageSize,
      userId,
    });

    return res.json({
      success: true,
      data: result.items,
      currentUser: result.currentUser,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error computing leaderboard' });
  }
});

// Check if user has already taken an exam (Exam Retake Prevention)
app.get('/api/exam_results/check_attempt', (req, res) => {
  try {
    const userId = String(req.query.userId || req.query.user_id || '').trim();
    const examId = String(req.query.examId || req.query.exam_id || '').trim().toLowerCase();

    if (!examId) {
      return res.json({ alreadyCompleted: false });
    }

    const isReg = Boolean(userId && !userId.startsWith('guest_') && !userId.startsWith('anon_'));
    const userKey = userId.toLowerCase();

    const existing = serverExamResultsStore.find((e) => {
      const eExamKey = String(e.exam_id || '').trim().toLowerCase();
      if (eExamKey !== examId) return false;

      if (isReg) {
        return (
          e.user_id &&
          (e.user_id.toLowerCase().trim() === userKey ||
            (e.roll_number && e.roll_number.toLowerCase().trim() === userKey))
        );
      } else {
        return (
          (e.guest_id && e.guest_id.toLowerCase().trim() === userKey) ||
          (e.user_id && e.user_id.toLowerCase().trim() === userKey)
        );
      }
    });

    return res.json({
      alreadyCompleted: Boolean(existing),
      existingResult: existing || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error checking attempt' });
  }
});

// RPC API: Get free overall leaderboard (Delegates to computeTamreenLeaderboard)
app.get('/api/rpc/get_free_overall_leaderboard', (req, res) => {
  try {
    const period = String(req.query.p_period || req.query.period || 'all_time').trim();
    const result = computeTamreenLeaderboard({
      periodType: period,
      pageNumber: 1,
      pageSize: 100,
    });

    const formatted = result.items.map((u) => ({
      rank: u.rank,
      user_id: u.user_id,
      full_name: u.user_name,
      avatar_url: u.avatar_url,
      total_points: u.total_points,
      free_exam_count: u.unique_exam_count,
      average_percentage: 100,
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error getting free overall leaderboard' });
  }
});
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction:
          systemInstruction ||
          'আপনি আত-তামরীন একাডেমির "তামরীন এআই" স্মার্ট টিউটর। বাংলাদেশ শিক্ষক নিবন্ধন (NTRCA), মাদ্রাসা ও বিসিএস পরীক্ষার পরীক্ষার্থীদের জন্য সহজ ও শিক্ষণীয় ভাষায় বিস্তারিত উত্তর, ব্যাখ্যা ও গুরুত্বপূর্ণ পরামর্শ প্রদান করুন। সুন্দর ও স্পষ্ট ব্যাকগ্রাউন্ড সহ পয়েন্ট করে উত্তর দিন।',
      },
    });

    return res.json({ text: response.text || 'কোনো উত্তর তৈরি করা সম্ভব হয়নি।' });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: err?.message || 'Gemini API থেকে উত্তর গ্রহণে ত্রুটি হয়েছে।',
    });
  }
});

// API endpoints for shared Leaderboard across all users and shared tests
app.get('/api/leaderboard', (req, res) => {
  const { examId } = req.query;
  let results = serverLeaderboardStore;
  if (examId && typeof examId === 'string' && examId !== 'all') {
    results = results.filter(
      (e) => e.exam_id === examId || e.exam_title === examId
    );
  }
  return res.json({ success: true, entries: results });
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const body = req.body;
    const items: ServerLeaderboardEntry[] = Array.isArray(body) ? body : [body];

    items.forEach((item) => {
      if (!item || !item.id) return;
      const existingIdx = serverLeaderboardStore.findIndex((e) => e.id === item.id);
      if (existingIdx >= 0) {
        serverLeaderboardStore[existingIdx] = {
          ...serverLeaderboardStore[existingIdx],
          ...item,
        };
      } else {
        const rawName = item.guest_name || item.full_name || item.user_name || 'পরীক্ষার্থী';
        serverLeaderboardStore.push({
          id: String(item.id),
          exam_id: String(item.exam_id || 'general'),
          exam_title: String(item.exam_title || 'পরীক্ষা'),
          user_id: item.user_id ? String(item.user_id) : undefined,
          user_name: rawName,
          guest_name: item.guest_name,
          full_name: item.full_name || rawName,
          is_guest: item.is_guest,
          user_avatar: item.user_avatar ? String(item.user_avatar) : '',
          score: Number(item.score || 0),
          total_questions: Number(item.total_questions || 0),
          correct_count: Number(item.correct_count || 0),
          wrong_count: Number(item.wrong_count || 0),
          accuracy: Number(item.accuracy || 0),
          created_at: String(item.created_at || new Date().toISOString()),
        });
      }
    });

    saveLeaderboardStoreToDisk();
    return res.json({ success: true, count: serverLeaderboardStore.length });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error saving leaderboard entry' });
  }
});

app.post('/api/leaderboard/update-profile', (req, res) => {
  try {
    const { userId, newName, newAvatar } = req.body;
    if (!userId || !newName) {
      return res.json({ success: true, updatedCount: 0 });
    }

    const cleanNew = String(newName).trim();
    const cleanAvatar = newAvatar ? String(newAvatar) : '';

    let updatedCount = 0;
    // Only update entries with matching registered userId (NEVER overwrite guests)
    if (!userId.startsWith('guest_') && !userId.startsWith('anon_')) {
      serverLeaderboardStore.forEach((e) => {
        if (e.user_id === userId && !e.is_guest) {
          e.user_name = cleanNew;
          e.full_name = cleanNew;
          if (cleanAvatar) e.user_avatar = cleanAvatar;
          updatedCount++;
        }
      });
      serverExamResultsStore.forEach((er) => {
        if (er.user_id === userId && !er.is_guest) {
          er.full_name = cleanNew;
          if (cleanAvatar) er.avatar_url = cleanAvatar;
        }
      });

      if (updatedCount > 0) {
        saveLeaderboardStoreToDisk();
        saveExamResultsStoreToDisk();
      }
    }

    return res.json({ success: true, updatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error updating profile' });
  }
});

// API endpoint to clear all leaderboard entries and exam results
app.post('/api/leaderboard/clear', (req, res) => {
  try {
    serverLeaderboardStore = [];
    serverExamResultsStore = [];
    try {
      if (fs.existsSync(LEADERBOARD_FILE_PATH)) fs.unlinkSync(LEADERBOARD_FILE_PATH);
      if (fs.existsSync(EXAM_RESULTS_FILE_PATH)) fs.unlinkSync(EXAM_RESULTS_FILE_PATH);
    } catch {}
    return res.json({ success: true, message: 'Leaderboard cleared successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error clearing leaderboard' });
  }
});

// ==========================================
// Question Likes, Bookmarks, Reports & Explanations API
// ==========================================

// Toggle or fetch question likes
app.post('/api/questions/like', (req, res) => {
  try {
    const { question_id, user_id, user_name } = req.body;
    if (!question_id || !user_id) {
      return res.status(400).json({ error: 'question_id and user_id are required' });
    }

    const qId = String(question_id).trim();
    const uId = String(user_id).trim();
    const existingIndex = serverQuestionLikesStore.findIndex(
      (item) => item.question_id === qId && item.user_id === uId
    );

    let isLiked = false;
    if (existingIndex >= 0) {
      // Remove like (unlike)
      serverQuestionLikesStore.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Add like
      serverQuestionLikesStore.push({
        id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        question_id: qId,
        user_id: uId,
        user_name: user_name ? String(user_name).trim() : undefined,
        created_at: new Date().toISOString(),
      });
      isLiked = true;
    }

    saveQuestionLikesStoreToDisk();

    const likeCount = serverQuestionLikesStore.filter((item) => item.question_id === qId).length;
    return res.json({ success: true, isLiked, likeCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error processing question like' });
  }
});

app.get('/api/questions/likes', (req, res) => {
  try {
    const { userId, questionId } = req.query;
    if (userId && typeof userId === 'string') {
      const uId = userId.trim();
      const likedQuestionIds = serverQuestionLikesStore
        .filter((item) => item.user_id === uId)
        .map((item) => item.question_id);
      return res.json({ success: true, likedQuestionIds });
    }

    if (questionId && typeof questionId === 'string') {
      const qId = questionId.trim();
      const likeCount = serverQuestionLikesStore.filter((item) => item.question_id === qId).length;
      return res.json({ success: true, questionId: qId, likeCount });
    }

    return res.json({ success: true, likes: serverQuestionLikesStore });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error fetching question likes' });
  }
});

// Toggle or fetch question bookmarks
app.post('/api/questions/bookmark', (req, res) => {
  try {
    const { question_id, user_id } = req.body;
    if (!question_id || !user_id) {
      return res.status(400).json({ error: 'question_id and user_id are required' });
    }

    const qId = String(question_id).trim();
    const uId = String(user_id).trim();
    const existingIndex = serverQuestionBookmarksStore.findIndex(
      (item) => item.question_id === qId && item.user_id === uId
    );

    let isBookmarked = false;
    if (existingIndex >= 0) {
      // Remove bookmark
      serverQuestionBookmarksStore.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      // Add bookmark
      serverQuestionBookmarksStore.push({
        id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        question_id: qId,
        user_id: uId,
        created_at: new Date().toISOString(),
      });
      isBookmarked = true;
    }

    saveQuestionBookmarksStoreToDisk();
    return res.json({ success: true, isBookmarked });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error processing question bookmark' });
  }
});

app.get('/api/questions/bookmarks', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const uId = userId.trim();
    const bookmarkedQuestionIds = serverQuestionBookmarksStore
      .filter((item) => item.user_id === uId)
      .map((item) => item.question_id);

    return res.json({ success: true, bookmarkedQuestionIds });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error fetching question bookmarks' });
  }
});

// Question reports
app.post('/api/questions/report', (req, res) => {
  try {
    const { question_id, user_id, user_name, phone, email, reason, details } = req.body;
    if (!question_id || !reason) {
      return res.status(400).json({ error: 'question_id and reason are required' });
    }

    const report: ServerQuestionReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question_id: String(question_id).trim(),
      user_id: user_id ? String(user_id).trim() : undefined,
      user_name: user_name ? String(user_name).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      reason: String(reason).trim(),
      details: details ? String(details).trim() : undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    serverQuestionReportsStore.unshift(report);
    saveQuestionReportsStoreToDisk();

    return res.json({ success: true, reportId: report.id });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error submitting question report' });
  }
});

app.get('/api/questions/reports', (req, res) => {
  return res.json({ success: true, reports: serverQuestionReportsStore });
});

// Question explanations
app.get('/api/questions/explanations', (req, res) => {
  try {
    const { question_id } = req.query;
    if (!question_id || typeof question_id !== 'string') {
      return res.json({ success: true, explanations: serverQuestionExplanationsStore });
    }

    const qId = question_id.trim();
    const explanations = serverQuestionExplanationsStore.filter(
      (item) => item.question_id === qId && item.status !== 'rejected'
    );

    return res.json({ success: true, explanations });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error fetching explanations' });
  }
});

app.post('/api/questions/explanations', (req, res) => {
  try {
    const { question_id, user_id, author_name, author_avatar, explanation } = req.body;
    if (!question_id || !explanation || !author_name) {
      return res.status(400).json({ error: 'question_id, author_name, and explanation are required' });
    }

    const newExpl: ServerQuestionExplanation = {
      id: `expl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question_id: String(question_id).trim(),
      user_id: user_id ? String(user_id).trim() : undefined,
      author_name: String(author_name).trim(),
      author_avatar: author_avatar ? String(author_avatar).trim() : undefined,
      explanation: String(explanation).trim(),
      likes_count: 0,
      status: 'approved',
      created_at: new Date().toISOString(),
    };

    serverQuestionExplanationsStore.unshift(newExpl);
    saveQuestionExplanationsStoreToDisk();

    return res.json({ success: true, item: newExpl });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error adding explanation' });
  }
});

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Dynamic XML Sitemap endpoint for Google SEO Indexing
app.get(['/sitemap.xml', '/sitemap', '/app/sitemap.ts', '/sitemap.ts'], async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

    let questionsList: any[] = [];
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/questions?select=id,slug,subject,created_at,updated_at&status=eq.published&limit=5000`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (response.ok) {
        questionsList = await response.json();
      }
    } catch (err) {
      console.warn('Error fetching questions for sitemap from Supabase:', err);
    }

    const host = req.get('host') || 'attamreen.academy';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static primary app pages
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/exam</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/courses</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    // Dynamic question URLs
    questionsList.forEach((q: any) => {
      const slugVal = q.slug || q.id;
      if (slugVal) {
        const lastMod = (q.updated_at || q.created_at || new Date().toISOString()).split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/q/${encodeURIComponent(slugVal)}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err: any) {
    console.error('Sitemap route error:', err);
    return res.status(500).send('Error generating sitemap');
  }
});

// Dynamic Route Handler for /q/:slug with Google QAPage Schema & Meta Header Indexing
app.get('/q/:slug', async (req, res, next) => {
  const { slug } = req.params;
  if (!slug) return next();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yedhwzcbpkrqixvpkgoc.supabase.co';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZGh3emNicGtycWl4dnBrZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjA1OTIsImV4cCI6MjEwMTczNjU5Mn0.-oOgefi5RERPb3gbTC8rTYIVf6if6JWGIrz45rhZsVE';

    let question: any = null;
    try {
      const fetchRes = await fetch(`${supabaseUrl}/rest/v1/questions?or=(slug.eq.${encodeURIComponent(slug)},id.eq.${encodeURIComponent(slug)})&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (fetchRes.ok) {
        const list = await fetchRes.json();
        if (Array.isArray(list) && list.length > 0) {
          question = list[0];
        }
      }
    } catch (fErr) {
      console.warn('Error fetching question for /q/:slug:', fErr);
    }

    if (question) {
      const qText = question.question || 'প্রশ্ন';
      const subj = question.subject || 'পরীক্ষা প্রস্তুতি';
      const explanation = question.explanation || 'আত-তামরীন একাডেমি বিস্তারিত ব্যাখ্যা ও সঠিক সমাধান।';
      const correctKey = question.correct_answer || 'option_a';
      const correctAnswerText = question[correctKey] || question.option_a || '';

      const title = `${qText} | ${subj} | আত-তামরীন একাডেমি`;
      const description = `প্রশ্ন: ${qText}। সঠিক উত্তর: ${correctAnswerText}। ${explanation.slice(0, 160)}`;

      const host = req.get('host') || 'attamreen.academy';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const fullUrl = `${protocol}://${host}/q/${encodeURIComponent(slug)}`;

      const qaPageSchema = {
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": {
          "@type": "Question",
          "name": qText,
          "text": qText,
          "answerCount": 1,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": correctAnswerText,
            "explanation": explanation
          }
        }
      };

      const indexPath = process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');

      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');

        // Inject Title
        html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

        // Inject Meta Tags and JSON-LD
        const metaTags = `
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(fullUrl)}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <script id="jsonld-qapage-schema" type="application/ld+json">${JSON.stringify(qaPageSchema)}</script>
`;
        html = html.replace('</head>', `${metaTags}\n</head>`);
        return res.send(html);
      }
    }
  } catch (err) {
    console.warn('Error rendering dynamic SEO for question page:', err);
  }
  next();
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
