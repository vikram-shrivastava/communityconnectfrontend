'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

export default function CommunityReviewPage() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      // NOTE: Ensure your backend has an endpoint that returns waitlisted users for community review
      const response = await api.get('/community/waitlist'); 
      setWaitlist(response.data.data);
    } catch (error) {
      console.error("Failed to fetch waitlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      // Optimistic Update
      setWaitlist((prev) => prev.filter((user) => user._id !== userId));
      // Point this to a community-accessible route
      await api.patch(`/community/users/${userId}/approve`);
    } catch (error: any) {
      alert("Failed to approve member.");
      fetchWaitlist(); // Revert on fail
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Community Review</h1>
              <p className="text-slate-500">Help maintain trust. Review and approve pending community members.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-slate-500">Loading pending requests...</div>
          ) : waitlist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Queue is Empty!</h3>
              <p className="text-slate-500">There are currently no users waiting for approval.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {waitlist.map((user) => (
                <motion.div 
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      WAITLIST
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleApprove(user._id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors group-hover:bg-orange-500"
                  >
                    <CheckCircle size={18} />
                    Approve Member
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}