'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { loadRazorpay } from '@/lib/loadRazorpay';

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
        transition: { stiffness: 300, damping: 30 }
    })
};

export default function ProfileSetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        currentCity: '',
        employmentStatus: '',
        designation: '',
        companyName: '',
        bio: ''
    });

    const nextStep = () => {
        if (step === 1 && (!formData.fullName || !formData.gender || !formData.currentCity)) {
            return setError('Please fill out all required fields.');
        }
        if (step === 2 && (!formData.employmentStatus)) {
            return setError('Please select your employment status.');
        }
        setError('');
        setDirection(1);
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setError('');
        setDirection(-1);
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/profiles', formData);
            setDirection(1);
            setStep(4); // Move to the Matrimony Upsell step instead of home
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create profile. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipMatrimony = () => {
        router.push('/home');
    };

    const handleSubscribeMatrimony = async () => {
        setIsProcessingPayment(true);
        try {
            const res = await loadRazorpay();
            if (!res) throw new Error('Razorpay SDK failed to load');

            // 1. Create Order
            const orderRes = await api.post('/payments/create-subscription', { plan: 'matrimony' });
            const { orderId, amount, currency } = orderRes.data.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add this to your frontend .env.local
                amount,
                currency,
                name: "Kayasth Connect",
                description: "Premium Matrimony Access",
                order_id: orderId,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        await api.post('/payments/verify-subscription', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: 'matrimony'
                        });
                        router.push('/setup/matrimony'); // Send straight to matrimony on success
                    } catch (verifyErr) {
                        alert('Payment verification failed.');
                    }
                },
                theme: { color: "#f97316" } // Saffron theme
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            alert(err.message || 'Payment initiation failed.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative selection:bg-orange-500 selection:text-white">
            {/* Background Glaze Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-2xl w-full relative z-10">
                {step < 4 && (
                    <div className="flex flex-col mb-8 px-4">
                        {/* Progress Bar */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-orange-500' : 'bg-slate-700'}`} />
                                ))}
                            </div>
                            <span className="text-slate-400 font-bold text-sm tracking-widest">STEP {step} OF 3</span>
                        </div>
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-xl text-center text-sm font-semibold">{error}</div>}
                    </div>
                )}
                
                {/* Fixed the container classes here */}
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[450px] flex flex-col">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            // Removed 'absolute inset-0' so height can expand automatically
                            className="p-8 sm:p-12 flex flex-col justify-center w-full flex-grow"
                        >

                            {/* STEP 1: PERSONAL INFO */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Let's get to know you</h2>
                                        <p className="text-slate-500">Your real identity helps keep the community trusted.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Gender *</label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                                value={formData.gender}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Current City *</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                                placeholder="e.g. Mumbai"
                                                value={formData.currentCity}
                                                onChange={e => setFormData({ ...formData, currentCity: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: PROFESSIONAL */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">What do you do?</h2>
                                        <p className="text-slate-500">Connect with other professionals in your field.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Employment Status *</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                            value={formData.employmentStatus}
                                            onChange={e => setFormData({ ...formData, employmentStatus: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="employed">Employed</option>
                                            <option value="business">Business Owner</option>
                                            <option value="student">Student</option>
                                            <option value="unemployed">Looking for opportunities</option>
                                        </select>
                                    </div>
                                    {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'business') && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Designation</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="e.g. Software Engineer"
                                                    value={formData.designation}
                                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="e.g. Google"
                                                    value={formData.companyName}
                                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: BIO & FINISH */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Write your bio</h2>
                                        <p className="text-slate-500">Tell the community a little bit about your interests and background.</p>
                                    </div>
                                    <div>
                                        <textarea
                                            rows={5}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                            placeholder="I am a developer from Delhi who loves cricket and building open-source projects..."
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: MATRIMONY UPSELL */}
                            {step === 4 && (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Profile Created!</h2>
                                    <p className="text-slate-500 text-lg">Are you looking to find your perfect match?</p>

                                    <div className="bg-slate-900 rounded-2xl p-6 border border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] text-left mt-6">
                                        <h3 className="text-xl font-bold text-white mb-2">Unlock Exclusive Matrimony</h3>
                                        <ul className="text-slate-400 space-y-2 mb-6">
                                            <li className="flex items-center gap-2">✓ Verified Premium Profiles</li>
                                            <li className="flex items-center gap-2">✓ Advanced Matchmaking Engine</li>
                                            <li className="flex items-center gap-2">✓ Direct Messaging & Requests</li>
                                        </ul>
                                        <button
                                            onClick={handleSubscribeMatrimony}
                                            disabled={isProcessingPayment}
                                            className="w-full py-4 bg-orange-500 text-slate-900 font-extrabold rounded-xl hover:bg-orange-400 transition-all flex items-center justify-center"
                                        >
                                            {isProcessingPayment ? <Loader2 className="animate-spin" /> : 'Upgrade for ₹499'}
                                        </button>
                                    </div>
                                    <button onClick={handleSkipMatrimony} className="text-slate-400 font-semibold hover:text-slate-900 mt-4 transition-colors">
                                        Skip for now, take me to the Feed
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons - Hidden entirely on Step 4 */}
                {step < 4 && (
                    <div className="flex justify-between items-center mt-8">
                        {step > 1 ? (
                            <button onClick={prevStep} className="px-8 py-3 text-slate-400 font-bold hover:text-white transition-colors">
                                Back
                            </button>
                        ) : <div />} {/* Empty div to keep 'Next' aligned right */}

                        {step < 3 ? (
                            <button onClick={nextStep} className="px-8 py-3 bg-orange-500 text-slate-900 font-extrabold rounded-xl hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
                                Next Step →
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-3 bg-orange-500 text-slate-900 font-extrabold rounded-xl hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all disabled:opacity-50">
                                {isLoading ? 'Creating...' : 'Complete Profile 🎉'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}