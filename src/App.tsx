import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Message, Persona, GroundingSource } from './types';
import { PERSONAS } from './data/personas';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ImageView } from './components/ImageView';
import { VisionView } from './components/VisionView';
import { VoiceView } from './components/VoiceView';
import { PromptLibraryView } from './components/PromptLibraryView';
import { MemoryModal } from './components/MemoryModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Language } from './translations';

interface Session {
  id: string;
  title: string;
  timestamp: number;
  personaId: string;
  messages: Message[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  // Default to LOW thinking level for ultra-fast, snappy AI responses
  const [thinkingLevel, setThinkingLevel] = useState<'LOW' | 'HIGH'>('LOW');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Language state (Arabic / English)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('shadow_lang');
      return saved === 'en' || saved === 'ar' ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  // Google Grounding & Persistent Memory state
  const [enableGoogleSearch, setEnableGoogleSearch] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shadow_google_search') === 'true';
    } catch {
      return false;
    }
  });

  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(true);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [memories, setMemories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shadow_memories') || localStorage.getItem('bayan_memories');
      return saved
        ? JSON.parse(saved)
        : [
            'المستخدم يفضل الإجابات السريعة والمتقنة والرسوم البيانية التفاعلية',
            'User prefers ultra-fast responses with clean data charts',
          ];
    } catch {
      return ['المستخدم يفضل السرعة العالية والإجابات المتقنة'];
    }
  });

  // Chat sessions state
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('shadow_sessions') || localStorage.getItem('bayan_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync RTL/LTR with document direction and HTML lang attribute
  useEffect(() => {
    const isRtl = lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('shadow_lang', lang);
    } catch (_) {}
  }, [lang]);

  // Save sessions & memory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shadow_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions', e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('shadow_memories', JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to save memories', e);
    }
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem('shadow_google_search', String(enableGoogleSearch));
    } catch (e) {
      console.warn(e);
    }
  }, [enableGoogleSearch]);

  // Load active session messages if activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      const sess = sessions.find((s) => s.id === activeSessionId);
      if (sess) {
        setMessages(sess.messages);
        const p = PERSONAS.find((item) => item.id === sess.personaId);
        if (p) setSelectedPersona(p);
      }
    }
  }, [activeSessionId]);

  const handleToggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleSelectSession = (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleAddMemory = (newMem: string) => {
    if (!memories.includes(newMem)) {
      setMemories((prev) => [newMem, ...prev]);
    }
  };

  const handleRemoveMemory = (index: number) => {
    setMemories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearMemories = () => {
    setMemories([]);
  };

  const handleSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    if (!text.trim() && !image) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image,
    };

    const modelMessageId = `mod-${Date.now()}`;
    const modelPlaceholder: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, modelPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const instruction =
      lang === 'en'
        ? selectedPersona.systemInstructionEn || selectedPersona.systemInstruction
        : selectedPersona.systemInstruction;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image ? { data: m.image.data, mimeType: m.image.mimeType } : undefined,
          })),
          systemInstruction: instruction,
          thinkingLevel,
          enableGoogleSearch,
          memories: isMemoryEnabled ? memories : [],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'خطأ في معالجة طلب المحادثة');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let discoveredSources: GroundingSource[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? { ...msg, content: accumulatedText, isStreaming: true }
                        : msg
                    )
                  );
                } else if (parsed.grounding && parsed.grounding.sources) {
                  discoveredSources = parsed.grounding.sources;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMessageId
                        ? { ...msg, groundingSources: discoveredSources }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  accumulatedText += `\n\n⚠️ ${parsed.error}`;
                }
              } catch (_) {
                // Ignore partial JSON
              }
            }
          }
        }
      }

      // Finish streaming
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, content: accumulatedText, isStreaming: false, groundingSources: discoveredSources }
            : msg
        );

        const currentTitle = text.slice(0, 32) || (lang === 'ar' ? 'محادثة' : 'Chat');
        if (activeSessionId) {
          setSessions((prevSessions) =>
            prevSessions.map((s) =>
              s.id === activeSessionId ? { ...s, messages: updated, timestamp: Date.now() } : s
            )
          );
        } else {
          const newId = `sess-${Date.now()}`;
          setActiveSessionId(newId);
          setSessions((prevSessions) => [
            {
              id: newId,
              title: currentTitle,
              timestamp: Date.now(),
              personaId: selectedPersona.id,
              messages: updated,
            },
            ...prevSessions,
          ]);
        }

        return updated;
      });
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Chat stream error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId
              ? {
                  ...msg,
                  content:
                    lang === 'ar'
                      ? 'حدث خطأ مؤقت في الاتصال، يرجى المحاولة مرة أخرى.'
                      : 'A temporary connection error occurred, please try again.',
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
  };

  const handleSelectPromptFromLibrary = (promptText: string) => {
    setActiveTab('chat');
    handleSendMessage(promptText);
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-sky-500/30 selection:text-white relative">
      {/* Ambient Celestial Sky Blue Lighting */}
      <div className="fixed top-[-10%] right-[-10%] w-[520px] h-[520px] rounded-full bg-sky-500/18 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[520px] h-[520px] rounded-full bg-cyan-500/16 blur-[140px] pointer-events-none" />
      <div className="fixed top-[30%] left-[35%] w-[420px] h-[420px] rounded-full bg-blue-600/12 blur-[150px] pointer-events-none" />

      {/* Sidebar Sheet */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPersona={selectedPersona}
        setSelectedPersona={setSelectedPersona}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        savedSessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        activeSessionId={activeSessionId}
        lang={lang}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-10">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPersona={selectedPersona}
          lang={lang}
          onToggleLanguage={handleToggleLanguage}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          thinkingLevel={thinkingLevel}
          setThinkingLevel={setThinkingLevel}
          enableGoogleSearch={enableGoogleSearch}
          setEnableGoogleSearch={setEnableGoogleSearch}
          memoriesCount={memories.length}
          onOpenMemory={() => setIsMemoryModalOpen(true)}
          onOpenInstall={() => setIsInstallModalOpen(true)}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              selectedPersona={selectedPersona}
              onResetChat={handleNewChat}
              enableGoogleSearch={enableGoogleSearch}
              setEnableGoogleSearch={setEnableGoogleSearch}
              lang={lang}
            />
          )}

          {activeTab === 'image' && <ImageView lang={lang} />}

          {activeTab === 'vision' && <VisionView lang={lang} />}

          {activeTab === 'voice' && <VoiceView lang={lang} />}

          {activeTab === 'prompts' && (
            <PromptLibraryView onSelectPrompt={handleSelectPromptFromLibrary} lang={lang} />
          )}
        </main>
      </div>

      {/* AI Memory Manager Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onRemoveMemory={handleRemoveMemory}
        onClearMemories={handleClearMemories}
        isMemoryEnabled={isMemoryEnabled}
        onToggleMemory={() => setIsMemoryEnabled(!isMemoryEnabled)}
        lang={lang}
      />

      {/* Android & Web App Installation Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        lang={lang}
      />

      {/* Offline Connectivity Status */}
      <OfflineIndicator />
    </div>
  );
}
