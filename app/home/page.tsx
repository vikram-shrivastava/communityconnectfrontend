'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import CreatePostModal from '@/components/CreatePostModal';
import { useAuthStore } from '@/store/authStore';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import CommentsModal from '@/components/CommentsModal';
import InviteCard from '@/components/InviteCard';

export default function FeedPage() {
  const { user } = useAuthStore();

  // Post & Pagination States
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loading States
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // For infinite scroll

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // 🌟 FIX 1: Track Ad Impressions with the correct URL params
  useEffect(() => {
    // Only track posts that are ads
    const adElements = document.querySelectorAll('[data-campaign-id]');

    const adObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const campaignId = entry.target.getAttribute('data-campaign-id');

          // Fire the impression to the backend using the dynamic URL parameter
          api.post(`/campaigns/impression/${campaignId}`).catch(e => console.error(e));

          // Stop observing so we don't count it twice if they scroll up and down
          adObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // Triggers when 50% of the ad is visible on screen

    adElements.forEach(el => adObserver.observe(el));

    return () => adObserver.disconnect();
  }, [feed]); // Re-run when feed updates

  // 1. Fetch Feed Logic
  const fetchFeed = async (pageNum: number) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      const response = await api.get(`/posts?page=${pageNum}&limit=10`);
      const newPosts = response.data.data.feed;

      if (newPosts.length === 0) {
        setHasMore(false); // We hit the end of the database
      } else {
        // If it's page 1, replace. If it's page > 1, append.
        setFeed(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);

        // If we got fewer than 10 posts back, there are no more left
        if (newPosts.length < 10) setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Trigger fetch when page changes
  useEffect(() => {
    fetchFeed(page);
  }, [page]);

  // 2. The Intersection Observer (The Infinite Scroll Magic)
  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // If the last element is visible on screen, and we have more posts to load...
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1); // Bump the page number, triggering the useEffect
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  // Actions
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
            likesCount: (post.likesCount || 0) + (isLiking ? 1 : -1)
          };
        }
        return post;
      }));

      await api.post(`/posts/like/${postId}`);
    } catch (error) {
      console.error("Failed to toggle like");
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

          <InviteCard />

          <h2 className="text-xl font-extrabold text-slate-900 mb-6">Recent Updates</h2>

          {/* Initial Loading State */}
          {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Loading community posts...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((post, index) => {
                // Determine if this is the last post in the array
                const isLastPost = feed.length === index + 1;

                return (
                  <div
                    key={post._id || index}
                    // Attach the invisible tripwire ONLY to the very last post
                    ref={isLastPost ? lastPostElementRef : null}
                    data-campaign-id={post.isAd ? post.campaignId : undefined} // Added for Impression tracking
                    className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"
                  >
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
                      <div className="bg-slate-900 rounded-2xl overflow-hidden mb-4 flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (post.isAd) {
                            // 🌟 FIX 2: Fire the click to the backend using the dynamic URL parameter
                            api.post(`/campaigns/click/${post.campaignId}`).catch(e => console.error(e));
                          }
                        }}>
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
                );
              })}

              {/* Empty State */}
              {feed.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No posts yet</h3>
                  <p className="text-slate-500">Be the first to share an update with the network!</p>
                </div>
              )}

              {/* Auto-loading Spinner at the bottom */}
              {isFetchingMore && (
                <div className="py-6 flex justify-center">
                  <Loader2 size={32} className="animate-spin text-orange-500" />
                </div>
              )}

              {/* End of Feed Message */}
              {!hasMore && feed.length > 0 && (
                <div className="text-center py-8 text-slate-400 font-bold text-sm">
                  You've caught up on all the posts! 🎉
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPage(1); // Reset to top when you create a new post
          fetchFeed(1);
        }}
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