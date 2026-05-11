'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';

type TabType = 'users' | 'posts' | 'matrimony';

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let endpoint = '/admin/users';
            if (activeTab === 'posts') endpoint = '/admin/posts';
            if (activeTab === 'matrimony') endpoint = '/admin/matrimony';

            const response = await api.get(endpoint);
            setData(response.data.data);
        } catch (error) {
            alert("Failed to fetch admin data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveUser = async (userId: string) => {
        try {
            await api.patch(`/admin/users/${userId}/approve`);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to approve user.");
        }
    };

    const handleToggleBan = async (userId: string) => {
        try {
            await api.patch(`/admin/users/${userId}/ban`);
            fetchData();
        } catch (error) {
            alert("Failed to update user status.");
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await api.delete(`/admin/posts/${postId}`);
                fetchData();
            } catch (error) {
                alert("Failed to delete post.");
            }
        }
    };

    return (
        <ProtectedRoute requireAdmin={true}>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-5xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
                        <p className="text-slate-500 mt-2">Manage community users, moderation, and matrimony approvals.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 bg-slate-200 p-1 rounded-xl mb-6 w-fit">
                        {(['users', 'posts', 'matrimony'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                                    activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    {isLoading ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium">Loading data...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* USERS TAB */}
                            {activeTab === 'users' && (
                                <div className="divide-y divide-slate-100">
                                    {data.map((user) => (
                                        <div key={user._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    user.status === 'waitlist' ? 'bg-amber-100 text-amber-800' :
                                                    user.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    Status: {user?.status ? user.status.toUpperCase() : 'UNKNOWN'}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                {user.status === 'waitlist' ? (
                                                    <button onClick={() => handleApproveUser(user._id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                                                        Approve
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleBan(user._id)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                                                            user.status === 'banned' ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* POSTS TAB */}
                            {activeTab === 'posts' && (
                                <div className="divide-y divide-slate-100">
                                    {data.map((post) => (
                                        <div key={post._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 text-sm mb-1">{post.user?.name || "Unknown User"}</p>
                                                <p className="text-slate-700 line-clamp-2">{post.caption}</p>
                                            </div>
                                            <button onClick={() => handleDeletePost(post._id)} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 text-sm font-bold rounded-lg transition-colors whitespace-nowrap">
                                                Delete Post
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* MATRIMONY TAB (FIXED: Added this entire block) */}
                            {activeTab === 'matrimony' && (
                                <div className="divide-y divide-slate-100">
                                    {data.map((item) => (
                                        <div key={item._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                                            <div className="flex items-center gap-4">
                                                {/* Matrimony Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-extrabold border border-pink-200">
                                                    {item.fullName?.charAt(0).toUpperCase() || "M"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-lg mb-1">{item.fullName}</p>
                                                    <p className="text-slate-600 text-sm capitalize">{item.gender} • {item.currentCity}</p>
                                                </div>
                                            </div>
                                            {/* You can add future Admin actions here (like hide profile, feature profile, etc) */}
                                            <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200">
                                                Profile Active
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* EMPTY STATE */}
                            {data.length === 0 && (
                                <div className="text-center py-20 text-slate-500">No {activeTab} found.</div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}