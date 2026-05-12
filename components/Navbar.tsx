'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import api from '@/lib/api';
import ChatSidebar from './ChatSidebar';
import { 
    Home, Users, Heart, UserCircle, Megaphone, 
    ShieldCheck, Clock, LogOut, Menu, X, MessageCircle 
} from 'lucide-react';

export default function Navbar() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuthStore();
    const toggleChat = useUIStore((state) => state.toggleChat);
    const pathname = usePathname();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Permissions
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@admin.com';
    const isMatrimonyUser = user?.plan === 'matrimony' || isAdmin;

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout'); 
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            logout();
            router.push('/auth/login');
        }
    };

    // Helper component for active link styling
    const NavItem = ({ href, icon: Icon, label, show = true }: any) => {
        if (!show) return null;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        
        return (
            <Link 
                href={href} 
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 md:py-2 md:px-4 rounded-xl transition-all font-bold text-[10px] md:text-sm ${
                    isActive 
                    ? 'text-orange-500 bg-orange-50 md:bg-orange-500/10' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
                <Icon size={20} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
                <span className="hidden md:block">{label}</span>
                <span className="md:hidden mt-0.5">{label}</span>
            </Link>
        );
    };

    return (
        <>
            {/* TOP NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    
                    {/* Brand Logo */}
                    <Link href={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-extrabold shadow-md group-hover:scale-105 transition-transform">
                            K
                        </div>
                        <span className="font-extrabold text-xl text-slate-900 tracking-tight hidden sm:block">
                            Kayasth<span className="text-orange-500">Connect</span>
                        </span>
                    </Link>

                    {isAuthenticated ? (
                        <>
                            {/* Desktop Center Links */}
                            <div className="hidden md:flex items-center gap-2">
                                <NavItem href="/home" icon={Home} label="Feed" />
                                <NavItem href="/members" icon={Users} label="Members" />
                                <NavItem href="/matrimony" icon={Heart} label="Matrimony" show={isMatrimonyUser} />
                                {/* 🌟 ADDED: Community Review visible on Main Nav for Admins */}
                                <NavItem href="/community-review" icon={Clock} label="Review Queue" show={isAdmin} />
                            </div>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-2 sm:gap-4">
                                
                                {/* CHAT BUTTON */}
                                <button 
                                    onClick={toggleChat} 
                                    className="relative p-2 text-slate-500 hover:text-orange-500 bg-slate-50 hover:bg-orange-50 rounded-full transition-colors"
                                >
                                    <MessageCircle size={22} />
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                                </button>

                                {/* Mobile Hamburger Menu */}
                                <button 
                                    className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>

                                {/* Desktop Profile Dropdown */}
                                <div className="relative hidden md:block">
                                    <button 
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="flex items-center gap-2 p-1.5 pr-4 rounded-full border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all bg-white"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700">{user?.name?.split(' ')[0]}</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 py-3 border-b border-slate-100 mb-2">
                                                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                                <p className="text-xs font-medium text-slate-500">{user?.email}</p>
                                            </div>
                                            
                                            <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                                                <UserCircle size={18} /> My Profile
                                            </Link>
                                            <Link href="/campaigns" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                                                <Megaphone size={18} /> Ad Campaigns
                                            </Link>
                                            
                                            {/* Admin / Governance Tools */}
                                            {isAdmin && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-2" />
                                                    <div className="px-4 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Management</div>
                                                    <Link href="/admin/dashboard" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                                                        <ShieldCheck size={18} /> Admin Dashboard
                                                    </Link>
                                                </>
                                            )}

                                            <div className="h-px bg-slate-100 my-2" />
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                                                <LogOut size={18} /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Unauthenticated Links */
                        <div className="flex items-center gap-4">
                            <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Log in</Link>
                            <Link href="/auth/register" className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            {isAuthenticated && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)] overflow-x-auto">
                    <div className="flex items-center justify-around px-2 py-2 min-w-max gap-4">
                        <NavItem href="/home" icon={Home} label="Feed" />
                        <NavItem href="/members" icon={Users} label="Members" />
                        <NavItem href="/matrimony" icon={Heart} label="Matrimony" show={isMatrimonyUser} />
                        {/* 🌟 ADDED to Mobile Bottom Bar for Admins */}
                        <NavItem href="/community-review" icon={Clock} label="Review" show={isAdmin} />
                        <NavItem href="/profile" icon={UserCircle} label="Profile" />
                    </div>
                </div>
            )}

            {/* MOBILE HAMBURGER MENU OVERLAY */}
            {isMobileMenuOpen && isAuthenticated && (
                <div className="md:hidden fixed inset-0 z-30 bg-white pt-20 px-6 animate-in slide-in-from-right">
                    <div className="flex flex-col gap-2 pb-24 overflow-y-auto h-full">
                        <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                            <p className="font-bold text-slate-900">{user?.name}</p>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>

                        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1 mt-2">Tools</p>
                        <Link href="/campaigns" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 font-bold text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                            <Megaphone size={20} /> Ad Campaigns
                        </Link>
                        
                        {isAdmin && (
                            <>
                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1 mt-4">Management</p>
                                <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 font-bold text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                                    <ShieldCheck size={20} /> Admin Dashboard
                                </Link>
                            </>
                        )}
                        
                        <div className="mt-8">
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-50 font-bold text-red-500 hover:bg-red-100 transition-colors">
                                <LogOut size={20} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GLOBAL CHAT COMPONENT */}
            <ChatSidebar />
        </>
    );
}