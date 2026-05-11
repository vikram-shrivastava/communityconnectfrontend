'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api'; // Your configured Axios instance

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary Free Tier Limits
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate File Type & Size
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return setError('Please upload a valid image or video file.');
    }

    if (isImage && selectedFile.size > MAX_IMAGE_SIZE) {
      return setError('Image exceeds the 10MB limit.');
    }

    if (isVideo && selectedFile.size > MAX_VIDEO_SIZE) {
      return setError('Video exceeds the 50MB limit.');
    }

    setFile(selectedFile);

    // Create local preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadToCloudinary = async (uploadFile: File) => {
    // 1. Get Secure Signature from Backend
    const sigResponse = await api.get('/upload/signature?folder=community_posts');
    const { signature, timestamp, folder, apiKey, cloudName } = sigResponse.data.data;

    // 2. Prepare FormData for Cloudinary API
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // 3. Upload directly to Cloudinary
    const cloudinaryResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      formData
    );

    // 4. Return the format your Post Controller expects
    return {
      url: cloudinaryResponse.data.secure_url,
      type: cloudinaryResponse.data.resource_type, // 'image' or 'video'
      publicId: cloudinaryResponse.data.public_id,
    };
  };

  const handleSubmit = async () => {
    if (!caption.trim()) {
      return setError('Please write a caption for your post.');
    }

    setIsSubmitting(true);
    setError('');

    try {
      let mediaArray = [];

      // If user selected a file, upload it first
      if (file) {
        const uploadedMedia = await uploadToCloudinary(file);
        mediaArray.push(uploadedMedia);
      }

      // Create Post in Database
      await api.post('/posts', {
        caption,
        location,
        media: mediaArray,
      });

      // Cleanup & Close
      setCaption('');
      setLocation('');
      removeFile();
      onSuccess(); // Triggers feed refresh in parent component
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[90] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900">Create Post</h2>
              <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100">
                  {error}
                </div>
              )}

              <textarea
                rows={4}
                placeholder="What's happening in the community?"
                className="w-full text-lg outline-none resize-none text-slate-900 placeholder:text-slate-400 mb-4"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isSubmitting}
              />

              {/* Media Preview */}
              {previewUrl && file && (
                <div className="relative mb-4 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <button 
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                  {file.type.startsWith('video/') ? (
                    <video src={previewUrl} controls className="w-full max-h-64 object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain" />
                  )}
                </div>
              )}

              {/* Location Input (Optional) */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-4">
                <MapPin size={18} className="text-orange-500" />
                <input
                  type="text"
                  placeholder="Add location (optional)"
                  className="bg-transparent outline-none flex-1 text-sm text-slate-700"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="p-2.5 text-orange-500 bg-orange-100 hover:bg-orange-200 rounded-full transition-colors disabled:opacity-50"
                  title="Add Photo"
                >
                  <ImageIcon size={20} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="p-2.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors disabled:opacity-50"
                  title="Add Video"
                >
                  <Video size={20} />
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !caption.trim()}
                className="flex items-center justify-center space-x-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:border-orange-500 border border-transparent"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post</span>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}