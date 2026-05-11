'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios'; // <-- Import plain axios

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', inviteCode: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use plain axios to avoid interceptors completely
      await axios.post(`${API_URL}/auth/register`, formData);
      
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email.toLowerCase().trim())}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Join the Network</h2>
          <p className="text-slate-500">Create your account to start the verification process.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-slate-900 bg-white"
              placeholder="e.g. Ramesh Srivastava"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-slate-900 bg-white"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-slate-900 bg-white"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Invite Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none uppercase text-slate-900"
              placeholder="Got an invite? Paste it here"
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (formData.inviteCode ? 'Join Community' : 'Join Waitlist')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link href="/auth/login" className="font-bold text-slate-900 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}