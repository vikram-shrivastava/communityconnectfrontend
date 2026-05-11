'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios'; // <-- Import plain axios

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is missing from the URL.');
    if (code.length < 6) return setError('Please enter the full 6-digit code.');

    setIsLoading(true);
    setError('');

    try {
      // Use plain axios here too
      const response = await axios.post(`${API_URL}/auth/verify`, { email, verifyCode: code });
      const { status, _id } = response.data.data;

      if (status === 'waitlist') {
        router.push(`/auth/waitlist?userId=${_id}`);
      } else {
        router.push('/auth/login?verified=true');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          ✉️
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Check your email</h2>
        <p className="text-slate-500 mb-8">
          We've sent a 6-digit verification code to <br/>
          <span className="font-bold text-slate-900">{email}</span>.
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleVerify}>
          <input
            type="text"
            maxLength={6}
            required
            className="w-full px-4 py-4 rounded-xl border border-slate-200 text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-slate-900 outline-none mb-6 text-slate-900 bg-white"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Numbers only
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Wrap in Suspense boundary for Next.js useSearchParams
export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}