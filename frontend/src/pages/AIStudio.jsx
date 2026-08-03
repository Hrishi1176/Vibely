import React, { useState } from 'react';
import { Bot, Sparkles, Send, ShieldCheck, Zap, RefreshCw, Wand2, Image as ImageIcon, Download, Copy, ExternalLink, PlusCircle } from 'lucide-react';
import { aiAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function AIStudio({ user, quota, refreshQuota, onOpenAuth, onPublishToFeed }) {
  // Chat state
  const [messages, setMessages] = useState([
    { sender: 'vibeai', text: 'Hey there! I am VibeAI, powered by 100% free Llama 3 on Groq. Ask me to write posts, generate hashtags, create AI images, or give content ideas!' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Caption Generator state
  const [topic, setTopic] = useState('');
  const [vibeTone, setVibeTone] = useState('energetic');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  // AI Image Generator state
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageGenLoading, setImageGenLoading] = useState(false);

  // Moderation state
  const [modText, setModText] = useState('');
  const [modResult, setModResult] = useState(null);

  const checkQuotaLimit = () => {
    if (quota && quota.ai_remaining <= 0) {
      toast.error('Daily AI credit limit reached (Max 10/day). Credits reset at 00:00 UTC.');
      return false;
    }
    return true;
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    if (!user) return onOpenAuth();
    if (!checkQuotaLimit()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setChatLoading(true);

    try {
      const res = await aiAPI.chat(userText);
      setMessages(prev => [...prev, { sender: 'vibeai', text: res.data.reply }]);
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to communicate with VibeAI';
      toast.error(detail);
      setMessages(prev => [...prev, { sender: 'vibeai', text: `⚠️ ${detail}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateCaption = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Please enter a topic!');
    if (!user) return onOpenAuth();
    if (!checkQuotaLimit()) return;

    setGenLoading(true);

    try {
      const res = await aiAPI.generateCaption(topic, vibeTone);
      setGeneratedResult(res.data);
      toast.success('Generated Smart Post successfully! Click "Publish as Vibe Post" below to share! 🪄');
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to generate caption. Quota limit reached?';
      toast.error(detail);
    } finally {
      setGenLoading(false);
    }
  };

  const handleGenerateAIImage = async (e) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return toast.error('Please describe the image you want to generate!');
    if (!user) return onOpenAuth();
    if (!checkQuotaLimit()) return;

    setImageGenLoading(true);

    try {
      const res = await aiAPI.generateImage(imagePrompt, 1024, 1024);
      setGeneratedImageUrl(res.data.image_url);
      toast.success('AI Art generated successfully! Click "Publish as Vibe Post" below to share! 🎨');
      if (refreshQuota) refreshQuota();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to generate AI image.';
      toast.error(detail);
    } finally {
      setImageGenLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!modText.trim()) return;
    try {
      const res = await aiAPI.moderate(modText);
      setModResult(res.data);
      if (res.data.is_safe) {
        toast.success('Content Moderation: Passed safe checks! ✅');
      } else {
        toast.error(`Content Moderation Warning: ${res.data.reason}`);
      }
    } catch (err) {
      toast.error('Content moderation check failed.');
    }
  };

  const copyImageLink = () => {
    if (!generatedImageUrl) return;
    navigator.clipboard.writeText(generatedImageUrl);
    toast.success('Image link copied to clipboard!');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[var(--border-glass)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[var(--text-primary)]">VibeAI Studio Suite</h2>
              <p className="text-xs text-[var(--text-muted)]">Free Llama 3 AI Text & Pollinations AI Image Studio</p>
            </div>
          </div>

          {quota && (
            <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-xs text-[var(--text-primary)] flex items-center space-x-2 shrink-0">
              <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Credits Remaining: <strong className="text-[var(--accent-primary)] font-bold">{quota.ai_remaining} / {quota.ai_max}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout: Chat + Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Interactive Chat with VibeAI */}
        <div className="glass-panel rounded-2xl p-4 border border-[var(--border-glass)] flex flex-col h-[400px] sm:h-[520px]">
          <div className="flex items-center space-x-2 pb-3 border-b border-[var(--border-glass)]">
            <Bot className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-['Outfit'] font-semibold text-sm text-[var(--text-primary)]">Chat with VibeAI Companion</h3>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'btn-gradient text-white rounded-br-none shadow-md'
                      : 'bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)] rounded-bl-none shadow-md'
                  }`}
                >
                  {m.text}
                </div>

                {m.sender === 'vibeai' && idx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return onOpenAuth();
                      onPublishToFeed({
                        content: m.text,
                        vibeTag: '#Vibely'
                      });
                    }}
                    className="mt-1 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/30 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-[10px] font-semibold flex items-center space-x-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Post this Vibe to Feed 🚀</span>
                  </button>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-xs text-[var(--text-muted)] flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                  <span>VibeAI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-[var(--border-glass)]">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask VibeAI anything..."
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <button type="submit" className="btn-gradient p-2 min-h-[36px] min-w-[36px] rounded-xl text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Box 2 & 3: AI Image Studio & Caption Writer */}
        <div className="space-y-6">
          
          {/* AI Image Art Generator Studio */}
          <div className="glass-panel rounded-2xl p-5 border border-[var(--border-glass)] space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[var(--border-glass)]">
              <Wand2 className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-['Outfit'] font-semibold text-sm text-[var(--text-primary)]">AI Image Art Studio</h3>
            </div>

            <form onSubmit={handleGenerateAIImage} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Image Prompt / Description</label>
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="e.g. Futuristic cyber lion with glowing purple aura 8k render"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={imageGenLoading || (quota && quota.ai_remaining <= 0)}
                className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
              >
                {imageGenLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>Generate AI Image Art</span>
              </button>
            </form>

            {/* AI Image Result Preview & Publish Button */}
            {generatedImageUrl && (
              <div className="space-y-3 pt-2 border-t border-[var(--border-glass)]">
                <div className="relative rounded-2xl overflow-hidden border border-[var(--border-glass)] shadow-xl group">
                  <img src={generatedImageUrl} alt="AI Art" className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={copyImageLink}
                      className="p-2 rounded-xl bg-[var(--bg-primary)]/90 text-[var(--text-primary)] text-xs font-medium flex items-center space-x-1 shadow-md"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>
                    <a
                      href={generatedImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl btn-gradient text-white text-xs font-medium flex items-center space-x-1 shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open High Res</span>
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) return onOpenAuth();
                    onPublishToFeed({
                      imageUrl: generatedImageUrl,
                      content: imagePrompt ? `🎨 AI Art: ${imagePrompt}` : 'Check out this AI image art generated on Vibely!',
                      vibeTag: '#Creative'
                    });
                  }}
                  className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>Publish Image as Vibe Post 🚀</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Caption Writer */}
          <div className="glass-panel rounded-2xl p-5 border border-[var(--border-glass)] space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[var(--border-glass)]">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-['Outfit'] font-semibold text-sm text-[var(--text-primary)]">AI Social Caption Writer</h3>
            </div>

            <form onSubmit={handleGenerateCaption} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Post Topic / Idea</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Launching my new coding portfolio website"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Select Vibe Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['energetic', 'chill', 'witty', 'reflective', 'professional', 'bold'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setVibeTone(t)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        vibeTone === t
                          ? 'btn-gradient text-white font-semibold shadow-md'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-glass)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={genLoading || (quota && quota.ai_remaining <= 0)}
                className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
              >
                {genLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Generate Smart Post</span>
              </button>
            </form>

            {/* Result Box & Direct Publish Button */}
            {generatedResult && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[var(--accent-primary)] font-semibold">
                  <span>Result Preview:</span>
                  <span className="text-[10px] bg-[var(--accent-primary)]/20 px-2 py-0.5 rounded-full">{generatedResult.vibe_tag}</span>
                </div>
                <p className="text-[var(--text-primary)] whitespace-pre-line">{generatedResult.caption}</p>
                <div className="text-sm">{generatedResult.emojis}</div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) return onOpenAuth();
                    onPublishToFeed({
                      content: generatedResult.caption,
                      vibeTag: generatedResult.vibe_tag || '#Vibely'
                    });
                  }}
                  className="w-full btn-gradient py-2 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-lg mt-2"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-300" />
                  <span>Publish Caption as Vibe Post 🚀</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Moderation Tester */}
          <div className="glass-panel rounded-2xl p-4 border border-[var(--border-glass)] space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="font-['Outfit'] font-semibold text-xs text-[var(--text-primary)]">Content Moderation Tester</h4>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={modText}
                onChange={(e) => setModText(e.target.value)}
                placeholder="Type text to safety test..."
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <button
                onClick={handleModerate}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)] text-xs hover:bg-[var(--scrollbar-thumb)] transition-colors"
              >
                Check
              </button>
            </div>
            {modResult && (
              <div className={`p-2 rounded-lg text-xs ${modResult.is_safe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {modResult.is_safe ? '✅ Content is safe' : `❌ ${modResult.reason}`}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

