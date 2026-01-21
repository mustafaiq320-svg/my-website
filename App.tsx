
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import LiveCallOverlay from './components/LiveCallOverlay';
import { Message, Chat } from './types';
import { getHSEAssistantResponse, generateSafetyImage, generateSafetySpeech } from './services/geminiService';
import { connectToLiveSafety, encodeAudio, decodeAudio, decodeAudioData } from './services/liveService';

const STORAGE_KEY = 'salamatuk_chats_history';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLiveCalling, setIsLiveCalling] = useState(false);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const liveMediaStreamRef = useRef<MediaStream | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // تحميل المحادثات عند بدء التشغيل
  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      try {
        const hydrated = JSON.parse(savedChats).map((c: any) => ({
          ...c, 
          timestamp: new Date(c.timestamp),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setChats(hydrated);
      } catch (e) {
        console.error("Error loading chats", e);
      }
    }
  }, []);

  // حفظ المحادثات عند أي تغيير
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  }, [chats]);

  // تهيئة سياق الصوت
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const stopAudioCompletely = useCallback(() => {
    if (activeSourceRef.current) {
      activeSourceRef.current.stop();
      activeSourceRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    currentMessageIdRef.current = null;
    
    if (activeChatId) {
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: c.messages.map(m => ({ ...m, isSpeaking: false, isPaused: false, playbackOffset: 0 }))
      } : c));
    }
  }, [activeChatId]);

  const playAudio = async (base64Audio: string, messageId: string) => {
    initAudio();
    if (!audioContextRef.current || !activeChatId) return;
    
    if (currentMessageIdRef.current && currentMessageIdRef.current !== messageId) {
      stopAudioCompletely();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      let buffer = audioBuffersRef.current[messageId];
      if (!buffer) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        audioBuffersRef.current[messageId] = buffer;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setChats(prev => prev.map(c => c.id === activeChatId ? {
            ...c,
            messages: c.messages.map(m => m.id === messageId ? { ...m, isSpeaking: false, currentTime: 0 } : m)
          } : c));
        }
      };

      activeSourceRef.current = source;
      currentMessageIdRef.current = messageId;
      startTimeRef.current = audioContextRef.current.currentTime;
      
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? { ...m, isSpeaking: true } : m)
      } : c));
      
      source.start(0);

      progressIntervalRef.current = window.setInterval(() => {
        if (!audioContextRef.current) return;
        const currentElapsed = (audioContextRef.current.currentTime - startTimeRef.current);
        setChats(prev => prev.map(c => c.id === activeChatId ? {
          ...c,
          messages: c.messages.map(m => m.id === messageId ? { ...m, currentTime: currentElapsed, duration: buffer.duration } : m)
        } : c));
      }, 100);

    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const messages = activeChat?.messages || [];

  const handleStartLiveCall = async () => {
    initAudio();
    setIsLiveCalling(true);
    setIsConnectingLive(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveMediaStreamRef.current = stream;
      
      const sessionPromise = connectToLiveSafety({
        onAudioChunk: async (base64) => {
          if (!audioContextRef.current) return;
          const ctx = audioContextRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await decodeAudioData(decodeAudio(base64), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          liveSourcesRef.current.add(source);
          source.onended = () => liveSourcesRef.current.delete(source);
        },
        onInterrupted: () => {
          liveSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
          liveSourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        },
        onTranscription: (text, role) => {
          console.log(`Live Transcription [${role}]: ${text}`);
        },
        onClose: () => {
          handleEndLiveCall();
        }
      });

      liveSessionPromiseRef.current = sessionPromise;
      const session = await sessionPromise;
      setIsConnectingLive(false);

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
        
        session.sendRealtimeInput({
          media: {
            data: encodeAudio(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (e) {
      console.error("Live call failed", e);
      setIsLiveCalling(false);
      setIsConnectingLive(false);
    }
  };

  const handleEndLiveCall = () => {
    setIsLiveCalling(false);
    setIsConnectingLive(false);
    if (liveMediaStreamRef.current) {
      liveMediaStreamRef.current.getTracks().forEach(t => t.stop());
      liveMediaStreamRef.current = null;
    }
    liveSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    liveSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    stopAudioCompletely();
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: new Date() 
    };

    let chatId = activeChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: Chat = {
        id: chatId,
        title: text.length > 30 ? text.substring(0, 30) + '...' : text,
        messages: [userMsg],
        timestamp: new Date()
      };
      setChats(prev => [...prev, newChat]);
      setActiveChatId(chatId);
    } else {
      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        messages: [...c.messages, userMsg],
        timestamp: new Date()
      } : c));
    }
    
    setIsLoading(true);

    try {
      const { assistantText, imagePrompt, suggestions } = await getHSEAssistantResponse(text);
      const assistantId = (Date.now() + 1).toString();
      
      const assistantMsg: Message = { 
        id: assistantId, 
        role: 'assistant', 
        content: assistantText, 
        imagePrompt, 
        suggestions,
        timestamp: new Date(), 
        loadingImage: true, 
        loadingAudio: true
      };

      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        messages: [...c.messages, assistantMsg]
      } : c));
      
      setIsLoading(false);

      const [img, aud] = await Promise.all([
        generateSafetyImage(imagePrompt).catch(() => null),
        generateSafetySpeech(assistantText).catch(() => null)
      ]);

      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        messages: c.messages.map(m => 
          m.id === assistantId ? { 
            ...m, 
            image: img || undefined, 
            audio: aud || undefined, 
            loadingImage: false, 
            loadingAudio: false 
          } : m
        )
      } : c));

      if (aud) playAudio(aud, assistantId);
    } catch (error) {
      console.error("AI Error:", error);
      setIsLoading(false);
    }
  }, [activeChatId, stopAudioCompletely]);

  return (
    <div className="h-screen bg-[#0f0a09] text-slate-200 flex font-sans overflow-hidden rtl" dir="rtl">
      {isLiveCalling && (
        <LiveCallOverlay onClose={handleEndLiveCall} isConnecting={isConnectingLive} />
      )}
      
      {isSidebarOpen && (
        <Sidebar 
          chats={chats} 
          activeChatId={activeChatId} 
          onSelectChat={setActiveChatId} 
          onNewChat={() => { stopAudioCompletely(); setActiveChatId(null); }} 
          onDeleteChat={(id) => setChats(chats.filter(c => c.id !== id))} 
        />
      )}
      
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_50%,_#1a1210_0%,_#0f0a09_100%)]">
        <div className="flex items-center justify-between border-b border-white/5 pr-2">
          <Header />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-4 text-slate-500 hover:text-white transition-colors"
            aria-label={isSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onPlayAudio={playAudio} 
          onStopAudio={stopAudioCompletely} 
          onRegenerateImage={() => {}} 
          onSelectSuggestion={handleSendMessage} 
        />
        
        <InputArea 
          onSendMessage={handleSendMessage} 
          onStartLiveCall={handleStartLiveCall} 
          disabled={isLoading} 
        />
      </main>
    </div>
  );
};

export default App;
