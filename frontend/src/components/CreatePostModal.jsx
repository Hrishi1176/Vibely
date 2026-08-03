import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Send, RefreshCw, Upload, Wand2, Trash2 } from 'lucide-react';
import { postsAPI, aiAPI } from '../services/api';
import { toast } from '../context/ToastContext';
import { compressAndReadFile } from '../utils/imageUploader';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, quota, refreshQuota, initialDraft }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [vibeTag, setVibeTag] = useState('#Vibely');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingAiImage, setLoadingAiImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialDraft) {
      if (initialDraft.content) setContent(initialDraft.content);
      if (initialDraft.imageUrl) setImageUrl(initialDraft.imageUrl);
      if (initialDraft.vibeTag) setVibeTag(initialDraft.vibeTag);
    }
  }, [isOpen, initialDraft]);

  if (!isOpen) return null;


  const handleGenerateAI = async () => {
    if (quota && quota.ai_remaining <= 0) {
      return toast.error('Daily AI credit limit reached (Max 10/day). Resets at 00:00 UTC.');
    }
    if (!aiPrompt.trim()) return toast.error('Please type a short prompt for the AI!');
    setLoadingAi(true);

    try {
      const res = await aiAPI.generateCaption(aiPrompt, vibeTag.replace('#', ''));
      setContent(res.data.caption);
      setVibeTag(res.data.vibe_tag || '#Vibely');
      setShowAiHelper(false);
      toast.success('AI caption generated successfully! ✨');
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI Generation failed. Check daily limit!';
      toast.error(msg);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (quota && quota.ai_remaining <= 0) {
      return toast.error('Daily AI credit limit reached (Max 10/day). Resets at 00:00 UTC.');
    }
    const promptToUse = aiPrompt.trim() || content.trim() || 'futuristic vibrant digital art';
    setLoadingAiImage(true);

    try {
      const res = await aiAPI.generateImage(promptToUse, 1024, 1024);
      setImageUrl(res.data.image_url);
      toast.success('AI Art generated successfully! 🎨');
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI Image generation failed.';
      toast.error(msg);
    } finally {
      setLoadingAiImage(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const compressedDataUrl = await compressAndReadFile(file);
      setImageUrl(compressedDataUrl);
      toast.success('Local image processed & attached! 📷');
    } catch (err) {
      toast.error(err.message || 'Failed to process selected image file.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Post content cannot be empty.');
    setSubmitting(true);

    try {
      await postsAPI.createPost({
        content,
        image_url: imageUrl || null,
        vibe_tag: vibeTag,
        ai_generated: Boolean(aiPrompt),
      });
      setContent('');
      setImageUrl('');
      setAiPrompt('');
      toast.success('Your vibe post was published! 🚀');
      onPostCreated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create post. Limit reached?';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-gray-800 p-5 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-['Outfit'] font-bold text-lg text-gray-100">Create New Vibe</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Helper Toggle Banner */}
        <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200">Need inspiration? Use <strong>Groq Llama 3 AI</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setShowAiHelper(!showAiHelper)}
            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-medium text-xs hover:bg-purple-500"
          >
            {showAiHelper ? 'Close AI' : 'Generate'}
          </button>
        </div>

        {/* AI Generator Panel */}
        {showAiHelper && (
          <div className="p-3 rounded-xl bg-gray-900/80 border border-purple-500/20 space-y-2 text-xs">
            <label className="block text-gray-300 font-medium">What is your post about?</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Hiking on mountains on a sunny Sunday"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={loadingAi || (quota && quota.ai_remaining <= 0)}
                className="btn-gradient px-3 py-2 rounded-lg text-white font-medium flex items-center space-x-1 disabled:opacity-50"
              >
                {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Auto Writer</span>
              </button>
            </div>
            {quota && (
              <p className="text-[10px] text-gray-400">
                Daily AI Credits remaining: <strong className="text-purple-400">{quota.ai_remaining} / {quota.ai_max}</strong>
              </p>
            )}
          </div>
        )}

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? Share your vibe..."
              className="w-full bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Image Upload / AI Image Generator Bar */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-gray-300">Attach Image / Photo</label>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Option A: Upload Local Image File */}
              <label className="cursor-pointer px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 text-xs font-medium flex items-center space-x-1.5 transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{uploadingFile ? 'Uploading...' : 'Upload Local Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>

              {/* Option B: AI Image Generator Button */}
              <button
                type="button"
                onClick={handleGenerateAIImage}
                disabled={loadingAiImage || (quota && quota.ai_remaining <= 0)}
                className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {loadingAiImage ? <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> : <Wand2 className="w-4 h-4 text-purple-400" />}
                <span>Generate AI Art</span>
              </button>
            </div>

            {/* URL Fallback Input */}
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste Image URL (optional)"
                className="flex-1 bg-gray-900/70 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Image Preview Thumbnail */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-purple-500/30 max-h-48 group">
                <img src={imageUrl} alt="Attached Preview" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 hover:bg-red-600 text-white transition-colors"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Vibe Tag Selector */}
            <div className="flex items-center space-x-2 text-xs pt-1">
              <span className="text-gray-400">Vibe Tag:</span>
              {['#Vibely', '#Tech', '#Chill', '#Creative', '#Energy'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setVibeTag(tag)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    vibeTag === tag
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            {quota && (
              <span className="text-xs text-gray-400">
                Posts remaining today: <strong className="text-emerald-400">{quota.posts_remaining} / {quota.posts_max}</strong>
              </span>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Publish Post</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
