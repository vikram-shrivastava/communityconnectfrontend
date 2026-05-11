'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { loadRazorpay } from '@/lib/loadRazorpay';

export default function CreateCampaign() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    caption: '',
    campaignGoal: 'brand_awareness',
    budget: 1000,
    durationDays: 7,
    targetAudience: { gender: 'all', ageRange: { min: 18, max: 60 } }
  });

  // Media Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) return setError('Please upload a valid image or video file.');
    if (isImage && selectedFile.size > MAX_IMAGE_SIZE) return setError('Image exceeds 10MB limit.');
    if (isVideo && selectedFile.size > MAX_VIDEO_SIZE) return setError('Video exceeds 50MB limit.');

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadToCloudinary = async (uploadFile: File) => {
    const sigResponse = await api.get('/upload/signature?folder=campaigns');
    const { signature, timestamp, folder, apiKey, cloudName } = sigResponse.data.data;

    const cldFormData = new FormData();
    cldFormData.append('file', uploadFile);
    cldFormData.append('api_key', apiKey);
    cldFormData.append('timestamp', timestamp.toString());
    cldFormData.append('signature', signature);
    cldFormData.append('folder', folder);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      cldFormData
    );

    return {
      url: response.data.secure_url,
      type: response.data.resource_type,
      publicId: response.data.public_id,
    };
  };

  const handleCreateAndPay = async () => {
    if (!formData.caption.trim()) {
      return setError('Please enter a caption for your ad.');
    }
    if (!file) {
      return setError('Sponsored posts must include an image or video.');
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load');

      // 1. Upload Media First
      const uploadedMedia = await uploadToCloudinary(file);

      // 2. Initialize Campaign in DB with uploaded media
      const initRes = await api.post('/campaigns/init', { 
        ...formData, 
        media: [uploadedMedia] 
      });
      const campaignId = initRes.data.data._id;

      // 3. Create Razorpay Order
      const orderRes = await api.post('/payments/create-order', { campaignId });
      const { orderId, amount, currency } = orderRes.data.data;

      // 4. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Kayasth Connect Ads",
        description: "Sponsored Campaign Payment",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 5. Verify & Activate
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId
            });
            alert('Payment successful! Your ad is now LIVE in the community feed.');
            router.push('/campaigns');
          } catch (verifyErr) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        theme: { color: "#f97316" }, // Saffron Theme
        modal: {
          ondismiss: function() {
            setIsLoading(false); // Reset loading if user closes the popup without paying
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        setIsLoading(false);
      });
      rzp.open();
      
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to initialize campaign");
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Create Sponsored Post</h1>
            <p className="text-slate-500 mb-8">Reach the community with targeted advertising.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-6">
              
              {/* Media Upload Area */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ad Creative (Image/Video) *</label>
                
                {previewUrl && file ? (
                  <div className="relative mb-4 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <button 
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                    >
                      <X size={16} />
                    </button>
                    {file.type.startsWith('video/') ? (
                      <video src={previewUrl} controls className="w-full max-h-72 object-contain" />
                    ) : (
                      <img src={previewUrl} alt="Ad Preview" className="w-full max-h-72 object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} disabled={isLoading} />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-8 border-2 border-dashed border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-2xl flex flex-col items-center justify-center text-orange-500 transition-colors">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="font-bold text-sm">Upload Image</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-8 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-500 transition-colors">
                      <Video size={32} className="mb-2" />
                      <span className="font-bold text-sm">Upload Video</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ad Caption *</label>
                <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Write an engaging caption for your promotion..." value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} disabled={isLoading} />
              </div>
              
              {/* Campaign Strategy & Targeting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Goal</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={formData.campaignGoal}
                    onChange={e => setFormData({...formData, campaignGoal: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="brand_awareness">Brand Awareness</option>
                    <option value="website_traffic">Website Traffic</option>
                    <option value="lead_generation">Lead Generation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Gender</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={formData.targetAudience.gender}
                    onChange={e => setFormData({
                      ...formData, 
                      targetAudience: { ...formData.targetAudience, gender: e.target.value }
                    })}
                    disabled={isLoading}
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>
              </div>

              {/* Age Targeting */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Min Age</label>
                  <input 
                    type="number" min="13" max="100" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 font-mono" 
                    value={formData.targetAudience.ageRange.min} 
                    onChange={e => setFormData({
                      ...formData, 
                      targetAudience: { ...formData.targetAudience, ageRange: { ...formData.targetAudience.ageRange, min: Number(e.target.value) } }
                    })} 
                    disabled={isLoading} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Max Age</label>
                  <input 
                    type="number" min="13" max="100" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 font-mono" 
                    value={formData.targetAudience.ageRange.max} 
                    onChange={e => setFormData({
                      ...formData, 
                      targetAudience: { ...formData.targetAudience, ageRange: { ...formData.targetAudience.ageRange, max: Number(e.target.value) } }
                    })} 
                    disabled={isLoading} 
                  />
                </div>
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Budget (₹) *</label>
                  <input type="number" min="500" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} disabled={isLoading} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Days) *</label>
                  <input type="number" min="1" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 font-mono" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: Number(e.target.value)})} disabled={isLoading} />
                </div>
              </div>

              {/* Submit Action */}
              <button 
                onClick={handleCreateAndPay} 
                disabled={isLoading || !formData.caption || !file}
                className="w-full py-4 mt-4 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <span>Pay ₹{formData.budget} & Publish Ad</span>
                )}
              </button>
              
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}