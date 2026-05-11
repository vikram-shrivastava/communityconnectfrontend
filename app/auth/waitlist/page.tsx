'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function WaitlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [copied, setCopied] = useState(false);

  const displayId = userId ? userId.slice(-6).toUpperCase() : "PENDING";

  const handleCopy = async () => {
    if (userId) {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full flex flex-col items-center">
        
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-8 text-4xl">
          🔐
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 text-center">You're on the Waitlist</h1>
        <p className="text-slate-500 text-center mb-8 px-4">
          This is an exclusive, invite-only community to ensure a safe and high-quality network.
        </p>

        <div className="flex items-center space-x-2 bg-amber-50 px-5 py-2.5 rounded-full border border-amber-100 mb-10">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-700 font-bold text-sm">Status: Pending Review</span>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-sm p-6 border border-slate-100 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Want to skip the line?</h3>
          <p className="text-slate-500 text-sm mb-4">
            Ask an existing member to approve your request using your unique profile ID:
          </p>
          
          <div className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4">
            <span className="font-mono text-lg font-bold text-slate-900 tracking-wider">
              ID: {displayId}
            </span>
            <button 
              onClick={handleCopy}
              className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => alert('If you received a code, please log in or contact an admin with your ID.')}
            className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-50"
          >
            I have an invite code now
          </button>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 text-slate-500 font-semibold hover:text-slate-900"
          >
            Return Home
          </button>
        </div>

      </div>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  );
}