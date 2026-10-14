import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Maximize2, Download, BarChart2 } from 'lucide-react';
import { ChartRenderer, ChartData } from './ChartRenderer';
import { Language, translations } from '../translations';

interface MarkdownRendererProps {
  content: string;
  lang?: Language;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, lang = 'ar' }) => {
  const t = translations[lang];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-slate-100 text-[14.5px]">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = !firstLine.includes(' ') && firstLine.length < 20;
          const language = (hasLang ? firstLine : '').toLowerCase();
          const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          // Check if it is an interactive Chart definition
          if (language === 'chart' || language === 'json-chart' || language === 'graph') {
            try {
              const parsed: ChartData = JSON.parse(codeContent);
              if (parsed && Array.isArray(parsed.data)) {
                return <ChartRenderer key={index} chartData={parsed} lang={lang} />;
              }
            } catch (_) {
              // Fallback to normal code block
            }
          }

          return (
            <div
              key={index}
              className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/85 shadow-lg text-left"
              dir="ltr"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/10 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-sky-300">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  {language || 'code'}
                </span>
                <button
                  onClick={() => copyCode(codeContent, index)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-300">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">{t.copy}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-xs text-sky-200/95 font-mono leading-relaxed selection:bg-sky-500/30">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Parse markdown text, images, tables, headers, and bullet points
        const subLines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {subLines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1.5" />;

              // Check for markdown image: ![alt](url)
              const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
              if (imgMatch) {
                const alt = imgMatch[1];
                const src = imgMatch[2];
                return (
                  <div key={lIdx} className="my-3 rounded-2xl overflow-hidden ios-glass border border-sky-400/25 max-w-lg group relative shadow-xl">
                    <img
                      src={src}
                      alt={alt}
                      className="w-full max-h-80 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveZoomImage(src)}
                        className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-sky-500 hover:text-slate-950 transition-colors shadow-lg"
                        title={t.zoomImage}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <a
                        href={src}
                        download={`shadow-ai-image-${Date.now()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-sky-500 hover:text-slate-950 transition-colors shadow-lg"
                        title={t.downloadImage}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                    {alt && (
                      <p className="p-2.5 text-xs text-slate-300 text-center font-medium bg-white/[0.03] border-t border-white/[0.06]">
                        {alt}
                      </p>
                    )}
                  </div>
                );
              }

              // Headers
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-sm font-bold text-sky-300 mt-2.5 mb-1 tracking-wide">
                    {renderInlineFormatting(trimmed.replace('### ', ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={lIdx} className="text-base font-bold text-sky-200 mt-3.5 mb-1.5 border-b border-white/10 pb-1 tracking-wide">
                    {renderInlineFormatting(trimmed.replace('## ', ''))}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={lIdx} className="text-lg font-extrabold text-white mt-4 mb-2 tracking-wide">
                    {renderInlineFormatting(trimmed.replace('# ', ''))}
                  </h1>
                );
              }

              // Blockquote / Callout
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={lIdx}
                    className="p-3 my-2 rounded-2xl bg-sky-950/35 border-l-4 rtl:border-l-0 rtl:border-r-4 border-sky-400 text-xs text-sky-200 leading-relaxed font-medium"
                  >
                    {renderInlineFormatting(trimmed.replace('> ', ''))}
                  </div>
                );
              }

              // Bullet lists
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pr-1.5 my-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                    <span>{renderInlineFormatting(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Numbered lists
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pr-1.5 my-0.5">
                    <span className="font-mono text-[11px] font-semibold text-sky-400 bg-sky-950/70 px-1 py-0.5 rounded border border-sky-800/40 shrink-0 mt-0.5">
                      {numMatch[1]}
                    </span>
                    <span>{renderInlineFormatting(numMatch[2])}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderInlineFormatting(line)}</p>;
            })}
          </div>
        );
      })}

      {/* Image Zoom Modal */}
      {activeZoomImage && (
        <div
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl p-4 flex items-center justify-center cursor-pointer"
        >
          <img
            src={activeZoomImage}
            alt="Zoomed"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-3xl shadow-2xl border border-sky-400/30"
          />
        </div>
      )}
    </div>
  );
};

function renderInlineFormatting(text: string) {
  // Parse inline `code`, **bold**, and links [text](url)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-slate-900/90 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10 mx-1"
          dir="ltr"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = tok.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:text-sky-300 underline font-medium inline-flex items-center gap-0.5"
        >
          {linkMatch[1]}
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    }
    return tok;
  });
}
