import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Plus, Trash2, X, Check, Sparkles } from 'lucide-react';
import { Language, translations } from '../translations';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: string[];
  onAddMemory: (memory: string) => void;
  onRemoveMemory: (index: number) => void;
  onClearMemories: () => void;
  isMemoryEnabled: boolean;
  onToggleMemory: () => void;
  lang?: Language;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onRemoveMemory,
  onClearMemories,
  isMemoryEnabled,
  onToggleMemory,
  lang = 'ar',
}) => {
  const t = translations[lang];
  const [newMemory, setNewMemory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    onAddMemory(newMemory.trim());
    setNewMemory('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-lg ios-glass rounded-3xl p-5 shadow-2xl border border-sky-400/30 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t.memoryTitle}
                </h3>
                <p className="text-[11px] text-sky-300/80">
                  {t.memoryDesc}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Switch */}
          <div className="my-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  {t.memoryActive}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t.memoryActiveSub}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleMemory}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isMemoryEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ x: isMemoryEnabled ? (lang === 'ar' ? -20 : 20) : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Add New Memory Input */}
          <form onSubmit={handleAdd} className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder={t.memoryInputPlaceholder}
              className="flex-1 px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/50"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!newMemory.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-cyan-500 text-slate-950 font-bold disabled:opacity-30 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-slate-950" />
            </motion.button>
          </form>

          {/* Memory List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {memories.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                {t.noMemoriesYet}
              </div>
            ) : (
              memories.map((mem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] group"
                >
                  <span className="text-xs text-slate-200 leading-relaxed pr-2 flex-1">
                    • {mem}
                  </span>
                  <button
                    onClick={() => onRemoveMemory(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          {memories.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={onClearMemories}
                className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                {t.clearAllMemories}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-2xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5 inline ml-1 rtl:ml-1 rtl:mr-0" />
                <span>{lang === 'ar' ? 'تم' : 'Done'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
