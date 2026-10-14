import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Menu,
  Globe,
  Search,
  MessageSquare,
  Image as ImageIcon,
  ScanEye,
  Volume2,
  Bookmark,
  Brain,
  Smartphone,
} from 'lucide-react';
import { ActiveTab, Persona } from '../types';
import { Language, translations } from '../translations';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPersona: Persona;
  lang: Language;
  onToggleLanguage: () => void;
  toggleSidebar: () => void;
  thinkingLevel: 'LOW' | 'HIGH';
  setThinkingLevel: (val: 'LOW' | 'HIGH') => void;
  enableGoogleSearch: boolean;
  setEnableGoogleSearch: (val: boolean) => void;
  memoriesCount: number;
  onOpenMemory: () => void;
  onOpenInstall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedPersona,
  lang,
  onToggleLanguage,
  toggleSidebar,
  thinkingLevel,
  setThinkingLevel,
  enableGoogleSearch,
  setEnableGoogleSearch,
  memoriesCount,
  onOpenMemory,
  onOpenInstall,
}) => {
  const t = translations[lang];

  const tabs = [
    { id: 'chat' as ActiveTab, label: t.chatTab, icon: MessageSquare },
    { id: 'image' as ActiveTab, label: t.imageTab, icon: ImageIcon },
    { id: 'vision' as ActiveTab, label: t.visionTab, icon: ScanEye },
    { id: 'voice' as ActiveTab, label: t.voiceTab, icon: Volume2 },
    { id: 'prompts' as ActiveTab, label: t.promptsTab, icon: Bookmark },
  ];

  const personaDisplayName = lang === 'en' ? selectedPersona.nameEn : selectedPersona.name;

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#030712]/70 backdrop-blur-2xl z-30 select-none">
      {/* Left: Mobile Menu + Branding & Active Persona */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleSidebar}
          className="p-2 rounded-2xl ios-glass text-slate-300 hover:text-white transition-colors lg:hidden shrink-0"
          title={t.previousChats}
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-2 min-w-0">
          {/* Glowing Shadow Orb Logo */}
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-[1px] shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0">
            <div className="w-full h-full bg-[#030712] rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                <span>{t.appName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
                  {t.modelName}
                </span>
              </span>
            </div>
            <span className="hidden sm:block text-[11px] text-slate-400 truncate max-w-[130px] sm:max-w-[180px]">
              {personaDisplayName}
            </span>
          </div>
        </div>
      </div>

      {/* Center: iOS Segmented Tab Switcher (Visible on large screens) */}
      <nav className="hidden lg:flex items-center p-1 rounded-2xl ios-glass border border-white/10 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="navbar-tab-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-sky-500/80 to-cyan-500/80 rounded-xl shadow-[0_2px_12px_rgba(56,189,248,0.35)] -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Right: Google Search Grounding, AI Memory, Thinking Mode, Install & Language */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0 pointer-events-auto">
        {/* Google Live Search Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => setEnableGoogleSearch(!enableGoogleSearch)}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-2xl text-xs transition-all ${
            enableGoogleSearch
              ? 'ios-pill-active text-sky-200 font-semibold shadow-sky-500/20'
              : 'ios-glass text-slate-400 hover:text-slate-200'
          }`}
          title={t.googleSearch}
        >
          <Search className={`w-3.5 h-3.5 ${enableGoogleSearch ? 'text-sky-400' : ''}`} />
          <span className="hidden md:inline text-[11px]">
            {enableGoogleSearch ? t.googleSearchLive : t.googleSearch}
          </span>
        </motion.button>

        {/* AI Memory Manager */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onOpenMemory}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-2xl text-xs ios-glass text-slate-300 hover:text-white transition-all relative"
          title={t.memory}
        >
          <Brain className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline text-[11px] font-medium">{t.memory}</span>
          {memoriesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
              {memoriesCount}
            </span>
          )}
        </motion.button>

        {/* Thinking Mode Toggle (Tera 1.0) */}
        <div className="hidden md:flex items-center rounded-2xl ios-glass p-0.5 border border-white/5 text-[11px]">
          <button
            onClick={() => setThinkingLevel('LOW')}
            className={`px-2 py-1 rounded-xl transition-all ${
              thinkingLevel === 'LOW'
                ? 'bg-sky-500/30 text-sky-200 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Fast Response"
          >
            {t.fastThinking}
          </button>
          <button
            onClick={() => setThinkingLevel('HIGH')}
            className={`px-2 py-1 rounded-xl transition-all ${
              thinkingLevel === 'HIGH'
                ? 'bg-sky-500/30 text-sky-200 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Deep Cognitive Reasoning"
          >
            {t.deepThinking}
          </button>
        </div>

        {/* Android / PWA App Install Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onOpenInstall}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-2xl text-xs bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 text-sky-200 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.2)] transition-all cursor-pointer"
          title={t.installAppDesc}
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="hidden sm:inline text-[11px] font-semibold">{t.installApp}</span>
        </motion.button>

        {/* Language Switcher Button (Arabic / English) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onToggleLanguage}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-2xl ios-glass text-slate-300 hover:text-white text-xs transition-all border border-white/10 shrink-0"
          title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold font-mono uppercase">
            {lang === 'ar' ? 'EN' : 'عربي'}
          </span>
        </motion.button>
      </div>
    </header>
  );
};
