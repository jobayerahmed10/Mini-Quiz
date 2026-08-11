import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
