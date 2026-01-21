
import React, { useState, useEffect, useRef } from 'react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onStartLiveCall: () => void;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, onStartLiveCall, disabled }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (e: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
          else interimTranscript += e.results[i][0].transcript;
        }
        if (finalTranscript) {
          setText(prev => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') setError('يجب السماح بالوصول للميكروفون.');
        else if (event.error !== 'no-speech') setError('حدث خطأ في التسجيل.');
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
      if (isListening) recognitionRef.current?.stop();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("متصفحك لا يدعم التعرف على الكلام.");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  return (
    <div className="p-6 bg-[#1a1210] border-t border-white/5" role="form" aria-label="إرسال استفسار">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            id="message-input"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={isListening ? "جاري الاستماع..." : "اكتب استفسارك هنا..."}
            disabled={disabled}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 text-white placeholder:text-slate-600 transition-all text-right resize-none font-medium min-h-[56px] focus:border-orange-500/50 focus:ring-orange-500/10"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          {/* زر المكالمة الحية */}
          <button
            onClick={onStartLiveCall}
            disabled={disabled}
            aria-label="بدء مكالمة صوتية حية"
            title="مكالمة حية"
            className="w-14 h-14 rounded-2xl bg-orange-600/10 text-orange-500 border border-orange-500/20 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-lg active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>

          <button
            onClick={toggleListening}
            disabled={disabled}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 border border-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v1a7 7 0 01-14 0v-1m7 4v4m-3 0h6" />
            </svg>
          </button>

          <button
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 transform -rotate-45">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
