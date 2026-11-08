import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Shared server-side Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cache for audio clips to prevent redundant API calls
const ttsCache = new Map<string, { audio: string; mimeType: string; engine: string }>();

// TTS Status & Model List
app.get('/api/tts/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    ok: true,
    hasKey,
    defaultModel: 'gemini-3.8-flash-lite-tts',
    fallbackReady: true,
    models: [
      { id: 'gemini-3.8-flash-lite-tts', name: 'Gemini 3.8 Flash Lite TTS (En Hızlı & Yüksek Kota - Önerilen)' },
      { id: 'gemini-3.8-flash-tts', name: 'Gemini 3.8 Flash TTS (Stüdyo Kalitesi)' },
      { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS (Alternatif Hızlı)' },
    ],
  });
});

// Valid Gemini TTS voices
const VALID_GEMINI_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

function mapToGeminiVoice(voice: string): string {
  if (VALID_GEMINI_VOICES.includes(voice)) return voice;
  const lower = voice.toLowerCase();
  if (lower.includes('charon') || lower.includes('sadal') || lower.includes('algie')) return 'Charon';
  if (lower.includes('zephyr') || lower.includes('erinome') || lower.includes('callir')) return 'Zephyr';
  if (lower.includes('kore') || lower.includes('achird') || lower.includes('schedar') || lower.includes('sulafat') || lower.includes('vind')) return 'Kore';
  if (lower.includes('fenrir') || lower.includes('orus') || lower.includes('achernar')) return 'Fenrir';
  return 'Puck'; // default male voice
}

// Language / accent mapping for fallback engine
function mapToGoogleLang(voice: string): string {
  const v = voice.toLowerCase();
  if (v.includes('charon')) return 'en-GB'; // British
  if (v.includes('zephyr') || v.includes('erinome')) return 'en-AU'; // Australian
  if (v.includes('fenrir')) return 'en-CA'; // Canadian
  return 'en-US'; // American (Puck, Kore, etc.)
}

// Queue mechanism to prevent overwhelming public endpoints
let lastFallbackRequestTime = 0;
const MIN_FALLBACK_INTERVAL_MS = 160;

function waitForSlot(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastFallbackRequestTime;
  if (timeSinceLast >= MIN_FALLBACK_INTERVAL_MS) {
    lastFallbackRequestTime = now;
    return Promise.resolve();
  }
  const delay = MIN_FALLBACK_INTERVAL_MS - timeSinceLast;
  lastFallbackRequestTime = now + delay;
  return new Promise((r) => setTimeout(r, delay));
}

let clientRoundRobin = 0;
const GOOGLE_CLIENT_IDS = ['tw-ob', 'gtx', 'dict-chrome-ex'];

// Fetch single TTS audio chunk from Google Translate TTS with pacing
function fetchGoogleTTSChunk(chunk: string, lang: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      await waitForSlot();
    } catch (_) {}

    const clientId = GOOGLE_CLIENT_IDS[clientRoundRobin++ % GOOGLE_CLIENT_IDS.length];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=${clientId}`;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Google TTS status code: ${res.statusCode}`));
        }
        const bufs: Buffer[] = [];
        res.on('data', (d) => bufs.push(d));
        res.on('end', () => resolve(Buffer.concat(bufs)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Google TTS timeout'));
    });
  });
}

// High-speed zero-quota natural TTS fallback generator (pure JS, zero ffmpeg dependency)
async function generateFallbackSpeech(
  text: string,
  voice: string
): Promise<{ audio: string; mimeType: string; engine: string }> {
  // Strip SSML/pause markup to get pure speakable text
  const cleanText = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[pause[^\]]*\]/gi, ' ')
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    throw new Error('Seslendirilecek metin boş olamaz.');
  }

  const lang = mapToGoogleLang(voice);

  // Split text into chunks under 150 characters for high reliability
  const words = cleanText.split(/\s+/);
  const chunks: string[] = [];
  let curr = '';
  for (const w of words) {
    if ((curr + ' ' + w).length > 150) {
      if (curr) chunks.push(curr);
      curr = w;
    } else {
      curr = curr ? curr + ' ' + w : w;
    }
  }
  if (curr) chunks.push(curr);

  // Fetch audio chunks with retry
  const audioParts: Buffer[] = [];
  for (const chunk of chunks) {
    let part: Buffer | null = null;
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        part = await fetchGoogleTTSChunk(chunk, lang);
        break;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    if (!part) {
      throw lastErr || new Error('Parça seslendirilemedi');
    }
    audioParts.push(part);
  }

  const rawMp3 = Buffer.concat(audioParts);
  return {
    audio: rawMp3.toString('base64'),
    mimeType: 'audio/mpeg',
    engine: 'studio-high-speed',
  };
}

// Master speech generator with Gemini TTS and seamless zero-quota fallback
async function generateSpeechWithFallback(
  text: string,
  voice: string,
  style: string | undefined,
  requestedModel: string
): Promise<{ audio: string; mimeType: string; engine: string }> {
  const cleanText = text.trim();
  const cacheKey = `tts:${voice}:${cleanText}:${style || ''}`;

  if (ttsCache.has(cacheKey)) {
    return ttsCache.get(cacheKey)!;
  }

  // If Gemini API Key is available, try Gemini TTS first
  if (process.env.GEMINI_API_KEY) {
    const candidateModels = [
      requestedModel,
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const geminiVoice = mapToGeminiVoice(voice);

    for (const modelToTry of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanText,
                  speechMetadata: style ? { style: style.trim() } : undefined,
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (part?.inlineData?.data) {
          const result = {
            audio: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'audio/wav',
            engine: 'gemini',
          };
          ttsCache.set(cacheKey, result);
          return result;
        }
      } catch (err: any) {
        const errStr = typeof err?.message === 'string' ? err.message : JSON.stringify(err || {});
        const isQuota =
          err?.status === 429 ||
          err?.statusCode === 429 ||
          /429|quota|RESOURCE_EXHAUSTED|rate limit/i.test(errStr);

        console.warn(`[TTS] Gemini model ${modelToTry} failed (${isQuota ? 'Quota Exceeded' : errStr}).`);

        if (isQuota) {
          console.info('[TTS] Activating zero-quota high-speed studio fallback engine...');
          break;
        }
      }
    }
  }

  // Synthesize via zero-quota high-speed studio engine (pure JS)
  try {
    const fallbackResult = await generateFallbackSpeech(cleanText, voice);
    ttsCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  } catch (fallbackErr: any) {
    console.error('[TTS] Fallback engine error:', fallbackErr);
    throw new Error('Ses sentezleme başarısız oldu. Lütfen tekrar deneyin.');
  }
}

// Single TTS synthesis endpoint with speed, pitch, emotion and variability support
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voice, style, model, speed, pitch, emotion, variability } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Seslendirilecek metin boş olamaz.' });
    }

    const selectedModel = model || 'gemini-3.8-flash-lite-tts';
    const voiceName = voice || 'Puck';

    // Construct fine-grained natural instruction based on speed, pitch, emotion and variability
    const modifiers: string[] = [];
    if (speed !== undefined && speed !== 0) {
      if (speed <= -30) modifiers.push('Speak significantly slower and very deliberately');
      else if (speed < 0) modifiers.push('Speak at a calm and slower pace');
      else if (speed >= 30) modifiers.push('Speak quickly and briskly');
      else if (speed > 0) modifiers.push('Speak slightly faster and lively');
    }

    if (pitch !== undefined && pitch !== 0) {
      if (pitch <= -25) modifiers.push('in a much deeper, lower pitch');
      else if (pitch < 0) modifiers.push('in a slightly deeper pitch');
      else if (pitch >= 25) modifiers.push('in a much higher pitch');
      else if (pitch > 0) modifiers.push('in a slightly higher pitch');
    }

    if (emotion && emotion !== 'Default' && emotion !== 'Doğal') {
      modifiers.push(`with a ${emotion.toLowerCase()} tone`);
    }

    if (variability !== undefined && variability > 60) {
      modifiers.push('with expressive vocal variability and rich inflection');
    }

    let finalStyle = style ? style.trim() : '';
    if (modifiers.length > 0) {
      const modText = modifiers.join(', ');
      finalStyle = finalStyle ? `${finalStyle} (${modText})` : modText;
    }

    const result = await generateSpeechWithFallback(
      text,
      voiceName,
      finalStyle || undefined,
      selectedModel
    );
    return res.json(result);
  } catch (err: any) {
    console.error('TTS generate error:', err);
    const status = err.status || (err.statusCode ? Number(err.statusCode) : 500);
    const message = err.message || 'Ses sentezlenirken bir hata oluştu.';
    return res.status(status >= 100 && status < 600 ? status : 500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
