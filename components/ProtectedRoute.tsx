'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, setUser, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  // 1. Verify Token & Profile Existence
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await api.get('/profiles');
        if (!user && response.data?.data?.user) {
          setUser(response.data.data.user);
        }
        setIsVerifying(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
           if (!pathname.includes('/setup/profile')) {
             router.replace('/setup/profile');
           }
           setIsVerifying(false);
           return;
        }
        logout();
        router.replace('/auth/login');
      }
    };

    if (!isAuthenticated) {
      verifyAccess();
    } else {
      setIsVerifying(false);
    }
  }, [isAuthenticated, router, setUser, logout, user, pathname]);

  // 2. Safe Admin & Matrimony Route Guards
  useEffect(() => {
    if (!isVerifying && user) {
      const isAdmin = user?.role === 'admin' || user?.email === 'admin@admin.com';

      // --- ADMIN GUARD ---
      if (requireAdmin && !isAdmin) {
        router.replace('/home'); 
        return;
      }

      // --- MATRIMONY GUARD ---
      if (pathname.startsWith('/matrimony')) {
        // Condition 1: Check if they even have the plan
        if (user.plan !== 'matrimony' && !isAdmin) {
          router.replace('/home');
          return;
        }

        // Condition 2: Check if the matrimony profile is actually completed
        if (!isAdmin) {
          api.get('/profiles').then((response) => {
            const isCompleted = response.data?.data?.matrimonyData?.isCompleted;
            if (!isCompleted) {
              router.replace('/setup/matrimony'); // Kick to home if incomplete
            }
          }).catch(() => {
            router.replace('/home');
          });
        }
      }
    }
  }, [isVerifying, requireAdmin, user, router, pathname]);

  // Show a themed loader while checking the token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@admin.com';

  // 3. Stop rendering protected content to prevent screen flashing before redirect
  if (requireAdmin && !isAdmin) {
    return null; 
  }
  
  if (pathname.startsWith('/matrimony') && user?.plan !== 'matrimony' && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}