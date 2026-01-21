
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Header from './components/Header.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import InputArea from './components/InputArea.tsx';
import Sidebar from './components/Sidebar.tsx';
import LiveCallOverlay from './components/LiveCallOverlay.tsx';
import { Message, Chat } from './types.ts';
import { getHSEAssistantResponse, generateSafetyImage, generateSafetySpeech } from './services/geminiService.ts';
import { connectToLiveSafety } from './services/liveService.ts';

const STORAGE_KEY = 'salamatuk_v2_history';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isLiveCalling, setIsLiveCalling] = useState(false);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // تحميل آمن للبيانات
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChats(parsed.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp || Date.now()),
            messages: Array.isArray(c.messages) ? c.messages.map((m: any) => ({ 
              ...m, 
              timestamp: new Date(m.timestamp || Date.now()) 
            })) : []
          })));
        }
      }
    } catch (e) { 
      console.error("Critical: LocalStorage data corrupted, clearing...", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // حفظ في الخلفية
  useEffect(() => {
    if (chats.length > 0) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch (e) {
          console.error("Save history error", e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [chats]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const stopAudio = useCallback(() => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch(e) {}
      activeSourceRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (activeChatId && currentMessageIdRef.current) {
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: c.messages.map(m => m.id === currentMessageIdRef.current ? { ...m, isSpeaking: false } : m)
      } : c));
    }
    currentMessageIdRef.current = null;
  }, [activeChatId]);

  const playAudio = async (base64Audio: string, messageId: string) => {
    initAudio();
    const ctx = audioContextRef.current!;
    if (ctx.state === 'suspended') await ctx.resume();
    
    stopAudio();

    try {
      let buffer = audioBuffersRef.current[messageId];
      if (!buffer) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        audioBuffersRef.current[messageId] = buffer;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        if (activeSourceRef.current === source) {
          stopAudio();
        }
      };

      activeSourceRef.current = source;
      currentMessageIdRef.current = messageId;
      const startTime = ctx.currentTime;
      
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? { ...m, isSpeaking: true, duration: buffer.duration } : m)
      } : c));
      
      source.start(0);

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = ctx.currentTime - startTime;
        setChats(prev => prev.map(c => c.id === activeChatId ? {
          ...c,
          messages: c.messages.map(m => m.id === messageId ? { ...m, currentTime: elapsed } : m)
        } : c));
      }, 100);

    } catch (e) { console.error("Playback error", e); }
  };

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || null, [chats, activeChatId]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    stopAudio();
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    let currentId = activeChatId;

    if (!currentId) {
      currentId = Date.now().toString();
      const newChat: Chat = { id: currentId, title: text.slice(0, 30), messages: [userMsg], timestamp: new Date() };
      setChats(prev => [...prev, newChat]);
      setActiveChatId(currentId);
    } else {
      setChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, userMsg], timestamp: new Date() } : c));
    }
    
    setIsLoading(true);

    try {
      const response = await getHSEAssistantResponse(text);
      const assistantId = (Date.now() + 1).toString();
      
      const assistantMsg: Message = { 
        id: assistantId, 
        role: 'assistant', 
        content: response.assistantText, 
        suggestions: response.suggestions,
        timestamp: new Date(),
        loadingImage: true,
        loadingAudio: true
      };

      setChats(prev => prev.map(c => c.id === currentId ? { ...c, messages: [...c.messages, assistantMsg] } : c));
      setIsLoading(false);

      generateSafetyImage(response.imagePrompt).then(img => {
        setChats(prev => prev.map(c => c.id === currentId ? {
          ...c,
          messages: c.messages.map(m => m.id === assistantId ? { ...m, image: img, loadingImage: false } : m)
        } : c));
      }).catch(() => {
         setChats(prev => prev.map(c => c.id === currentId ? {
          ...c,
          messages: c.messages.map(m => m.id === assistantId ? { ...m, loadingImage: false } : m)
        } : c));
      });

      generateSafetySpeech(response.assistantText).then(aud => {
        setChats(prev => prev.map(c => c.id === currentId ? {
          ...c,
          messages: c.messages.map(m => m.id === assistantId ? { ...m, audio: aud, loadingAudio: false } : m)
        } : c));
        if (aud) playAudio(aud, assistantId);
      }).catch(() => {
        setChats(prev => prev.map(c => c.id === currentId ? {
          ...c,
          messages: c.messages.map(m => m.id === assistantId ? { ...m, loadingAudio: false } : m)
        } : c));
      });

    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  }, [activeChatId, stopAudio]);

  return (
    <div className="h-screen bg-[#0f0a09] text-slate-200 flex font-sans overflow-hidden rtl" dir="rtl">
      {isLiveCalling && <LiveCallOverlay onClose={() => setIsLiveCalling(false)} isConnecting={isConnectingLive} />}
      
      {isSidebarOpen && (
        <Sidebar 
          chats={chats} 
          activeChatId={activeChatId} 
          onSelectChat={setActiveChatId} 
          onNewChat={() => { stopAudio(); setActiveChatId(null); }} 
          onDeleteChat={(id) => setChats(prev => prev.filter(c => c.id !== id))} 
        />
      )}
      
      <main className="flex-1 flex flex-col relative bg-[#0f0a09]">
        <div className="flex items-center justify-between border-b border-white/5 pr-2 h-16 shrink-0">
          <Header />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-4 text-slate-500 hover:text-white transition-opacity"
            aria-label="Toggle Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        <ChatWindow 
          messages={activeChat?.messages || []} 
          isLoading={isLoading} 
          onPlayAudio={playAudio} 
          onStopAudio={stopAudio} 
          onRegenerateImage={() => {}} 
          onSelectSuggestion={handleSendMessage} 
        />
        
        <InputArea 
          onSendMessage={handleSendMessage} 
          onStartLiveCall={() => setIsLiveCalling(true)} 
          disabled={isLoading} 
        />
      </main>
    </div>
  );
};

export default App;
