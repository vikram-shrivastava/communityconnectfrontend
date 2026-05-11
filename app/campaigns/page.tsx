'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Activity, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

export default function CampaignDashboard() {
  const [data, setData] = useState<any>({ campaigns: [], stats: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns/my-ads'); //
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.patch(`/campaigns/status/${id}`); //
      fetchCampaigns(); // Refresh state
    } catch (e) {
      alert("Failed to toggle status");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Ad Campaigns</h1>
              <p className="text-slate-500">Manage your business promotions.</p>
            </div>
            <Link href="/campaigns/create" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-orange-500/20">
              <PlusCircle size={20} /> Create Ad
            </Link>
          </div>

          {/* Stats Overview */}
          {data.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 font-bold text-sm uppercase">Total Impressions</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">{data.stats.totalImpressions}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 font-bold text-sm uppercase">Total Clicks</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">{data.stats.totalClicks}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                <p className="text-slate-500 font-bold text-sm uppercase">Amount Spent</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">₹{data.stats.totalSpent}</p>
              </div>
            </div>
          )}

          {/* Campaign List */}
          <div className="space-y-4">
            {isLoading ? <div className="text-center text-slate-500 py-10">Loading campaigns...</div> : 
             data.campaigns.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                 <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                 <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Campaigns</h3>
                 <p className="text-slate-500">Create your first ad to reach the community.</p>
               </div>
             ) : (
               data.campaigns.map((camp: any) => (
                 <div key={camp._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                   <div>
                     <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${camp.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' : camp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                       {camp.paymentStatus === 'pending' ? 'Payment Pending' : camp.isActive ? 'Live' : 'Paused'}
                     </span>
                     <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">{camp.post?.caption}</h3>
                     <p className="text-sm text-slate-500 mt-1">Goal: {camp.campaignGoal} • Budget: ₹{camp.budget}</p>
                   </div>
                   {camp.paymentStatus === 'completed' && (
                     <button onClick={() => toggleStatus(camp._id)} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                       {camp.isActive ? <Pause size={20} /> : <Play size={20} />}
                     </button>
                   )}
                 </div>
               ))
             )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}