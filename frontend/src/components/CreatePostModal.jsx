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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-[var(--border-glass)] p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-['Outfit'] font-bold text-lg text-[var(--text-primary)]">Create New Vibe</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Helper Toggle Banner */}
        <div className="p-3 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[var(--text-primary)]">Need inspiration? Use <strong>Groq Llama 3 AI</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setShowAiHelper(!showAiHelper)}
            className="px-2.5 py-1 rounded-lg btn-gradient text-white font-medium text-xs shadow-md shrink-0"
          >
            {showAiHelper ? 'Close AI' : 'Generate'}
          </button>
        </div>

        {/* AI Generator Panel */}
        {showAiHelper && (
          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/20 space-y-2 text-xs">
            <label className="block text-[var(--text-secondary)] font-medium">What is your post about?</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Hiking on mountains on a sunny Sunday"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={loadingAi || (quota && quota.ai_remaining <= 0)}
                className="btn-gradient px-3 py-2 rounded-lg text-white font-medium flex items-center space-x-1 disabled:opacity-50 shadow-md shrink-0"
              >
                {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Auto Writer</span>
              </button>
            </div>
            {quota && (
              <p className="text-[10px] text-[var(--text-muted)]">
                Daily AI Credits remaining: <strong className="text-[var(--accent-primary)]">{quota.ai_remaining} / {quota.ai_max}</strong>
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
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-muted)] resize-none"
            />
          </div>

          {/* Image Upload / AI Image Generator Bar */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Attach Image / Photo</label>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Option A: Upload Local Image File */}
              <label className="cursor-pointer px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--scrollbar-thumb)] border border-[var(--border-glass)] text-[var(--text-primary)] text-xs font-medium flex items-center space-x-1.5 transition-colors">
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
                className="px-3 py-2 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/30 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {loadingAiImage ? <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)]" /> : <Wand2 className="w-4 h-4 text-[var(--accent-primary)]" />}
                <span>Generate AI Art</span>
              </button>
            </div>

            {/* URL Fallback Input */}
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste Image URL (optional)"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Image Preview Thumbnail */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-[var(--border-glass)] max-h-48 group">
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
            <div className="flex items-center space-x-2 text-xs pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[var(--text-muted)] shrink-0">Vibe Tag:</span>
              {['#Vibely', '#Tech', '#Chill', '#Creative', '#Energy'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setVibeTag(tag)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                    vibeTag === tag
                      ? 'btn-gradient text-white font-semibold shadow-sm'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-glass)]">
            {quota && (
              <span className="text-xs text-[var(--text-muted)]">
                Posts remaining today: <strong className="text-emerald-400">{quota.posts_remaining} / {quota.posts_max}</strong>
              </span>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center space-x-2 disabled:opacity-50 shadow-md"
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
