'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface CommentsModalProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void; // <-- ADD THIS
}

export default function CommentsModal({ postId, isOpen, onClose, onCommentAdded }: CommentsModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/posts/comment/${postId}`); //
      setComments(res.data.data.comments);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post(`/posts/comment/${postId}`, { text: newComment }); //
      setComments([res.data.data, ...comments]); // Optimistic prepend
      setNewComment('');

      // 2. TELL THE PARENT COMPONENT TO UPDATE THE COUNT
      if (onCommentAdded && postId) {
        onCommentAdded(postId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]" />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[70vh] bg-white rounded-t-3xl shadow-2xl z-[90] flex flex-col border-t border-slate-200"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-900">Comments</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-orange-500 bg-slate-100 rounded-full p-2"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No comments yet. Start the conversation!</div>
              ) : (
                comments.map(c => (
                  <div key={c._id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {c.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 flex-1 border border-slate-100">
                      <p className="font-bold text-slate-900 text-sm mb-1">{c.user?.name}</p>
                      <p className="text-slate-700">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={postComment} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-slate-100 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
              <button type="submit" disabled={isPosting || !newComment.trim()} className="bg-orange-500 text-slate-900 p-3 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors">
                {isPosting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}