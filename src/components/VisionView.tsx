import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Calculator,
  Receipt,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowUp,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Language, translations } from '../translations';

interface VisionViewProps {
  lang?: Language;
}

export const VisionView: React.FC<VisionViewProps> = ({ lang = 'ar' }) => {
  const t = translations[lang];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [activeTask, setActiveTask] = useState('ocr');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = [
    {
      id: 'ocr',
      label: t.ocrExtract,
      prompt:
        lang === 'ar'
          ? 'استخرج جميع النصوص المكتوبة في هذه الصورة أو المستند بدقة وتنسيقها كما هي بالكامل.'
          : 'Extract all printed and handwritten text from this image or document with precise formatting.',
    },
    {
      id: 'summary',
      label: t.summarizeDoc,
      prompt:
        lang === 'ar'
          ? 'لخص هذا المستند في نقاط رئيسية موجزة ودقيقة وأبرز الاستنتاجات.'
          : 'Summarize this document concisely into key bullet points and high-level takeaways.',
    },
    {
      id: 'math',
      label: t.solveMath,
      prompt:
        lang === 'ar'
          ? 'حدد وحل المعادلة أو المسألة الرياضية أو العلمية في الصورة خطوة بخطوة مع الشرح.'
          : 'Identify and solve the mathematical or scientific problem in this image step-by-step with clear derivation.',
    },
    {
      id: 'receipt',
      label: t.auditReceipt,
      prompt:
        lang === 'ar'
          ? 'استخرج بيانات الفاتورة أو الإيصال في جدول: اسم المتجر، التاريخ، البنود، الأسعار، والمجموع الإجمالي.'
          : 'Extract invoice/receipt line items into a structured table: vendor, date, items, subtotal, taxes, and total.',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isAnalyzing) return;
    try {
      setIsAnalyzing(true);
      const base64 = selectedImage.split(',')[1];
      const taskObj = tasks.find((tItem) => tItem.id === activeTask);

      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          prompt: taskObj?.prompt,
        }),
      });

      setError(null);
      if (!res.ok) throw new Error('فشل فحص المستند');
      const data = await res.json();
      setResult(data.result || 'لم يتم العثور على محتوى');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الفحص');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-6 pt-4 pb-24">
      <div className="max-w-3xl mx-auto w-full space-y-4">
        {/* iOS Frosted Upload Card */}
        <div className="ios-glass rounded-3xl p-4 shadow-xl border border-sky-400/20 text-center relative overflow-hidden">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {selectedImage ? (
            <div className="space-y-3">
              <div className="max-h-60 rounded-2xl overflow-hidden mx-auto border border-white/10 flex items-center justify-center bg-black/40">
                <img
                  src={selectedImage}
                  alt="Inspection"
                  className="max-h-60 object-contain rounded-xl"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                {lang === 'ar' ? 'تغيير الصورة أو المستند' : 'Change Image / Document'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="py-10 border-2 border-dashed border-white/10 hover:border-sky-400/40 rounded-2xl cursor-pointer transition-colors flex flex-col items-center justify-center group"
            >
              <div className="w-12 h-12 rounded-2xl ios-glass flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium">{t.uploadDocumentOrImage}</p>
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP</span>
            </div>
          )}

          {/* Task Selectors & Trigger */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                    activeTask === task.id
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 font-medium'
                      : 'text-slate-400 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  {task.label}
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyze}
              disabled={!selectedImage || isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-30 transition-all shadow-md"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{isAnalyzing ? t.analyzingDocument : t.analyzeDocument}</span>
            </motion.button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Results Card */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-glass rounded-3xl p-4 shadow-xl border border-sky-400/20 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  {lang === 'ar' ? 'نتائج الفحص والاستخراج' : 'Analysis & Extracted Data'}
                </span>
              </div>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? t.copied : t.copy}</span>
              </button>
            </div>
            <div className="pt-1">
              <MarkdownRenderer content={result} lang={lang} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
