import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Maximize2,
  ArrowUp,
} from 'lucide-react';
import { ImageGeneration } from '../types';
import { Language, translations } from '../translations';

interface ImageViewProps {
  lang?: Language;
}

export const ImageView: React.FC<ImageViewProps> = ({ lang = 'ar' }) => {
  const t = translations[lang];

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(lang === 'ar' ? 'سينمائي' : 'Cinematic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const [history, setHistory] = useState<ImageGeneration[]>([
    {
      id: 'demo-1',
      prompt:
        lang === 'ar'
          ? 'مدينة مستقبلية بتصميم هندسي إسلامي وأضواء نيون سماوية وزرقاء'
          : 'Futuristic metropolis with geometric architecture and glowing cyan neon lights',
      style: lang === 'ar' ? 'سينمائي' : 'Cinematic',
      aspectRatio: '16:9',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'demo-2',
      prompt:
        lang === 'ar'
          ? 'صقر حر محلق في الفضاء محاط بسديم كوني من النجوم البراقة'
          : 'Free falcon soaring through celestial nebula and glowing stars',
      style: lang === 'ar' ? 'خيالي' : 'Fantasy',
      aspectRatio: '1:1',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      timestamp: Date.now() - 7200000,
    },
  ]);

  const styles =
    lang === 'ar'
      ? ['سينمائي', 'أرابيسك', 'خيالي', 'ثلاثي الأبعاد', 'أنمي']
      : ['Cinematic', 'Arabesque', 'Fantasy', '3D Render', 'Anime'];

  const ratios = ['1:1', '16:9', '9:16'];

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    try {
      setIsEnhancing(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content:
                lang === 'ar'
                  ? `حسّن هذا الوصف باختصار في سطر واحد فقط لإنتاج عمل فني مبهر: "${prompt}"`
                  : `Enhance this visual prompt in one concise descriptive line for elite image generation: "${prompt}"`,
            },
          ],
          thinkingLevel: 'LOW',
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let enhanced = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) enhanced += parsed.text;
              } catch (_) {}
            }
          }
        }
      }
      if (enhanced.trim()) setPrompt(enhanced.trim());
    } catch (e) {
      console.warn(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
        }),
      });

      setError(null);
      if (!res.ok) throw new Error('فشل إنشاء الصورة');
      const data = await res.json();

      if (data.imageUrl) {
        const newGen: ImageGeneration = {
          id: `img-${Date.now()}`,
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
          enhancedPrompt: data.enhancedPrompt,
        };
        setHistory([newGen, ...history]);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-6 pt-4 pb-24">
      <div className="max-w-4xl mx-auto w-full space-y-5">
        {/* Minimal iOS Floating Prompt Card */}
        <div className="ios-glass rounded-3xl p-3 sm:p-4 shadow-xl border border-sky-400/20">
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="space-y-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.imagePromptPlaceholder}
                rows={2}
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm p-2 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || isEnhancing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] disabled:opacity-30 transition-all border border-sky-400/20 cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 text-sky-400 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? '...' : t.enhancePrompt}</span>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
              {/* Styles */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {styles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStyle(s)}
                    className={`px-2.5 py-1 rounded-xl text-xs transition-all ${
                      selectedStyle === s
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 font-medium'
                        : 'text-slate-400 hover:text-white bg-white/[0.02]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio & Generate */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.04]">
                  {ratios.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRatio(r)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                        selectedRatio === r
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-30 transition-all shadow-md"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5 text-slate-950" />
                  )}
                  <span>{isLoading ? t.generatingImage : t.generateImage}</span>
                </motion.button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ios-glass rounded-3xl overflow-hidden group relative border border-white/[0.08]"
            >
              <div className="aspect-square relative overflow-hidden bg-slate-950/40">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedImageModal(item.imageUrl)}
                    className="p-2 rounded-2xl bg-slate-900/80 text-white hover:bg-sky-500 hover:text-slate-950 transition-colors"
                    title={t.zoomImage}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <a
                    href={item.imageUrl}
                    download={`shadow-image-${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-2xl bg-slate-900/80 text-white hover:bg-sky-500 hover:text-slate-950 transition-colors"
                    title={t.downloadImage}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => copyPrompt(item.prompt, item.id)}
                    className="p-2 rounded-2xl bg-slate-900/80 text-white hover:bg-sky-500 hover:text-slate-950 transition-colors"
                    title={t.copy}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs text-slate-300 truncate">{item.prompt}</p>
                <span className="text-[10px] text-sky-400 font-medium">{item.style}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl p-4 flex items-center justify-center cursor-pointer"
        >
          <img
            src={selectedImageModal}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-3xl shadow-2xl border border-sky-400/30"
          />
        </div>
      )}
    </div>
  );
};
