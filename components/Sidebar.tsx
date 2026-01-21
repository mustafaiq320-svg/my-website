
import React from 'react';
import { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) => {
  return (
    <aside 
      className="w-80 bg-[#16100e] border-l border-white/5 flex flex-col h-full animate-in slide-in-from-right duration-500"
      aria-label="قائمة المحادثات"
    >
      <div className="p-6">
        <button
          onClick={onNewChat}
          aria-label="بدء محادثة جديدة حول السلامة"
          className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-2xl transition-all shadow-lg shadow-orange-900/20 font-black text-sm active:scale-95 group focus-visible:ring-2 focus-visible:ring-white outline-none"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          محادثة جديدة
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-none pb-10" aria-label="المحادثات السابقة">
        <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]" aria-hidden="true">المحادثات السابقة</div>
        
        {chats.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-700">
            <p className="text-xs font-medium">لا توجد محادثات سابقة بعد.</p>
          </div>
        ) : (
          chats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((chat) => (
            <div 
              key={chat.id}
              role="button"
              tabIndex={0}
              aria-current={activeChatId === chat.id ? "true" : "false"}
              aria-label={`محادثة بعنوان: ${chat.title}`}
              className={`group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                activeChatId === chat.id 
                  ? 'bg-orange-600/10 border-orange-500/30 text-white' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
              onClick={() => onSelectChat(chat.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat.id)}
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 shrink-0 ${activeChatId === chat.id ? 'text-orange-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div className="flex-1 truncate text-sm font-bold">
                {chat.title}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                aria-label={`حذف المحادثة: ${chat.title}`}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 opacity-40">
           <div className="bg-orange-500 w-2 h-2 rounded-full" aria-hidden="true"></div>
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">وحدة HSE - الفرقة 8</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
