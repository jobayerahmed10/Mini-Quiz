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

// Shared Server Leaderboard Persistence
const LEADERBOARD_FILE_PATH = path.join(process.cwd(), 'leaderboard_store.json');

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

let serverLeaderboardStore: ServerLeaderboardEntry[] = [];

try {
  if (fs.existsSync(LEADERBOARD_FILE_PATH)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Remove any legacy seed / dummy entries if present
      serverLeaderboardStore = parsed.filter((e) => e && e.id && !String(e.id).startsWith('seed_lb_'));
    }
  }
} catch (err) {
  console.warn('Could not read leaderboard_store.json:', err);
  serverLeaderboardStore = [];
}

function saveLeaderboardStoreToDisk() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE_PATH, JSON.stringify(serverLeaderboardStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write leaderboard_store.json:', err);
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

// API endpoint for Gemini generation (Ustad AI & Tamreen AI Explanations)
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
