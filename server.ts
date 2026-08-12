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

// Load initial data from disk if exists, or seed initial demo entries for active competition
const INITIAL_SEED_LEADERBOARD: ServerLeaderboardEntry[] = [
  {
    id: 'seed_lb_1',
    exam_id: 'free-ntrca-1',
    exam_title: '১৮তম শিক্ষক নিবন্ধন (NTRCA) মডেল টেস্ট - ০১',
    user_id: 'usr_seed_1',
    user_name: 'তানভীর আহমেদ',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    score: 48,
    total_questions: 50,
    correct_count: 48,
    wrong_count: 2,
    accuracy: 96,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'seed_lb_2',
    exam_id: 'free-ntrca-1',
    exam_title: '১৮তম শিক্ষক নিবন্ধন (NTRCA) মডেল টেস্ট - ০১',
    user_id: 'usr_seed_2',
    user_name: 'নুসরাত জাহান',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    score: 46,
    total_questions: 50,
    correct_count: 46,
    wrong_count: 4,
    accuracy: 92,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'seed_lb_3',
    exam_id: 'free-topic-1',
    exam_title: 'সহকারী মৌলভী বিষয়ভিত্তিক ফ্রি প্র্যাকটিস টেস্ট',
    user_id: 'usr_seed_3',
    user_name: 'মেহেদী হাসান',
    user_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    score: 28,
    total_questions: 30,
    correct_count: 28,
    wrong_count: 2,
    accuracy: 93.33,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'seed_lb_4',
    exam_id: 'vip-mega-1',
    exam_title: 'ভিআইপি প্রভাষক (আরবি ক্যাডার) প্রিমিয়াম মেগা মডেল টেস্ট',
    user_id: 'usr_seed_4',
    user_name: 'ফাতেমা খাতুন',
    user_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    score: 92,
    total_questions: 100,
    correct_count: 92,
    wrong_count: 8,
    accuracy: 92,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'seed_lb_5',
    exam_id: 'free-live-1',
    exam_title: 'আগামীকালের লাইভ সাবজেক্ট উইকলি ব্যাটল',
    user_id: 'usr_seed_5',
    user_name: 'রাকিবুল ইসলাম',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    score: 38,
    total_questions: 40,
    correct_count: 38,
    wrong_count: 2,
    accuracy: 95,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'seed_lb_6',
    exam_id: 'free-ntrca-1',
    exam_title: '১৮তম শিক্ষক নিবন্ধন (NTRCA) মডেল টেস্ট - ০১',
    user_id: 'usr_seed_6',
    user_name: 'শামীমা সুলতানা',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    score: 44,
    total_questions: 50,
    correct_count: 44,
    wrong_count: 6,
    accuracy: 88,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

try {
  if (fs.existsSync(LEADERBOARD_FILE_PATH)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE_PATH, 'utf-8');
    serverLeaderboardStore = JSON.parse(raw);
  }
  if (!serverLeaderboardStore || serverLeaderboardStore.length === 0) {
    serverLeaderboardStore = [...INITIAL_SEED_LEADERBOARD];
    saveLeaderboardStoreToDisk();
  }
} catch (err) {
  console.warn('Could not read leaderboard_store.json:', err);
  serverLeaderboardStore = [...INITIAL_SEED_LEADERBOARD];
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
          'আপনি আত-তামরীন একাডেমির "উস্তাদ এআই" স্মার্ট টিউটর। বাংলাদেশ শিক্ষক নিবন্ধন (NTRCA), মাদ্রাসা ও বিসিএস পরীক্ষার পরীক্ষার্থীদের জন্য সহজ ও শিক্ষণীয় ভাষায় বিস্তারিত উত্তর, ব্যাখ্যা ও গুরুত্বপূর্ণ পরামর্শ প্রদান করুন। সুন্দর ও স্পষ্ট ব্যাকগ্রাউন্ড সহ পয়েন্ট করে উত্তর দিন।',
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
