'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios'; // <-- Import plain axios
import api from '@/lib/api'; // <-- Keep api for protected routes
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function LoginPage() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Log the user in using PLAIN AXIOS (bypasses interceptors)
            const response = await axios.post(`${API_URL}/auth/login`, formData);
            
            const { user, accessToken, refreshToken } = response.data.data;
            setUser(user);

            // Save tokens immediately so the next request can use them
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // 2. Check if Profile exists using the API HELPER (attaches the token we just saved)
            try {
                await api.get('/profiles');

                // Profile exists! Route normally.
                if (user.role === 'admin' || user.email === 'admin@admin.com') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/home');
                }
            } catch (profileErr: any) {
                // 3. Profile NOT found (404) -> Send to setup
                if (profileErr.response?.status === 404) {
                    router.push('/setup/profile');
                } else {
                    router.push('/home');
                }
            }

        } catch (err: any) {
            const status = err.response?.status;
            const responseData = err.response?.data?.data;
            if (status === 403 && responseData?.status === 'waitlist') {
                router.push(`/auth/waitlist?userId=${responseData.userId}`);
            } else {
                setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back</h2>
                    <p className="text-slate-500">Log in to access the community.</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 bg-white"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <a href="#" className="text-sm font-semibold text-slate-900 hover:underline">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 bg-white"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    New to the network? <Link href="/auth/register" className="font-bold text-slate-900 hover:underline">Create an account</Link>
                </p>
            </div>
        </div>
    );
}