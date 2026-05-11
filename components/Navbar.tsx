'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { MessageCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import ChatSidebar from './ChatSidebar';

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const toggleChat = useUIStore((state) => state.toggleChat);
  
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout'); 
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      router.push('/auth/login');
    }
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight">
                Kayasth Connect
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/home" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Feed</Link>

                  {/* MATRIMONY LINK (Only for Matrimony plan users or Admins) */}
                  {(user?.plan === 'matrimony' || user?.role === 'admin' || user?.email === 'admin@admin.com') && (
                    <Link href="/matrimony" className="text-sm font-semibold text-pink-600 hover:text-pink-800">
                      Matrimony
                    </Link>
                  )}
                  
                  {/* ADMIN PANEL LINK */}
                  {(user?.role === 'admin' || user?.email === 'admin@admin.com') && (
                    <Link href="/admin/dashboard" className="text-sm font-semibold text-red-600 hover:text-red-800">
                      Admin Panel
                    </Link>
                  )}

                  {/* CHAT BUTTON */}
                  <button 
                    onClick={toggleChat} 
                    className="relative p-2 text-slate-600 hover:text-orange-500 transition-colors ml-2"
                  >
                    <MessageCircle size={24} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                  </button>

                  {/* USER AVATAR */}
                  <Link href="/profile" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm ml-2 hover:ring-2 hover:ring-orange-500 transition-all">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Link>
                  
                  <button onClick={handleLogout} className="text-sm font-semibold text-slate-500 hover:text-slate-900 ml-2">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Log in</Link>
                  <Link href="/auth/register" className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mount the Chat Sidebar Globally */}
      <ChatSidebar />
    </>
  );
}