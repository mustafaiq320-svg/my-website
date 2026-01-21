
import React from 'react';

const Header: React.FC = () => {
  return (
    <header 
      className="bg-transparent text-white py-4 px-4 flex-1"
      role="banner"
      aria-label="ترويسة تطبيق سلامتك - وحدة HSE"
    >
      <div className="flex items-center gap-5 group cursor-pointer w-fit">
        {/* شعار HSE المبتكر */}
        <div className="relative" aria-hidden="true">
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 w-16 h-16 rounded-2xl shadow-xl shadow-orange-900/40 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 border border-white/10">
            <span className="text-white font-black text-xl tracking-tighter leading-none select-none">HSE</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400/30 rounded-full blur-sm"></div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#0f0a09] p-1 rounded-lg border border-white/5 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="text-right flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-[2px] w-4 bg-orange-600/50 rounded-full"></div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] leading-none">HSE UNIT</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none text-white mb-1">
            سلامتك
          </h1>
          <p className="text-[11px] text-slate-400 font-bold leading-tight">
            مقدم من وحدة <span className="text-orange-500/90 italic">HSE</span> في الفرقة الزلزالية الثامنة
          </p>
          <p className="text-[9px] text-slate-500 font-black mt-1.5 tracking-[0.1em] uppercase opacity-60 border-t border-white/5 pt-1">
            الذكاء الاصطناعي في خدمة السلامة
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
