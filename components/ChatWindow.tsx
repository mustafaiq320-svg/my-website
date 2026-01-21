
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onPlayAudio: (audioBase64: string, messageId: string) => void;
  onStopAudio: () => void;
  onRegenerateImage: (messageId: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  isLoading, 
  onPlayAudio, 
  onStopAudio, 
  onSelectSuggestion
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length, isLoading]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent scroll-smooth">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
          <div className="bg-white/[0.02] p-8 rounded-full border border-white/5 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-600/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">كيف أخدمك اليوم؟</h3>
          <p className="text-sm text-slate-500 font-medium max-w-xs">أنا مساعدك الذكي في أمور الصحة والسلامة والبيئة.</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} transition-opacity duration-300`}>
          <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-lg ${
            msg.role === 'user' ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-200 border border-white/5'
          }`}>
            <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
              {msg.content}
            </div>
            
            {msg.role === 'assistant' && (
              <div className="mt-4 flex flex-col gap-3">
                {msg.audio ? (
                  <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                    <button 
                      onClick={() => msg.isSpeaking ? onStopAudio() : onPlayAudio(msg.audio!, msg.id)}
                      className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shrink-0"
                    >
                      {msg.isSpeaking ? (
                        <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="flex-1">
                       <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{formatTime(msg.currentTime || 0)}</span>
                          <span>{msg.duration ? formatTime(msg.duration) : '--:--'}</span>
                       </div>
                       <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-100"
                            style={{ width: `${msg.duration ? ((msg.currentTime || 0) / msg.duration) * 100 : 0}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>
                ) : msg.loadingAudio ? (
                  <div className="text-[10px] text-orange-500 animate-pulse">جاري تجهيز الرد الصوتي...</div>
                ) : null}

                {msg.image ? (
                  <div className="rounded-xl overflow-hidden border border-white/10 shadow-md">
                    <img src={msg.image} alt="Safety" className="w-full h-auto max-h-[300px] object-cover" loading="lazy" />
                  </div>
                ) : msg.loadingImage ? (
                  <div className="w-full aspect-video bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/10">
                    <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !isLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {msg.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSelectSuggestion(s)}
                  className="bg-orange-600/10 border border-orange-600/20 text-orange-500 text-[11px] py-1.5 px-3 rounded-full hover:bg-orange-600 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-2 p-4 bg-white/5 w-fit rounded-2xl border border-white/5">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

export default ChatWindow;
