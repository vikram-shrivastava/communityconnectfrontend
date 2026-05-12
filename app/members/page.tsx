'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Briefcase, GraduationCap, Loader2, Users } from 'lucide-react';

export default function MembersDirectoryPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                // Pointing to our new Profile-based directory route
                const response = await api.get('/profiles/directory'); 
                setMembers(response.data.data);
            } catch (error) {
                console.error("Failed to fetch members:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, []);

    // Filter members based on search query (Name or City)
    const filteredMembers = members.filter(member => 
        member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.currentCity?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 pb-12">
                <Navbar />

                <main className="max-w-5xl mx-auto px-4 mt-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <Users className="text-orange-500" size={32} />
                                Community Members
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Discover and connect with professionals in the network.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-slate-400" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                            <p className="text-slate-500 font-bold">Loading members...</p>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <div className="text-5xl mb-4">🕵️‍♂️</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No members found</h3>
                            <p className="text-slate-500">We couldn't find anyone matching "{searchQuery}".</p>
                        </div>
                    ) : (
                        /* Grid Layout */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMembers.map((member, index) => {
                                // Prioritize standard profile pic, fallback to matrimony pic, then fallback to initial
                                const imageUrl = member.profilePicture || member.matrimonyData?.matrimonyPhotos?.[0]?.url;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={member._id}
                                    >
                                        <Link 
                                            href={`/profile/${member.user?._id || member.user}`} 
                                            className="block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group overflow-hidden"
                                        >
                                            {/* Decorative Top Banner */}
                                            <div className="h-16 bg-slate-900 group-hover:bg-orange-500 transition-colors duration-300"></div>
                                            
                                            <div className="px-6 pb-6 relative">
                                                {/* Avatar */}
                                                <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-slate-500 text-2xl font-extrabold -mt-10 mb-3 overflow-hidden shadow-sm">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        member.fullName?.charAt(0).toUpperCase() || 'U'
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5 group-hover:text-orange-500 transition-colors">
                                                        {member.fullName}
                                                        {member.user?.isVerified && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">✓</span>}
                                                    </h3>

                                                    <div className="mt-3 space-y-2">
                                                        {/* City */}
                                                        {member.currentCity && (
                                                            <div className="flex items-center text-sm font-medium text-slate-500 gap-2">
                                                                <MapPin size={16} className="text-orange-400" />
                                                                <span className="truncate">{member.currentCity}</span>
                                                            </div>
                                                        )}

                                                        {/* Education OR Designation based on employment status */}
                                                        {member.employmentStatus === 'student' ? (
                                                            <div className="flex items-center text-sm font-medium text-slate-500 gap-2">
                                                                <GraduationCap size={16} className="text-orange-400" />
                                                                <span className="truncate">
                                                                    {member.matrimonyData?.education || "Student"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-sm font-medium text-slate-500 gap-2">
                                                                <Briefcase size={16} className="text-orange-400" />
                                                                <span className="truncate">
                                                                    {member.designation ? `${member.designation} ${member.companyName ? `at ${member.companyName}` : ''}` : "Professional"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}