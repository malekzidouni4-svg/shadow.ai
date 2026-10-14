import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Image as ImageIcon,
  ScanEye,
  Volume2,
  Bookmark,
  Plus,
  Trash2,
  Sparkles,
  Code2,
  PenTool,
  GraduationCap,
  TrendingUp,
  Languages,
  X,
  Smartphone,
} from 'lucide-react';
import { ActiveTab, Persona } from '../types';
import { PERSONAS } from '../data/personas';
import { Language, translations } from '../translations';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPersona: Persona;
  setSelectedPersona: (p: Persona) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  savedSessions: Array<{ id: string; title: string; timestamp: number }>;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  activeSessionId: string | null;
  lang: Language;
  onOpenInstall?: () => void;
}

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-3.5 h-3.5" />,
  Code2: <Code2 className="w-3.5 h-3.5" />,
  TrendingUp: <TrendingUp className="w-3.5 h-3.5" />,
  PenTool: <PenTool className="w-3.5 h-3.5" />,
  GraduationCap: <GraduationCap className="w-3.5 h-3.5" />,
  Languages: <Languages className="w-3.5 h-3.5" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedPersona,
  setSelectedPersona,
  onNewChat,
  isOpen,
  onClose,
  savedSessions,
  onSelectSession,
  onDeleteSession,
  activeSessionId,
  lang,
  onOpenInstall,
}) => {
  const t = translations[lang];

  const tabs = [
    { id: 'chat', label: t.chatTab, icon: MessageSquare },
    { id: 'image', label: t.imageTab, icon: ImageIcon },
    { id: 'vision', label: t.visionTab, icon: ScanEye },
    { id: 'voice', label: t.voiceTab, icon: Volume2 },
    { id: 'prompts', label: t.promptsTab, icon: Bookmark },
  ];

  const renderSidebarContent = (isMobile: boolean) => (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-400 via-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 shadow-md ring-1 ring-sky-300/40">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">{t.appName}</span>
            <span className="text-[10px] text-sky-400/90 font-mono block -mt-0.5">{t.modelName}</span>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3 shrink-0">
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => {
            onNewChat();
            setActiveTab('chat');
            if (isMobile) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.newChat}</span>
        </motion.button>
      </div>

      {/* Mobile Tool switcher (if on small screen) */}
      <div className="px-3 py-1 space-y-1 lg:hidden shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                if (isMobile) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500/20 text-sky-200 font-semibold border border-sky-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Personas Selector */}
      <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 block mb-1.5 font-medium">
          {t.personas}
        </span>
        <div className="space-y-0.5">
          {PERSONAS.map((persona) => {
            const isSelected = selectedPersona.id === persona.id;
            const personaDisplayName = lang === 'en' ? persona.nameEn : persona.name;
            return (
              <motion.button
                key={persona.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedPersona(persona);
                  setActiveTab('chat');
                  if (isMobile) onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                } ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-200 font-semibold border border-sky-400/25 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className={isSelected ? 'text-sky-400' : 'text-slate-400'}>
                  {PERSONA_ICONS[persona.icon] || <Sparkles className="w-3.5 h-3.5" />}
                </span>
                <span className="truncate">{personaDisplayName}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Saved Chat History */}
      <div className="flex-1 px-3 py-2 border-t border-white/[0.06] overflow-y-auto min-h-0">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2 block mb-1.5 font-medium">
          {t.previousChats}
        </span>

        {savedSessions.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            {t.noChatsYet}
          </div>
        ) : (
          <div className="space-y-0.5">
            {savedSessions.map((session) => (
              <motion.div
                key={session.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectSession(session.id);
                  setActiveTab('chat');
                  if (isMobile) onClose();
                }}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-sky-500/15 text-sky-200 border border-sky-400/20 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className={`truncate flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                  {session.title}
                </span>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                  title={lang === 'ar' ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Install Android App Footer */}
      {onOpenInstall && (
        <div className="p-3 border-t border-white/[0.06] bg-slate-950/40 shrink-0">
          <button
            onClick={() => {
              onOpenInstall();
              if (isMobile) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500/25 hover:to-indigo-500/25 border border-sky-400/30 text-sky-200 text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>{t.installApp}</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside
        className={`hidden lg:flex w-72 shrink-0 ios-glass flex-col overflow-hidden h-full z-20 ${
          lang === 'ar' ? 'border-l border-white/[0.08]' : 'border-r border-white/[0.08]'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
            />

            {/* Sliding Drawer */}
            <motion.aside
              initial={{ x: lang === 'ar' ? 320 : -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: lang === 'ar' ? 320 : -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className={`fixed top-0 bottom-0 z-50 w-[285px] sm:w-72 ios-glass my-2 sm:my-3 rounded-3xl flex flex-col overflow-hidden lg:hidden shadow-2xl ${
                lang === 'ar' ? 'right-2 sm:right-3' : 'left-2 sm:left-3'
              }`}
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
