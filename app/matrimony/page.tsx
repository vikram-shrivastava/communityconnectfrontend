'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X as CloseIcon, MapPin, Briefcase, Heart } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link'; // 🌟 Added Link import

export default function MatrimonyFeed() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/matrimony/feed');
      setMatches(response.data.data.matches);
    } catch (error: any) {
      console.error("Failed to fetch matches:", error.response?.data?.message || error.message);
      alert(error.response?.data?.message || "Failed to load matches.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 Added the 'e' (event) parameter to stop the link from triggering when buttons are clicked
  const handleInteraction = async (e: React.MouseEvent, receiverId: string, type: 'interest' | 'pass') => {
    e.preventDefault(); 
    e.stopPropagation();

    // Optimistically remove the card from the UI
    setMatches((prev) => prev.filter((m) => m.user._id !== receiverId));

    try {
      await api.post(`/matrimony/${type}`, { receiverId });
    } catch (error) {
      console.error(`Failed to send ${type}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 overflow-hidden">
        <Navbar />
        
        <main className="max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-8 text-center">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Matches</span>
          </h1>

          <div className="relative w-full h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">🏜️</div>
                <h3 className="text-xl font-bold text-slate-900">You're all caught up!</h3>
                <p className="text-slate-500">Check back later for new profiles.</p>
              </div>
            ) : (
              <AnimatePresence>
                {matches.map((match, index) => {
                  const isTop = index === 0;
                  
                  // 🌟 Safely extract the image (prioritizes matrimony photos, falls back to profile picture)
                  const firstPhoto = match.matrimonyData?.matrimonyPhotos?.[0];
                  const imageUrl = typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url || match.profilePicture;

                  return (
                    <motion.div
                      key={match._id}
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ 
                        scale: isTop ? 1 : 0.95, 
                        opacity: isTop ? 1 : 0.5, 
                        y: isTop ? 0 : 20,
                        zIndex: matches.length - index 
                      }}
                      exit={{ x: match.swipeDirection === 'right' ? 300 : -300, opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`absolute inset-0 w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border ${isTop ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'border-slate-800'}`}
                    >
                      {/* 🌟 Wrapped the content in a Link to route to the user's profile */}
                      <Link href={`/profile/${match.user?._id}`} className="block h-full cursor-pointer relative z-10">
                        {/* Profile Photo Rendering */}
                        <div className="h-3/5 bg-slate-800 relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
                          
                          {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={match.fullName} 
                                className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-4xl">
                              {match.fullName?.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Profile Info */}
                        <div className="p-6 relative z-20 -mt-10">
                          <h2 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
                            {match.fullName} 
                            {match.user?.isVerified && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">✓</span>}
                          </h2>
                          
                          <div className="space-y-2 mt-4">
                            <p className="text-slate-300 text-sm flex items-center gap-2">
                              <MapPin size={16} className="text-orange-500"/> {match.currentCity}
                            </p>
                            <p className="text-slate-300 text-sm flex items-center gap-2">
                              <Briefcase size={16} className="text-orange-500"/> {match.designation} at {match.companyName}
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* Action Buttons - Placed OUTSIDE the Link to prevent routing conflicts */}
                      {isTop && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 px-6 z-30">
                          <button 
                            onClick={(e) => handleInteraction(e, match.user._id, 'pass')}
                            className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 border border-slate-700 transition-all hover:scale-110"
                          >
                            <CloseIcon size={24} />
                          </button>
                          <button 
                            onClick={(e) => handleInteraction(e, match.user._id, 'interest')}
                            className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-slate-900 hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:scale-110"
                          >
                            <Heart fill="currentColor" size={24} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}