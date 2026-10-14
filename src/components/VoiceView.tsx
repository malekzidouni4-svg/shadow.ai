import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  ArrowUp,
  Volume2,
} from 'lucide-react';
import { Language, translations } from '../translations';

interface VoiceViewProps {
  lang?: Language;
}

export const VoiceView: React.FC<VoiceViewProps> = ({ lang = 'ar' }) => {
  const t = translations[lang];

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voices = [
    { id: 'Kore', name: 'Kore', tone: lang === 'ar' ? 'هادئ ومتزن' : 'Calm & Balanced' },
    { id: 'Puck', name: 'Puck', tone: lang === 'ar' ? 'حيوي وودود' : 'Vibrant & Warm' },
    { id: 'Charon', name: 'Charon', tone: lang === 'ar' ? 'عميق ورصين' : 'Deep & Authoritative' },
    { id: 'Fenrir', name: 'Fenrir', tone: lang === 'ar' ? 'قوي وحاسم' : 'Crisp & Strong' },
    { id: 'Zephyr', name: 'Zephyr', tone: lang === 'ar' ? 'ناعم وأثيري' : 'Gentle & Soft' },
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;

    try {
      setIsLoading(true);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim().slice(0, 450),
          voice: selectedVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioData) {
          const url = `data:audio/wav;base64,${data.audioData}`;
          setAudioUrl(url);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play();
          setIsPlaying(true);
          audio.onended = () => setIsPlaying(false);
          return;
        }
      }

      // Seamless fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        setError(lang === 'ar' ? 'تعذر تشغيل الصوت' : 'Audio playback failed');
      }
    } catch (err: any) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        setError(err.message || 'حدث خطأ أثناء تركيب الصوت');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-6 pt-4 pb-24">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* iOS Frosted Audio Card */}
        <div className="ios-glass rounded-3xl p-4 shadow-xl border border-sky-400/20 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.voiceInputPlaceholder}
            rows={3}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm p-2 focus:outline-none resize-none leading-relaxed"
          />

          {/* Voice Selectors & Synthesis Trigger */}
          <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                    selectedVoice === v.id
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 font-medium'
                      : 'text-slate-400 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  <span className="font-semibold">{v.name}</span>
                  <span className="text-[10px] text-slate-500 block">{v.tone}</span>
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={!text.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-30 transition-all shadow-md"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{isLoading ? t.generatingVoice : t.generateVoice}</span>
            </motion.button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Audio Wave Player Card */}
        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ios-glass rounded-3xl p-4 shadow-xl border border-sky-400/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-slate-950 flex items-center justify-center hover:scale-105 transition-transform shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-white block">
                  {lang === 'ar' ? 'التسجيل الصوتي العصبي' : 'Neural Speech Output'}
                </span>
                <span className="text-[10px] text-sky-300 font-mono">
                  Voice: {selectedVoice}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dynamic Soundwave Bars */}
              <div className="flex items-center gap-1 h-6 px-3">
                {[12, 20, 16, 24, 18, 22, 14, 20].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlaying ? `${h}px` : '4px' }}
                    className={`w-1 rounded-full bg-sky-400 transition-all duration-200 ${
                      isPlaying ? 'animate-pulse' : 'opacity-40'
                    }`}
                  />
                ))}
              </div>

              <a
                href={audioUrl}
                download={`shadow-voice-${Date.now()}.wav`}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                title="Download Audio"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
