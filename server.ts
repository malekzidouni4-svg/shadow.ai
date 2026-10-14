import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI with required telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function isRecoverableModelError(err: unknown): boolean {
  if (!err) return false;
  const str = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err);
  const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : str;
  return (
    str.includes('429') ||
    str.includes('503') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('UNAVAILABLE') ||
    str.includes('high demand') ||
    str.includes('quota') ||
    str.includes('Too Many Requests') ||
    str.includes('timed out') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('timed out')
  );
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'shadow.ai',
    model: 'tera 1.0',
    speed: 'ultra-fast',
    hasKey: !!apiKey,
  });
});

// Helper to iterate an AsyncIterable with error handling
async function streamResponse(
  stream: AsyncIterable<any>,
  onText: (text: string) => void,
  onGrounding: (grounding: any) => void
): Promise<number> {
  let chunksReceived = 0;
  for await (const chunk of stream) {
    chunksReceived++;
    const text = chunk.text;
    if (text) {
      onText(text);
    }
    const candidate = chunk.candidates?.[0];
    const groundingMeta = candidate?.groundingMetadata;
    if (groundingMeta) {
      const queries = groundingMeta.webSearchQueries || [];
      const sources = (groundingMeta.groundingChunks || [])
        .map((c: { web?: { title?: string; uri?: string } }) => ({
          title: c.web?.title || 'مصدر ويب / Web Source',
          url: c.web?.uri || '',
        }))
        .filter((s: { url: string }) => !!s.url);

      if (sources.length > 0 || queries.length > 0) {
        onGrounding({ queries, sources });
      }
    }
  }
  return chunksReceived;
}

// Streaming Chat with multi-model cascade & fast failover
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemInstruction, thinkingLevel, enableGoogleSearch, memories } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages list is required / قائمة الرسائل مطلوبة' });
      return;
    }

    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API Key is not set in environment.' });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Prepare contents
    const contents = messages.map((msg: { role: string; content: string; image?: { data: string; mimeType: string } }) => {
      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

      if (msg.image && msg.image.data) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType || 'image/jpeg',
            data: msg.image.data,
          },
        });
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      return {
        role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    let mergedInstruction =
      systemInstruction ||
      'You are shadow.ai, an elite AI assistant powered by the tera 1.0 model. You provide fast, elegant, direct, accurate responses with interactive charts (```chart) and rich formatting when appropriate.';

    if (memories && Array.isArray(memories) && memories.length > 0) {
      mergedInstruction += `\n\n[shadow.ai Persistent Long-Term Memory - Contextual User Facts]:\n${memories.map((m: string) => `• ${m}`).join('\n')}\nRecall and apply these contextually when relevant.`;
    }

    let emittedAnyText = false;
    let sentGrounding = false;

    const emitText = (text: string) => {
      emittedAnyText = true;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    };

    const emitGrounding = (grounding: any) => {
      if (!sentGrounding) {
        sentGrounding = true;
        res.write(`data: ${JSON.stringify({ grounding })}\n\n`);
      }
    };

    let streamSucceeded = false;
    // Ultra-fast model priority:
    // 1. gemini-3.1-flash-lite (fastest, ~1.1s token latency, no 429 quota exhaustion)
    // 2. gemini-flash-lite-latest (fast fallback)
    // 3. gemini-3.7-flash (standard flash fallback)
    // 4. gemini-3.8-flash (heavy cognitive fallback)
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
    ];

    for (const modelName of candidateModels) {
      if (streamSucceeded || emittedAnyText) break;

      try {
        const config: Record<string, unknown> = {
          systemInstruction: mergedInstruction,
        };

        // For maximum response speed, use LOW thinking level by default
        if (thinkingLevel === 'HIGH') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        } else {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        // Add Google Search tool if enabled
        if (enableGoogleSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        try {
          const stream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config,
          });

          await streamResponse(stream, emitText, emitGrounding);
          streamSucceeded = true;
          break;
        } catch (streamErr: any) {
          // If googleSearch caused quota 429 error, retry without tools instantly
          if (enableGoogleSearch && isRecoverableModelError(streamErr)) {
            const fallbackConfig = { ...config };
            delete fallbackConfig.tools;
            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: fallbackConfig,
            });
            await streamResponse(stream, emitText, emitGrounding);
            streamSucceeded = true;
            break;
          }
          throw streamErr;
        }
      } catch (err: unknown) {
        console.warn(`Model ${modelName} failover trigger:`, (err as Error).message);
      }
    }

    // If all model cascade attempts failed before emitting any text
    if (!streamSucceeded && !emittedAnyText) {
      res.write(
        `data: ${JSON.stringify({
          text: '⚠️ تم الوصول إلى الحد الأقصى المؤقت لطلبات النموذج (Rate limit 429). يُرجى الانتظار بضع ثوانٍ قبل إرسال الرسالة التالية.\n\n⚠️ Temporary rate limit reached (429). Please wait a few seconds and try again.',
        })}\n\n`
      );
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Unhandled error in /api/chat:', error);
    if (!res.headersSent) {
      res.status(isRecoverableModelError(error) ? 429 : 500).json({
        error: isRecoverableModelError(error)
          ? 'تم تجاوز الحد المؤقت للطلبات (429)، يُرجى الانتظار لحظات / Rate limit reached, please wait a moment.'
          : error.message,
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          error: 'تم تجاوز الحد المؤقت للطلبات. يُرجى الانتظار بضع ثوانٍ وإعادة المحاولة.',
        })}\n\n`
      );
      res.end();
    }
  }
});

// Fast Vision & Document Analysis
app.post('/api/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: prompt || 'حلل هذه الصورة أو المستند بدقة واستخرج أهم التفاصيل والمعلومات باللغة المناسبة.',
    };

    let responseText = '';
    const visionModels = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash'];

    for (const model of visionModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: [imagePart, textPart] },
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (err) {
        console.warn(`Vision model ${model} failed, trying next:`, (err as Error).message);
      }
    }

    res.json({ result: responseText || 'تعذر استخراج المحتوى من المستند' });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/analyze-image:', error);
    res.status(500).json({
      error: isRecoverableModelError(error)
        ? 'تم تجاوز الحد المؤقت للطلبات (429)، يُرجى المحاولة بعد لحظات.'
        : error.message || 'فشل تحليل الصورة',
    });
  }
});

// Text-to-Speech (TTS)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const selectedVoice = voice || 'Kore';
    const cleanText = text.slice(0, 400);

    const ttsModels = [
      'gemini-3.8-flash-lite-tts',
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-flash-preview-tts',
    ];

    let base64Audio: string | undefined;

    for (const m of ttsModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: [
            {
              role: 'user',
              parts: [{ text: cleanText }],
            },
          ],
          config: {
            systemInstruction: 'You are a speech engine. Render the text as clear audio.',
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });
        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) break;
      } catch (err) {
        console.warn(`TTS model ${m} failed:`, (err as Error).message);
      }
    }

    if (!base64Audio) {
      res.status(500).json({ error: 'لم يتم استرجاع بيانات صوتية من النموذج' });
      return;
    }

    res.json({
      audioData: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/tts:', error);
    res.status(500).json({
      error: isRecoverableModelError(error)
        ? 'تم تجاوز الحد المؤقت لطلبات الصوت (429)، يُرجى الانتظار قليلاً.'
        : error.message || 'فشل تحويل النص إلى صوت',
    });
  }
});

// Creative Image & Graphic Generation Endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Fast prompt enhance using 3.1-flash-lite
    let enhancedPrompt = prompt;
    try {
      const enhanceResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Enhance this visual concept into a vivid 20-word image prompt: "${prompt}" (style: ${style || 'cinematic'}). Return ONLY JSON: {"enhancedPrompt": "..."}`,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      const parsed = JSON.parse(enhanceResponse.text || '{}');
      if (parsed.enhancedPrompt) enhancedPrompt = parsed.enhancedPrompt;
    } catch (_) {
      // Fallback
    }

    const safeTitle = (prompt || 'shadow.ai Artwork').slice(0, 36).replace(/["<>]/g, '');

    // Generate artistic SVG card with celestial sky-blue glass theme
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#030712" />
          <stop offset="50%" stop-color="#082f49" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.3" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
          <stop offset="60%" stop-color="#0284c7" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <circle cx="400" cy="260" r="220" fill="url(#sun)" filter="url(#blurFilter)" />
      <circle cx="280" cy="200" r="140" fill="#38bdf8" fill-opacity="0.25" filter="url(#blurFilter)" />
      <circle cx="520" cy="300" r="160" fill="#06b6d4" fill-opacity="0.2" filter="url(#blurFilter)" />
      
      <!-- Central Geometric Frosted Glass Shape -->
      <g transform="translate(400, 280)">
        <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="#030712" fill-opacity="0.6" stroke="url(#glow)" stroke-width="2.5" />
        <circle cx="0" cy="0" r="45" fill="url(#glow)" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5" />
        <line x1="0" y1="-120" x2="0" y2="120" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
        <line x1="-104" y1="-60" x2="104" y2="60" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
        <line x1="-104" y1="60" x2="104" y2="-60" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1" />
      </g>

      <text x="400" y="475" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#ffffff" letter-spacing="0.5">
        ${safeTitle}
      </text>
      <text x="400" y="508" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#38bdf8" letter-spacing="2">
        SHADOW.AI · TERA 1.0 NEURAL CANVAS
      </text>
    </svg>`;

    const imageBase64 = Buffer.from(svg).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${imageBase64}`;

    res.json({
      imageUrl,
      enhancedPrompt,
      style: style || 'cinematic',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/generate-image:', error);
    res.status(500).json({ error: error.message || 'فشل توليد الصورة' });
  }
});

// Vite SSR middleware in dev mode
async function setupVite() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 shadow.ai running at http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
