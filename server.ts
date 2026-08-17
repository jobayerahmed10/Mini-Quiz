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

// Shared Server Leaderboard & Exam Results Persistence
const LEADERBOARD_FILE_PATH = path.join(process.cwd(), 'leaderboard_store.json');
const EXAM_RESULTS_FILE_PATH = path.join(process.cwd(), 'exam_results_store.json');

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

try {
  if (fs.existsSync(LEADERBOARD_FILE_PATH)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      serverLeaderboardStore = parsed.filter((e) => e && e.id && !String(e.id).startsWith('seed_lb_'));
    }
  }
} catch (err) {
  console.warn('Could not read leaderboard_store.json:', err);
  serverLeaderboardStore = [];
}

try {
  if (fs.existsSync(EXAM_RESULTS_FILE_PATH)) {
    const raw = fs.readFileSync(EXAM_RESULTS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      serverExamResultsStore = parsed;
    }
  }
} catch (err) {
  console.warn('Could not read exam_results_store.json:', err);
  serverExamResultsStore = [];
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
    const examId = String(req.query.p_exam_id || req.query.exam_id || '').trim();
    if (!examId || examId === 'all') {
      return res.json({ success: true, data: [] });
    }

    // Filter matching exam results
    const matching = serverExamResultsStore.filter(
      (r) => r.exam_id === examId || (r.exam_title && r.exam_title === examId)
    );

    // Keep best result per distinct user_id
    const userBestMap = new Map<string, ServerExamResult>();
    for (const r of matching) {
      const uKey = r.user_id || r.full_name;
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
