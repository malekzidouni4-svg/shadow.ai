import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowUpLeft, Copy, Check } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../data/personas';
import { Language, translations } from '../translations';

interface PromptLibraryViewProps {
  onSelectPrompt: (promptText: string) => void;
  lang?: Language;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({
  onSelectPrompt,
  lang = 'ar',
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = PROMPT_TEMPLATES.filter((item) => {
    const titleMatch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    const promptMatch =
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.promptEn.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || promptMatch;
  });

  const copyPrompt = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-6 pt-4 pb-24">
      <div className="max-w-3xl mx-auto w-full space-y-4">
        {/* Minimal Search Bar */}
        <div className="relative ios-glass rounded-2xl px-3 py-2 flex items-center shadow-lg border border-sky-400/20">
          <Search className="w-4 h-4 text-slate-400 ml-2 rtl:ml-2 rtl:mr-0 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPrompts}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-xs focus:outline-none"
          />
        </div>

        {/* Minimal iOS Frosted Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredPrompts.map((item) => {
            const title = lang === 'en' ? item.titleEn : item.title;
            const description = lang === 'en' ? item.descriptionEn : item.description;
            const targetPrompt = lang === 'en' ? item.promptEn : item.prompt;

            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPrompt(targetPrompt)}
                className="ios-glass rounded-3xl p-3.5 cursor-pointer hover:border-sky-400/40 transition-all border border-white/[0.08] flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                    <button
                      onClick={(e) => copyPrompt(targetPrompt, item.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title={t.copy}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                    {title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-sky-300">
                  <span className="group-hover:underline">{t.useInChat}</span>
                  <ArrowUpLeft className="w-3.5 h-3.5 rtl:rotate-0 rotate-90" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
