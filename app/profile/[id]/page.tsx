// app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { MapPin, Briefcase, Loader2, ArrowLeft } from 'lucide-react';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id; // Extracts the ID from the URL

    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // Calls the getUserProfile backend controller we created earlier
                const response = await api.get(`/profiles/${userId}`);
                setProfile(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load profile.');
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) fetchUserProfile();
    }, [userId]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center text-slate-500 hover:text-orange-500 font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={20} /> Back to Feed
                    </button>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-orange-500" size={40} />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-red-200">
                            <h3 className="text-xl font-bold text-red-500 mb-2">Oops!</h3>
                            <p className="text-slate-500">{error}</p>
                        </div>
                    ) : profile ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Banner / Header */}
                            <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                            
                            <div className="px-8 pb-8 relative">
                                {/* Profile Picture / Avatar */}
                                <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-white text-4xl font-bold -mt-12 mb-4 shadow-lg">
                                    {profile.profilePicture ? (
                                        <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        profile.fullName?.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <div className="mb-6">
                                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                                        {profile.fullName}
                                        {profile.user?.isVerified && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[12px] text-white">✓</span>}
                                    </h1>
                                    
                                    <div className="flex flex-wrap gap-4 mt-3 text-slate-600 font-medium">
                                        {profile.currentCity && (
                                            <span className="flex items-center gap-1.5"><MapPin size={18} className="text-orange-500"/> {profile.currentCity}</span>
                                        )}
                                        {profile.designation && (
                                            <span className="flex items-center gap-1.5"><Briefcase size={18} className="text-orange-500"/> {profile.designation} {profile.companyName ? `at ${profile.companyName}` : ''}</span>
                                        )}
                                    </div>
                                </div>

                                {profile.bio && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h3 className="font-bold text-slate-900 mb-2">About</h3>
                                        <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </ProtectedRoute>
    );
}