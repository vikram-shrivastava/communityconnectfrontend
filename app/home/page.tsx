'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import CreatePostModal from '@/components/CreatePostModal';
import { useAuthStore } from '@/store/authStore';
import { Image as ImageIcon } from 'lucide-react';
import CommentsModal from '@/components/CommentsModal';
import InviteCard from '@/components/InviteCard'; 
export default function FeedPage() {
  const { user } = useAuthStore();
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null); // <-- NEW STATE
  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts');
      setFeed(response.data.data.feed);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdded = (postId: string) => {
    setFeed(current => current.map(post => {
      if (post._id === postId) {
        return { ...post, commentsCount: (post.commentsCount || 0) + 1 };
      }
      return post;
    }));
  };

  const handleLike = async (postId: string, isAd: boolean) => {
    if (isAd) return;
    
    try {
      setFeed(current => current.map(post => {
        if (post._id === postId) {
          const isLiking = !post.hasLiked;
          return { 
            ...post, 
            hasLiked: isLiking,
            likesCount: post.likesCount + (isLiking ? 1 : -1) 
          };
        }
        return post;
      }));
      
      await api.post(`/posts/like/${postId}`);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      fetchFeed();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        <main className="max-w-2xl mx-auto px-4 py-8">
          
          {/* Create Post Trigger Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 mb-8 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-left px-6 py-3.5 rounded-full text-slate-500 font-medium transition-colors"
            >
              Share something with the community...
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-3 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors hidden sm:block"
            >
              <ImageIcon size={24} />
            </button>
          </div>

          {/* 🌟 INJECT THE INVITE CARD HERE 🌟 */}
          <InviteCard />

          <h2 className="text-xl font-extrabold text-slate-900 mb-6">Recent Updates</h2>
          
          {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Loading community posts...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((post, index) => (
                <div key={post._id || index} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold border-2 border-orange-500/30">
                        {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{post.user?.name || 'Unknown User'}</p>
                        {post.location && <p className="text-xs text-slate-500">{post.location}</p>}
                        {post.isAd && <span className="inline-block mt-0.5 text-[10px] font-bold tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase">Sponsored</span>}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                  
                  {/* Media Rendering */}
                  {post.media && post.media.length > 0 && (
                    <div className="bg-slate-900 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                      {post.media[0].type === 'video' ? (
                        <video src={post.media[0].url} controls className="w-full max-h-[500px] object-contain" />
                      ) : (
                        <img src={post.media[0].url} alt="Post content" className="w-full max-h-[500px] object-contain" />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-6 border-t border-slate-100 pt-4 mt-2">
                    <button 
                      onClick={() => handleLike(post._id, post.isAd)}
                      className={`flex items-center space-x-2 font-bold ${post.hasLiked ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
                    >
                      <span className="text-xl">{post.hasLiked ? '❤️' : '🤍'}</span>
                      <span>{post.likesCount || 0}</span>
                    </button>
                    <button 
                      onClick={() => setActiveCommentId(post._id)}
                      className="flex items-center space-x-2 font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <span className="text-xl">💬</span>
                      <span>{post.commentsCount || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {feed.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No posts yet</h3>
                  <p className="text-slate-500">Be the first to share an update with the network!</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* The Upload Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchFeed} 
      />

      <CommentsModal 
        postId={activeCommentId} 
        isOpen={!!activeCommentId} 
        onClose={() => setActiveCommentId(null)} 
        onCommentAdded={handleCommentAdded}
      />
    </ProtectedRoute>
  );
}