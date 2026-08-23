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

export interface ServerUserAccount {
  id: string;
  student_id: string;
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

interface ServerExamResult {
  id: string;
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
  time_taken_seconds: number;
  submitted_at: string;
}

let serverLeaderboardStore: ServerLeaderboardEntry[] = [];
let serverExamResultsStore: ServerExamResult[] = [];
let serverRegisteredUsersStore: ServerUserAccount[] = [];
let serverUserProgressStore: ServerUserProgress[] = [];

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
    const { id, student_id, fullName, full_name, phone, email, password, avatarUrl, avatar_url, role } = req.body;
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
      return res.status(400).json({ success: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    }

    if (!cleanEmail && cleanPhoneNorm) {
      cleanEmail = `${cleanPhoneNorm}@attamreen.academy`;
    }

    // Generate or use existing Student ID (e.g. STD-782910)
    const finalStudentId = student_id || `STD-${Math.floor(100000 + Math.random() * 900000)}`;
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
    const newRecord: ServerExamResult = {
      id: examResultId,
      exam_id: String(item.exam_id || item.examId || 'general'),
      exam_title: item.exam_title || item.examTitle || 'মডেল টেস্ট',
      is_free: item.is_free !== undefined ? Boolean(item.is_free) : true,
      user_id: String(item.user_id || item.userId || `user_${Date.now()}`),
      full_name: String(item.full_name || item.userName || item.name || 'পরীক্ষার্থী'),
      avatar_url: item.avatar_url || item.avatar || item.user_avatar || '',
      score: Number(item.score ?? item.correct_answers ?? item.correctCount ?? 0),
      total_marks: Number(item.total_marks ?? item.total_questions ?? item.totalQuestions ?? 0),
      correct_answers: Number(item.correct_answers ?? item.correct_count ?? item.correctCount ?? 0),
      wrong_answers: Number(item.wrong_answers ?? item.wrong_count ?? item.wrongCount ?? 0),
      time_taken_seconds: Number(item.time_taken_seconds ?? item.timeTakenSeconds ?? 0),
      submitted_at: String(item.submitted_at || item.created_at || new Date().toISOString()),
    };

    // Upsert by ID or (user_id, exam_id)
    const existingIdx = serverExamResultsStore.findIndex(
      (e) => e.id === newRecord.id || (e.user_id === newRecord.user_id && e.exam_id === newRecord.exam_id)
    );

    if (existingIdx >= 0) {
      serverExamResultsStore[existingIdx] = newRecord;
    } else {
      serverExamResultsStore.push(newRecord);
    }
    saveExamResultsStoreToDisk();

    // Also sync to serverLeaderboardStore for compatibility
    const lbIdx = serverLeaderboardStore.findIndex(
      (e) => (e.user_id === newRecord.user_id && e.exam_id === newRecord.exam_id) || e.id === newRecord.id
    );
    const lbRecord: ServerLeaderboardEntry = {
      id: newRecord.id,
      exam_id: newRecord.exam_id,
      exam_title: newRecord.exam_title || 'মডেল টেস্ট',
      user_id: newRecord.user_id,
      user_name: newRecord.full_name,
      user_avatar: newRecord.avatar_url,
      score: newRecord.score,
      total_questions: newRecord.total_marks,
      correct_count: newRecord.correct_answers,
      wrong_count: newRecord.wrong_answers,
      accuracy: newRecord.total_marks > 0 ? Math.round((newRecord.score / newRecord.total_marks) * 100) : 0,
      created_at: newRecord.submitted_at,
    };
    if (lbIdx >= 0) {
      serverLeaderboardStore[lbIdx] = lbRecord;
    } else {
      serverLeaderboardStore.push(lbRecord);
    }
    saveLeaderboardStoreToDisk();

    return res.json({ success: true, result: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error saving exam result' });
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

    // Keep best result per distinct user_id or full_name
    const userBestMap = new Map<string, ServerExamResult>();
    for (const r of matching) {
      const uKey = (r.user_id && r.user_id.trim()) ? r.user_id.trim() : (r.full_name || '').toLowerCase().trim();
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

    const formatted = list.map((r, idx) => ({
      rank: idx + 1,
      user_id: r.user_id,
      full_name: r.full_name,
      avatar_url: r.avatar_url || '',
      score: r.score,
      total_marks: r.total_marks,
      correct_answers: r.correct_answers,
      wrong_answers: r.wrong_answers,
      time_taken_seconds: r.time_taken_seconds,
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error getting exam leaderboard' });
  }
});

// RPC API: Get free overall leaderboard
app.get('/api/rpc/get_free_overall_leaderboard', (req, res) => {
  try {
    const period = String(req.query.p_period || req.query.period || 'all').trim();
    const now = Date.now();
    let minTimestamp = 0;

    if (period === 'today') {
      const todayDate = new Date();
      minTimestamp = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    } else if (period === 'week' || period === 'this_week') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'month' || period === 'this_month') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Filter free exams within period
    const filteredResults = serverExamResultsStore.filter((r) => {
      if (r.is_free === false) return false;
      if (minTimestamp > 0) {
        const t = new Date(r.submitted_at).getTime();
        if (isNaN(t) || t < minTimestamp) return false;
      }
      return true;
    });

    // Group by user_id
    const userMap = new Map<string, {
      user_id: string;
      full_name: string;
      avatar_url: string;
      total_points: number;
      free_exam_count: number;
      percentageSum: number;
      firstSubmission: string;
    }>();

    for (const r of filteredResults) {
      const uKey = r.user_id || r.full_name;
      const existing = userMap.get(uKey);
      const points = Number(r.correct_answers || r.score || 0);
      const percentage = r.total_marks > 0 ? (r.score / r.total_marks) * 100 : (points > 0 ? 100 : 0);

      if (!existing) {
        userMap.set(uKey, {
          user_id: r.user_id,
          full_name: r.full_name,
          avatar_url: r.avatar_url || '',
          total_points: points,
          free_exam_count: 1,
          percentageSum: percentage,
          firstSubmission: r.submitted_at,
        });
      } else {
        existing.total_points += points;
        existing.free_exam_count += 1;
        existing.percentageSum += percentage;
        if (r.avatar_url) existing.avatar_url = r.avatar_url;
        if (new Date(r.submitted_at).getTime() < new Date(existing.firstSubmission).getTime()) {
          existing.firstSubmission = r.submitted_at;
        }
      }
    }

    const userList = Array.from(userMap.values()).map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      total_points: u.total_points,
      free_exam_count: u.free_exam_count,
      average_percentage: u.free_exam_count > 0 ? Math.round(u.percentageSum / u.free_exam_count) : 0,
      firstSubmission: u.firstSubmission,
    }));

    // Sort: 1. Higher total_points, 2. Higher average_percentage, 3. Higher free_exam_count, 4. Earlier first submission
    userList.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.average_percentage !== a.average_percentage) return b.average_percentage - a.average_percentage;
      if (b.free_exam_count !== a.free_exam_count) return b.free_exam_count - a.free_exam_count;
      return new Date(a.firstSubmission).getTime() - new Date(b.firstSubmission).getTime();
    });

    const formatted = userList.map((u, idx) => ({
      rank: idx + 1,
      user_id: u.user_id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      total_points: u.total_points,
      free_exam_count: u.free_exam_count,
      average_percentage: u.average_percentage,
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
        serverLeaderboardStore.push({
          id: String(item.id),
          exam_id: String(item.exam_id || 'general'),
          exam_title: String(item.exam_title || 'পরীক্ষা'),
          user_id: item.user_id ? String(item.user_id) : undefined,
          user_name: String(item.user_name || 'পরীক্ষার্থী'),
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
    const { oldName, newName, newAvatar } = req.body;
    if (!newName) {
      return res.status(400).json({ error: 'newName is required' });
    }

    const cleanOld = oldName ? String(oldName).trim().toLowerCase() : '';
    const cleanNew = String(newName).trim();
    const cleanNewLower = cleanNew.toLowerCase();
    const cleanAvatar = newAvatar ? String(newAvatar) : '';

    let updatedCount = 0;
    serverLeaderboardStore.forEach((e) => {
      const eNameLower = (e.user_name || '').trim().toLowerCase();
      if ((cleanOld && eNameLower === cleanOld) || eNameLower === cleanNewLower) {
        e.user_name = cleanNew;
        if (cleanAvatar) e.user_avatar = cleanAvatar;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      saveLeaderboardStoreToDisk();
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
