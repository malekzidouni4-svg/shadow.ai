import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Paperclip,
  X,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Square,
  ArrowUp,
  Search,
  ExternalLink,
  Mic,
  MicOff,
  BarChart2,
  Download,
} from 'lucide-react';
import { Message, Persona } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Language, translations } from '../translations';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => Promise<void>;
  isStreaming: boolean;
  onStopStreaming: () => void;
  selectedPersona: Persona;
  onResetChat: () => void;
  enableGoogleSearch: boolean;
  setEnableGoogleSearch: (val: boolean) => void;
  lang: Language;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  selectedPersona,
  onResetChat,
  lang,
}) => {
  const t = translations[lang];

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingTtsId, setLoadingTtsId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isExported, setIsExported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      setSpeechError(lang === 'ar' ? 'خاصية التعرف على الصوت غير مدعومة في هذا المتصفح' : 'Speech recognition not supported');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setSelectedImage({
          data: base64String,
          mimeType: file.type || 'image/png',
          preview: URL.createObjectURL(file),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedImage) || isStreaming) return;

    const text = input;
    const img = selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined;

    setInput('');
    setSelectedImage(null);
    onSendMessage(text, img);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export full chat as Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const lines = [
      `# shadow.ai - Conversation with ${lang === 'en' ? selectedPersona.nameEn : selectedPersona.name}`,
      `*Model: tera 1.0 | Date: ${new Date().toLocaleString()}*`,
      '',
    ];

    messages.forEach((m) => {
      const role = m.role === 'user' ? '👤 User' : '✨ shadow.ai (tera 1.0)';
      lines.push(`### ${role}`);
      lines.push(m.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-ai-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  // Speak AI text via Gemini TTS endpoint
  const handlePlayTTS = async (messageId: string, text: string) => {
    if (playingAudioId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoadingTtsId(messageId);
    try {
      const cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`.*?`/g, '')
        .replace(/[#*_~\[\]]/g, '')
        .slice(0, 500);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'Puck' }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64Audio = data.audioData || data.audioContent;
        if (base64Audio) {
          const audioUrl = `data:audio/wav;base64,${base64Audio}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          setPlayingAudioId(messageId);

          audio.play();
          audio.onended = () => {
            setPlayingAudioId(null);
            audioRef.current = null;
          };
          audio.onerror = () => {
            setPlayingAudioId(null);
            audioRef.current = null;
          };
          return;
        }
      }

      // Browser TTS fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        setPlayingAudioId(messageId);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
        utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        setPlayingAudioId(messageId);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoadingTtsId(null);
    }
  };

  const handleInsertChartPrompt = () => {
    const promptText =
      lang === 'ar'
        ? 'اعرض لي مقارنة بيانية في رسم تفاعلي (Line & Bar Chart) لأداء مبيعات ونمو تطبيق الذكاء الاصطناعي خلال الأشهر الماضية.'
        : 'Generate an interactive statistical comparison (Bar & Line Chart) displaying AI app growth and revenue metrics over the last 6 months.';
    setInput(promptText);
    textareaRef.current?.focus();
  };

  const personaDisplayName = lang === 'en' ? selectedPersona.nameEn : selectedPersona.name;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Top Controls Bar (When active conversation) */}
      {messages.length > 0 && (
        <div className="shrink-0 px-4 sm:px-6 py-2 border-b border-white/[0.04] bg-[#030712]/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onResetChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ios-glass text-xs text-slate-300 hover:text-white transition-colors"
              title={t.resetChat}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">{t.resetChat}</span>
            </motion.button>

            {/* Export full conversation */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleExportChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ios-glass text-xs text-sky-200 hover:text-white border border-sky-400/25 transition-all shadow-sm"
              title={lang === 'ar' ? 'تصدير المحادثة بتنسيق Markdown' : 'Export conversation as Markdown'}
            >
              {isExported ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="text-[11px] font-medium">
                {isExported
                  ? lang === 'ar'
                    ? 'تم التصدير'
                    : 'Exported'
                  : lang === 'ar'
                  ? 'تصدير'
                  : 'Export'}
              </span>
            </motion.button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{messages.length} {lang === 'ar' ? 'رسالة' : 'messages'}</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-36 sm:pb-40 space-y-4">
        {messages.length === 0 ? (
          /* iOS Siri / shadow.ai Minimalist Sky Blue Void */
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center select-none pointer-events-none">
            {/* Glowing Frosted Glass Orb */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500/30 via-cyan-400/25 to-blue-600/30 blur-xl animate-pulse absolute -inset-3" />
              <div className="w-20 h-20 rounded-full ios-glass border border-sky-400/30 flex items-center justify-center relative shadow-[0_0_35px_rgba(56,189,248,0.35)]">
                <Sparkles className="w-8 h-8 text-sky-300 animate-spin-slow" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2"
            >
              {t.howCanIHelp}
            </motion.h1>
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-2 mt-2 text-xs text-sky-400/90 font-light"
            >
              <span>{personaDisplayName}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-sky-300 text-[11px]">{t.modelName}</span>
            </motion.div>

            {/* Quick Chart Button in empty state */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pointer-events-auto"
            >
              <button
                onClick={handleInsertChartPrompt}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl ios-glass hover:bg-sky-500/20 text-xs text-sky-200 border border-sky-400/25 transition-all shadow-md group"
              >
                <BarChart2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>{t.insertChartExample}</span>
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 pt-2">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {/* Message Bubble Container */}
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 relative group transition-all ${
                        isUser
                          ? 'bg-gradient-to-tr from-sky-500 to-cyan-500 text-slate-950 font-medium rounded-br-sm shadow-[0_4px_20px_rgba(56,189,248,0.25)]'
                          : 'ios-glass text-slate-100 rounded-bl-sm border border-white/10 shadow-lg'
                      }`}
                    >
                      {/* Attached Image Preview */}
                      {message.image && (
                        <div className="mb-3 rounded-2xl overflow-hidden max-h-60 border border-white/10">
                          <img
                            src={`data:${message.image.mimeType};base64,${message.image.data}`}
                            alt="Attached"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content Render */}
                      <div className="text-sm leading-relaxed">
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <MarkdownRenderer content={message.content} lang={lang} />
                        )}
                      </div>

                      {/* Google Grounding Sources (Search Results) */}
                      {message.groundingSources && message.groundingSources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 text-xs">
                          <div className="flex items-center gap-1.5 text-sky-400 font-medium mb-2">
                            <Search className="w-3.5 h-3.5" />
                            <span>{t.groundingSources}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {message.groundingSources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5 text-[11px]"
                              >
                                <span className="truncate max-w-[150px]">{source.title || source.url}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message Action Bar (Copy / TTS) */}
                      {!isUser && !message.isStreaming && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Copy button */}
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title={t.copy}
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Voice Read aloud (TTS) */}
                          <button
                            onClick={() => handlePlayTTS(message.id, message.content)}
                            disabled={loadingTtsId === message.id}
                            className={`p-1.5 rounded-xl hover:bg-white/10 transition-colors ${
                              playingAudioId === message.id
                                ? 'text-sky-400 animate-pulse'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title={t.listen}
                          >
                            {loadingTtsId === message.id ? (
                              <span className="w-3.5 h-3.5 block border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                            ) : playingAudioId === message.id ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Streaming indicator bubble */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-sky-400 font-mono pl-4 pt-1"
              >
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>shadow.ai tera 1.0 thinking...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Prompt Bar with smooth protective backdrop */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent pt-6 pointer-events-none z-20">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          {/* Selected Image Preview Pill */}
          {selectedImage && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="mb-2 p-2 rounded-2xl ios-glass inline-flex items-center gap-2 border border-sky-400/30"
            >
              <img src={selectedImage.preview} alt="Thumb" className="w-10 h-10 object-cover rounded-xl" />
              <span className="text-xs text-slate-300 font-medium">Image attached</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Speech Error Toast */}
          {speechError && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs text-center">
              {speechError}
            </div>
          )}

          {/* Main Input Glass Capsule */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-2 rounded-3xl ios-glass border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:border-sky-400/50 transition-all">
            {/* File Upload (Vision Input) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-400 hover:text-sky-300 hover:bg-white/[0.06] transition-colors shrink-0"
              title={t.attachImage}
            >
              <Paperclip className="w-4 h-4" />
            </motion.button>

            {/* Quick Chart Trigger (Available on tablet/desktop, empty state has it on mobile) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={handleInsertChartPrompt}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-2xl text-slate-400 hover:text-sky-300 hover:bg-white/[0.06] transition-colors shrink-0"
              title={t.insertChartExample}
            >
              <BarChart2 className="w-4 h-4" />
            </motion.button>

            {/* Voice Dictation (Mic) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 sm:p-2.5 rounded-2xl transition-all shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/50'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-white/[0.06]'
              }`}
              title={isListening ? 'Stop' : t.micTooltip}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? t.listeningSpeech : t.inputPlaceholder}
              rows={1}
              className="flex-1 min-w-0 bg-transparent text-slate-100 placeholder-slate-400 text-sm py-2 px-1 focus:outline-none resize-none leading-relaxed"
            />

            {/* Send / Stop Action */}
            {isStreaming ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onStopStreaming}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
                title={t.stop}
              >
                <Square className="w-4 h-4 fill-white" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim() && !selectedImage}
                className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-md shrink-0"
                title={t.send}
              >
                <ArrowUp className="w-4 h-4 text-slate-950 font-bold" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
