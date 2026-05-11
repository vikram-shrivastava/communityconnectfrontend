'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const slideVariants: any = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0, scale: 0.95 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0, scale: 0.95, transition: { type: 'spring', stiffness: 300, damping: 30 } })
};

export default function MatrimonySetupPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    dob: '', heightCm: '', education: '', annualIncome: '', aboutFamily: '',
    prefMinAge: 20, prefMaxAge: 30, prefMinHeight: 150, prefMaxHeight: 180, prefFamilyType: 'nuclear',
  });

  // Photo Upload State
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      return setError('You can only upload up to 5 photos.');
    }

    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setError('Some files were ignored (must be images under 10MB).');
    }

    setPhotos(prev => [...prev, ...validFiles]);
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadToCloudinary = async (uploadFile: File) => {
    const sigResponse = await api.get('/upload/signature?folder=matrimony_profiles');
    const { signature, timestamp, folder, apiKey, cloudName } = sigResponse.data.data;

    const cldFormData = new FormData();
    cldFormData.append('file', uploadFile);
    cldFormData.append('api_key', apiKey);
    cldFormData.append('timestamp', timestamp.toString());
    cldFormData.append('signature', signature);
    cldFormData.append('folder', folder);

    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, cldFormData);
    return { url: response.data.secure_url, publicId: response.data.public_id };
  };

  const nextStep = () => {
    if (step === 1 && (!formData.dob || !formData.heightCm || !formData.education)) {
      return setError('Please fill out all required fields.');
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
    if (photos.length === 0) return setError('Please upload at least one photo.');
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Upload all photos to Cloudinary sequentially (or Promise.all)
      const uploadedPhotos = await Promise.all(
        photos.map(async (file, idx) => {
          const data = await uploadToCloudinary(file);
          return { ...data, isMain: idx === 0 }; // First photo is main
        })
      );

      // 2. Format payload
      const payload = {
        matrimonyData: {
          dob: formData.dob,
          heightCm: Number(formData.heightCm),
          education: formData.education,
          annualIncome: formData.annualIncome,
          aboutFamily: formData.aboutFamily,
          matrimonyPhotos: uploadedPhotos,
          partnerPreferences: {
            ageRange: { min: formData.prefMinAge, max: formData.prefMaxAge },
            heightRangeCm: { min: formData.prefMinHeight, max: formData.prefMaxHeight },
            familyType: formData.prefFamilyType
          }
        }
      };

      await api.patch('/profiles/update-matrimony', payload);
      if (user) setUser({ ...user, plan: 'matrimony' });
      router.push('/matrimony'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed. Try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative selection:bg-pink-500 selection:text-white">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        
        <div className="flex justify-between items-center mb-8 px-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-pink-500' : 'bg-slate-700'}`} />
            ))}
          </div>
          <span className="text-slate-400 font-bold text-sm tracking-widest">STEP {step} OF 3</span>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-xl text-center text-sm font-semibold">{error}</div>}

        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[500px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 p-8 flex flex-col justify-center overflow-y-auto custom-scrollbar">
              
              {/* STEP 1: PERSONAL DETAILS */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Matrimony Profile</h2>
                    <p className="text-slate-500">Fill in these details to help us find your perfect match.</p>
                  </div>
                  {/* Form fields identical to previous prompt for Step 1... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth *</label><input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Height (cm) *</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="e.g. 175" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: e.target.value})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Education *</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="e.g. B.Tech" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Annual Income</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="e.g. 10-15 LPA" value={formData.annualIncome} onChange={e => setFormData({...formData, annualIncome: e.target.value})}/></div>
                  </div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">About Your Family</label><textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none resize-none" value={formData.aboutFamily} onChange={e => setFormData({...formData, aboutFamily: e.target.value})}/></div>
                </div>
              )}

              {/* STEP 2: PREFERENCES */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Partner Preferences</h2>
                    <p className="text-slate-500">What are you looking for in a partner?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Min Age</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" value={formData.prefMinAge} onChange={e => setFormData({...formData, prefMinAge: Number(e.target.value)})}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Max Age</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" value={formData.prefMaxAge} onChange={e => setFormData({...formData, prefMaxAge: Number(e.target.value)})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Min Height (cm)</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" value={formData.prefMinHeight} onChange={e => setFormData({...formData, prefMinHeight: Number(e.target.value)})}/></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Max Height (cm)</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none" value={formData.prefMaxHeight} onChange={e => setFormData({...formData, prefMaxHeight: Number(e.target.value)})}/></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Family Type</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none bg-white" value={formData.prefFamilyType} onChange={e => setFormData({...formData, prefFamilyType: e.target.value})}>
                      <option value="nuclear">Nuclear</option><option value="joint">Joint</option><option value="other">Doesn't matter</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: PHOTOS */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Upload Photos</h2>
                    <p className="text-slate-500">Profiles with clear photos receive 10x more matches. The first photo will be your main picture. (Max 5)</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(idx)} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                        {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-pink-500/80 text-white text-[10px] font-bold text-center py-1">MAIN</span>}
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 hover:bg-pink-100 flex flex-col items-center justify-center text-pink-500 transition-colors">
                        <UploadCloud size={24} className="mb-1" />
                        <span className="text-xs font-bold">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handlePhotoSelect} />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          {step > 1 ? (
            <button onClick={prevStep} className="px-8 py-3 text-slate-400 font-bold hover:text-white transition-colors">Back</button>
          ) : <div />} 

          {step < 3 ? (
            <button onClick={nextStep} className="px-8 py-3 bg-pink-500 text-white font-extrabold rounded-xl hover:bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all">Next Step →</button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading} className="px-8 py-3 bg-pink-500 text-white font-extrabold rounded-xl hover:bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : 'Start Matching 💖'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}