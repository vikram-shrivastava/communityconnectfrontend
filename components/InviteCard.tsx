'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function InviteCard() {
  const [inviteData, setInviteData] = useState<{ inviteCode: string; message: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const response = await api.get('/auth/invite-link');
        setInviteData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch invite link", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInviteCode();
  }, []);

  const handleCopy = async () => {
    if (inviteData?.inviteCode) {
      await navigator.clipboard.writeText(inviteData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-slate-100 rounded-3xl animate-pulse mb-8 border border-slate-200"></div>
    );
  }

  if (!inviteData) return null; // Hide if user isn't approved/active

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full bg-slate-900 rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-800 group"
    >
      {/* Background Glaze */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/30 transition-all duration-700" />
      
      <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Messaging */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Sparkles className="text-orange-500" size={20} />
            <h3 className="text-xl font-extrabold text-white">Grow Our Community</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Help make Kayasth Connect stronger. Share this exclusive invite code with trusted members of the Kayasth community so they can skip the waitlist instantly!
          </p>
        </div>

        {/* Right Side: The Code & Actions */}
        <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-2xl p-1 w-full max-w-[250px] backdrop-blur-md">
            <div className="flex-1 px-4 py-2 font-mono font-bold text-lg text-white tracking-widest text-center">
              {inviteData.inviteCode}
            </div>
            <button 
              onClick={handleCopy}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-slate-900 hover:bg-orange-400'
              }`}
            >
              {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join Kayasth Connect',
                  text: inviteData.message,
                  url: inviteData.url
                });
              } else {
                handleCopy();
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 uppercase tracking-wider transition-colors"
          >
            <Share2 size={14} /> Share Link Directly
          </button>
        </div>

      </div>
    </motion.div>
  );
}