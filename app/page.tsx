'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/authStore';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } }
};

const zoomCard: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } }
};

// Subtle breathing animation for the background glaze
import type { Easing } from 'framer-motion';

const easeInOut: Easing = [0.42, 0, 0.58, 1];

const breathe: import('framer-motion').Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 8, repeat: Infinity, ease: easeInOut }
  }
};

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by ensuring this renders only on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid flickering during hydration

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-slate-900 text-white pt-20 overflow-hidden">
        {/* Background Glaze Effect with Breathing Animation */}
        <motion.div 
          variants={breathe} animate="animate"
          className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          variants={breathe} animate="animate"
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-slate-800/50 rounded-full blur-[100px] pointer-events-none" 
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <span className="inline-block py-1 px-3 rounded-full bg-orange-500/20 text-orange-400 font-semibold text-sm mb-6 border border-orange-500/30">
              {isAuthenticated ? "Your Community Dashboard" : "Exclusive Community Network"}
            </span>
            
            {/* DYNAMIC HERO TEXT */}
            {isAuthenticated ? (
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                Welcome back, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  {user?.name?.split(' ')[0] || 'Member'}.
                </span>
              </h1>
            ) : (
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                Connect. Grow. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Thrive Together.
                </span>
              </h1>
            )}

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {isAuthenticated 
                ? "Catch up on the latest posts, explore new matrimony matches, and connect with professionals in your trusted network."
                : "Join the most trusted, invite-only platform designed to foster meaningful professional relationships, community updates, and verified matrimony profiles."}
            </p>
            
            {/* DYNAMIC HERO BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/home" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-500 text-slate-900 font-bold text-lg hover:bg-orange-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    Go to Feed
                  </Link>
                  {user?.role === 'admin' ? (
                    <Link href="/admin/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link href="/matrimony" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600">
                      Explore Matrimony
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-500 text-slate-900 font-bold text-lg hover:bg-orange-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    Apply for Access
                  </Link>
                  <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600">
                    Member Login
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION (Scroll Animations) */}
      <section className="py-32 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Built for the Community</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={zoomCard}
              className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-2xl transition-shadow duration-300 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                🤝
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Verified Network</h3>
              <p className="text-slate-600 leading-relaxed">
                Every member is verified by the community. Engage in a secure, troll-free environment where trust is built-in.
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={zoomCard}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group transform md:-translate-y-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500 text-slate-900 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                💍
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Exclusive Matrimony</h3>
              <p className="text-slate-400 leading-relaxed">
                Find your perfect match with our powerful, privacy-first matchmaking engine restricted to approved members only.
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={zoomCard}
              className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-2xl transition-shadow duration-300 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                📈
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Professional Growth</h3>
              <p className="text-slate-600 leading-relaxed">
                Promote your business, run targeted campaigns, and connect with professionals across the globe.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CALL TO ACTION */}
      <section className="py-24 bg-orange-500 text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute -left-32 -top-32 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            {isAuthenticated ? (
              <>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Dive Back In</h2>
                <p className="text-xl font-medium mb-10 text-slate-900/80">
                  See what the community has been talking about today.
                </p>
                <Link href="/home" className="inline-block px-10 py-5 rounded-2xl bg-slate-900 text-white font-bold text-xl hover:bg-slate-800 transition-all hover:scale-105 shadow-2xl shadow-slate-900/50">
                  Open Community Feed
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Ready to skip the waitlist?</h2>
                <p className="text-xl font-medium mb-10 text-slate-900/80">
                  Get an invite code from an existing member or apply directly to be reviewed by our community admins.
                </p>
                <Link href="/auth/register" className="inline-block px-10 py-5 rounded-2xl bg-slate-900 text-white font-bold text-xl hover:bg-slate-800 transition-all hover:scale-105 shadow-2xl shadow-slate-900/50">
                  Create Your Profile
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-8 border-t border-slate-800 text-center text-slate-500 relative z-10">
        <p className="font-semibold text-sm">© {new Date().getFullYear()} Kayasth Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}