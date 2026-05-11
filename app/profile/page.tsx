'use client';

import { useEffect, useState, useRef } from 'react';
import { Edit3, ShieldCheck, MapPin, Grid, Heart, GraduationCap, Briefcase, Megaphone, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import InviteCard from '@/components/InviteCard';
import CreatePostModal from '@/components/CreatePostModal';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import CommentsModal from '@/components/CommentsModal'; // <-- Make sure to import this at the top!
export default function ProfilePage() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    // Modals & Upload States
    const [viewMode, setViewMode] = useState<'normal' | 'matrimony'>('normal');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);


    // 1. Add Optimistic Like function for the Profile Grid
    const handleLike = async (postId: string) => {
        try {
            // Instantly update UI
            setUserPosts(current => current.map(post => {
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

            // Ping Backend
            await api.post(`/posts/like/${postId}`);
        } catch (error) {
            console.error("Failed to toggle like");
        }
    };

    // 2. Add Optimistic Comment function
    const handleCommentAdded = (postId: string) => {
        setUserPosts(current => current.map(post => {
            if (post._id === postId) {
                return { ...post, commentsCount: (post.commentsCount || 0) + 1 };
            }
            return post;
        }));
    };
    const fetchData = async () => {
        try {
            const [profileRes, postsRes] = await Promise.all([
                api.get('/profiles'),
                api.get(`/posts/user/${user?._id}`)
            ]);
            setProfile(profileRes.data.data);
            setUserPosts(postsRes.data.data);
        } catch (error) {
            console.error("Failed to fetch profile data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchData();
    }, [user]);

    // Handle direct Matrimony Photo Upload
    const handleAddMatrimonyPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (profile.matrimonyData?.matrimonyPhotos?.length >= 5) {
            alert("You can only have up to 5 matrimony photos.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be under 10MB");
            return;
        }

        setIsUploadingPhoto(true);
        try {
            // 1. Get Signature
            const sigResponse = await api.get('/upload/signature?folder=matrimony_profiles');
            const { signature, timestamp, folder, apiKey, cloudName } = sigResponse.data.data;

            // 2. Upload to Cloudinary
            const cldFormData = new FormData();
            cldFormData.append('file', file);
            cldFormData.append('api_key', apiKey);
            cldFormData.append('timestamp', timestamp.toString());
            cldFormData.append('signature', signature);
            cldFormData.append('folder', folder);

            const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, cldFormData);

            const newPhoto = {
                url: response.data.secure_url,
                publicId: response.data.public_id,
                isMain: false
            };

            // 3. Update Database
            const currentPhotos = profile.matrimonyData?.matrimonyPhotos || [];
            const updatedPhotos = [...currentPhotos, newPhoto];

            await api.patch('/profiles/update-matrimony', {
                matrimonyData: { matrimonyPhotos: updatedPhotos }
            });

            // 4. Refresh Profile UI
            await fetchData();
        } catch (err) {
            alert("Failed to upload photo. Please try again.");
        } finally {
            setIsUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

    const hasMatrimony = user?.plan === 'matrimony' && profile?.matrimonyData?.isCompleted;
    const isMatrimonyView = viewMode === 'matrimony';
    const canAddMatrimonyPhoto = profile?.matrimonyData?.matrimonyPhotos?.length < 5;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-3xl mx-auto px-4 py-12">

                    {/* PROFILE TOGGLE */}
                    {hasMatrimony && (
                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-200/50 p-1 rounded-2xl flex shadow-inner">
                                <button
                                    onClick={() => setViewMode('normal')}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${!isMatrimonyView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    General Profile
                                </button>
                                <button
                                    onClick={() => setViewMode('matrimony')}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${isMatrimonyView ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'text-slate-500 hover:text-pink-600'}`}
                                >
                                    Matrimony Profile
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden relative mb-8 transition-colors duration-500 ${isMatrimonyView ? 'border-pink-200' : 'border-slate-200'}`}>

                        {/* Header Banner */}
                        <div className={`h-32 relative overflow-hidden transition-colors duration-500 ${isMatrimonyView ? 'bg-pink-900' : 'bg-slate-900'}`}>
                            <div className={`absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full blur-[60px] ${isMatrimonyView ? 'bg-pink-500/40' : 'bg-orange-500/30'}`} />
                        </div>

                        <div className="px-8 pb-8 relative">
                            {/* Profile Avatar */}
                            <div className="relative -mt-16 w-32 h-32 mx-auto mb-4">
                                <div className="w-full h-full rounded-full bg-slate-800 border-[3px] border-slate-50 p-1">
                                    {isMatrimonyView && profile.matrimonyData?.matrimonyPhotos?.[0]?.url ? (
                                        <img src={profile.matrimonyData.matrimonyPhotos[0].url} alt="Profile" className="w-full h-full rounded-full object-cover border border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
                                    ) : (
                                        <div className={`w-full h-full rounded-full flex items-center justify-center border text-4xl font-extrabold bg-slate-900 ${isMatrimonyView ? 'border-pink-500 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]'}`}>
                                            {profile?.fullName?.charAt(0) || "U"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Info */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
                                    {profile?.fullName}
                                    {user?.plan === 'business' && !isMatrimonyView && <ShieldCheck className="text-orange-500" size={24} />}
                                    {isMatrimonyView && <Heart className="text-pink-500" fill="currentColor" size={24} />}
                                </h1>

                                <p className="text-slate-500 mt-2 font-medium max-w-lg mx-auto leading-relaxed">
                                    {isMatrimonyView
                                        ? profile?.matrimonyData?.aboutFamily || "Family details not provided."
                                        : profile?.bio || "No bio added yet. Tell the community about yourself!"}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-slate-700 font-semibold text-sm">
                                    <span className="flex items-center gap-1"><MapPin size={16} className={isMatrimonyView ? "text-pink-500" : "text-orange-500"} /> {profile?.currentCity || "Location not set"}</span>
                                    {profile?.employmentStatus && <span className="flex items-center gap-1"><Briefcase size={16} className={isMatrimonyView ? "text-pink-500" : "text-orange-500"} /> {profile.employmentStatus}</span>}
                                    {isMatrimonyView && profile.matrimonyData?.education && <span className="flex items-center gap-1"><GraduationCap size={16} className="text-pink-500" /> {profile.matrimonyData.education}</span>}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-6">
                                <button className={`flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all ${isMatrimonyView ? 'bg-pink-600 hover:bg-pink-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                    <Edit3 size={18} /> Edit {isMatrimonyView ? 'Matrimony' : 'General'} Profile
                                </button>

                                {/* AD CAMPAIGN BUTTON (Only in Normal View) */}
                                {!isMatrimonyView && (
                                    <Link href="/campaigns" className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-slate-900 font-extrabold rounded-xl hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                        <Megaphone size={18} /> Ad Campaigns
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MATRIMONY VIEW: Photo Gallery */}
                    {isMatrimonyView && profile?.matrimonyData?.matrimonyPhotos && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Heart size={20} className="text-pink-500" /> Photo Gallery
                                </h2>

                                {/* MATRIMONY: DIRECT PHOTO UPLOAD */}
                                {canAddMatrimonyPhoto && (
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={isUploadingPhoto}
                                        className="text-sm font-bold bg-pink-100 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        Add Photo
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative">
                                {isUploadingPhoto && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                                        <div className="flex flex-col items-center text-pink-600 font-bold">
                                            <Loader2 size={32} className="animate-spin mb-2" />
                                            Uploading...
                                        </div>
                                    </div>
                                )}

                                {profile.matrimonyData.matrimonyPhotos.map((photo: any, idx: number) => (
                                    <div key={idx} className="aspect-[3/4] bg-slate-200 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative group">
                                        <img src={photo.url} alt={`Matrimony ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        {photo.isMain && (
                                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg">
                                                MAIN
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NORMAL VIEW: Instagram-style Grid */}
                    {!isMatrimonyView && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Grid size={20} className="text-orange-500" /> Activity Grid
                                </h2>

                                {/* NORMAL: DIRECT CREATE POST */}
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-sm font-bold bg-orange-100 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} /> New Post
                                </button>
                            </div>

                            {userPosts.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                                    <div className="text-4xl mb-4">📷</div>
                                    <p className="text-slate-500 font-medium">You haven't posted anything yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                    {userPosts.map((post) => (
                                        <div key={post._id} className="aspect-square bg-white border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden relative group cursor-pointer">
                                            {post.media && post.media.length > 0 ? (
                                                post.media[0].type === 'video' ? (
                                                    <video src={post.media[0].url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={post.media[0].url} alt="Post" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-50">
                                                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-4 text-center break-words">{post.caption}</p>
                                                </div>
                                            )}
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-4">
                                                {/* LIKE BUTTON */}
                                                <button onClick={(e) => { e.stopPropagation(); handleLike(post._id); }} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                                                    <Heart fill={post.hasLiked ? "currentColor" : "none"} className={post.hasLiked ? "text-orange-500" : ""} size={16} />
                                                    {post.likesCount || 0}
                                                </button>

                                                {/* COMMENT BUTTON */}
                                                <button onClick={(e) => { e.stopPropagation(); setActiveCommentId(post._id); }} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                                                    💬 {post.commentsCount || 0}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hidden File Input for Matrimony Photo */}
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handleAddMatrimonyPhoto} />

                    {/* Invite Card stays at the bottom */}
                    {!isMatrimonyView && <InviteCard />}

                </main>
            </div>

            {/* Post Creation Modal */}
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    // Instantly fetch to update the profile grid
                    fetchData();
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