
import React, { useEffect, useState, useRef } from 'react';

interface LiveCallOverlayProps {
  onClose: () => void;
  isConnecting: boolean;
}

const LiveCallOverlay: React.FC<LiveCallOverlayProps> = ({ onClose, isConnecting }) => {
  const [pulse, setPulse] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p === 1 ? 1.2 : 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0a09]/95 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center gap-12 max-w-md w-full px-6">
        
        {/* حالة الاتصال */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
             <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">HSE LIVE CALL</span>
          </div>
          <h2 className="text-4xl font-black text-white">مكالمة "سلامتك"</h2>
          <p className="text-slate-400 font-medium">
            {isConnecting ? 'جاري الاتصال بخبير السلامة...' : 'المكالمة نشطة الآن - تحدث بحرية'}
          </p>
        </div>

        {/* الأنيميشن المركزي */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-orange-600/20 rounded-full blur-3xl transition-transform duration-1000"
            style={{ transform: `scale(${pulse * 1.5})` }}
          ></div>
          <div 
            className="w-48 h-48 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full shadow-[0_0_60px_rgba(234,88,12,0.4)] flex items-center justify-center border-4 border-white/10 relative z-10 transition-transform duration-1000"
            style={{ transform: `scale(${pulse})` }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>

          {/* حلقات الموجة الصوتية */}
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="absolute border border-orange-500/30 rounded-full animate-ping"
              style={{ 
                width: '100%', 
                height: '100%', 
                animationDuration: `${i + 1}s`,
                animationDelay: `${i * 0.5}s`
              }}
            ></div>
          ))}
        </div>

        {/* التعليمات */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center w-full">
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            اطرح أسئلتك حول إجراءات السلامة، معدات الحماية، أو أي مخاطر بيئية وسأجيبك فوراً بالصوت.
          </p>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-6 mt-8">
          <button 
            onClick={onClose}
            className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-900/40 transition-all hover:scale-110 active:scale-90 group"
            aria-label="إنهاء المكالمة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 transform rotate-[135deg] group-hover:rotate-[145deg] transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LiveCallOverlay;
