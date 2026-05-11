'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export default function ChatSidebar() {
  const { isChatOpen, closeChat } = useUIStore();

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-[70] flex flex-col shadow-2xl shadow-orange-500/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white">Messages</h2>
              <button onClick={closeChat} className="text-slate-400 hover:text-orange-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search matches..." 
                  className="w-full bg-slate-800 text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500 border border-slate-700 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Chat List (Mocked) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {[1, 2, 3].map((chat) => (
                <div key={chat} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 font-bold group-hover:scale-105 transition-transform">
                    M
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm">Mutual Match {chat}</h3>
                    <p className="text-slate-400 text-xs truncate">Hey! I saw your profile and...</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}