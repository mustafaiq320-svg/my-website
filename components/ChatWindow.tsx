
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
  onRegenerateImage,
  onSelectSuggestion
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 space-y-8 bg-transparent scrollbar-none"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="نافذة المحادثة"
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6 text-center animate-in fade-in duration-1000">
          <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 relative shadow-inner" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-orange-600/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="max-w-xs">
            <h3 className="text-2xl font-black text-white mb-2">كيف أخدمك اليوم؟</h3>
            <p className="text-slate-500 leading-relaxed font-medium">أنا مساعدك الذكي في أمور السلامة والبيئة. اطرح سؤالك وسأجيبك فوراً.</p>
          </div>
        </div>
      )}

      {messages.map((msg, idx) => (
        <article 
          key={msg.id} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-4 duration-500`}
          aria-label={msg.role === 'user' ? 'رسالتك' : 'رد المساعد الذكي'}
        >
          <div className={`max-w-[85%] md:max-w-[75%] rounded-[2rem] p-6 shadow-2xl relative transition-all ${
            msg.role === 'user' 
              ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-900/30' 
              : 'bg-white/[0.03] text-slate-200 rounded-tl-none border border-white/10 backdrop-blur-xl'
          }`}>
            <div className="flex flex-col gap-4">
              <div className="whitespace-pre-wrap text-[15px] md:text-base leading-[1.8] font-medium tracking-wide">
                {msg.content}
              </div>
              
              {msg.role === 'assistant' && (
                <div className="flex flex-col gap-3 pt-4 border-t border-white/5 w-full">
                  {msg.audio ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => msg.isSpeaking ? onStopAudio() : onPlayAudio(msg.audio!, msg.id)}
                          aria-label={msg.isSpeaking ? "إيقاف التشغيل الصوتي" : "استماع للرد بصوت مسموع"}
                          className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg shrink-0 focus-visible:ring-2 focus-visible:ring-orange-500 outline-none ${
                            msg.isSpeaking 
                              ? 'bg-white text-orange-600 shadow-white/20 scale-105' 
                              : 'bg-orange-600/20 text-orange-500 border border-orange-500/30 hover:bg-orange-600/30 hover:scale-105'
                          }`}
                        >
                          {msg.isSpeaking ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          )}
                        </button>

                        <div className="flex-1 flex flex-col gap-1" aria-hidden="true">
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            <span>{formatTime(msg.currentTime || (msg.isPaused ? msg.playbackOffset || 0 : 0))}</span>
                            <span>{msg.duration ? formatTime(msg.duration) : '--:--'}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                            <div 
                              className="absolute left-0 top-0 h-full bg-orange-600 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(234,88,12,0.6)]"
                              style={{ width: `${msg.duration ? ((msg.currentTime || (msg.isPaused ? msg.playbackOffset || 0 : 0)) / msg.duration) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : msg.loadingAudio ? (
                    <div className="flex items-center gap-3 text-[11px] text-orange-500/60 font-black animate-pulse uppercase tracking-widest" aria-live="polite">
                       جاري توليد الملف الصوتي...
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {msg.image && (
              <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group/img relative">
                <img 
                  src={msg.image} 
                  alt={`رسم توضيحي للسلامة: ${msg.imagePrompt}`}
                  className="w-full h-auto object-cover max-h-[400px]" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-6">
                  <p className="text-white text-[10px] text-center font-bold" aria-hidden="true">{msg.imagePrompt}</p>
                </div>
              </div>
            )}
            
            {msg.loadingImage && (
              <div className="mt-6 w-full aspect-video bg-white/[0.02] animate-pulse rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-white/5 gap-3" aria-live="polite">
                <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">توليد الرسم التوضيحي...</p>
              </div>
            )}
          </div>

          {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !isLoading && (
            <nav className="mt-4 flex flex-wrap gap-2.5" aria-label="مواضيع مقترحة">
              {msg.suggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => onSelectSuggestion(suggestion)}
                  aria-label={`اسأل عن: ${suggestion}`}
                  style={{ animationDelay: `${sIdx * 100}ms` }}
                  className="bg-orange-600/10 border border-orange-600/30 text-orange-500 text-[11px] md:text-xs py-2.5 px-5 rounded-full 
                             hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(234,88,12,0.3)]
                             transition-all duration-300 shadow-md active:scale-95 animate-in fade-in slide-in-from-top-4 font-bold focus-visible:ring-2 focus-visible:ring-orange-500 outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </nav>
          )}

          <div className="mt-2 px-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">
            <time dateTime={msg.timestamp.toISOString()}>
              {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        </article>
      ))}

      {isLoading && (
        <div className="flex items-center gap-4 bg-white/[0.02] w-fit p-5 rounded-[2rem] border border-white/5 animate-pulse" aria-live="assertive">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <span className="text-[10px] font-black text-orange-500/70 uppercase tracking-[0.2em]">سلامتك يفكر الآن...</span>
        </div>
      )}
      <div ref={bottomRef} className="h-10" />
    </div>
  );
};

export default ChatWindow;
