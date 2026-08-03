import React from 'react';
import { X, Sparkles, ShieldCheck, Zap, HeartHandshake, EyeOff, MessageSquare } from 'lucide-react';

export default function WhyVibelyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-[var(--accent-primary)]" />,
      title: 'Built-in AI Assistant',
      desc: 'Create better content effortlessly with AI-powered caption suggestions, hashtag ideas, smart replies, and creative assistance.'
    },
    {
      icon: <EyeOff className="w-6 h-6 text-emerald-400" />,
      title: 'Authentic Social Experience',
      desc: 'Enjoy a clean and meaningful feed focused on real connections, genuine interactions, and content you actually care about.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />,
      title: 'Smart Content Safety',
      desc: 'Advanced AI-powered moderation helps maintain a respectful, positive, and safe community for everyone.'
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Creator Growth & Recognition',
      desc: 'Showcase your creativity with achievement badges, creator milestones, and rewards for your contribution.'
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-rose-400" />,
      title: 'Modern Messaging Experience',
      desc: 'Connect instantly with seamless conversations, online status, reactions, media sharing, and engaging chat features.'
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-indigo-400" />,
      title: 'Privacy Focused Platform',
      desc: 'Your data belongs to you. We prioritize transparency, security, and giving users complete control over their experience.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-[var(--border-glass)] p-4 sm:p-6 space-y-6 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-xl hover:bg-[var(--scrollbar-thumb)] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] mb-1">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="font-['Outfit'] font-black text-xl sm:text-3xl text-[var(--text-primary)]">
            Why Choose <span className="gradient-text">Vibely</span> Over Legacy Socials?
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Built for authentic human connection, powered by next-gen AI, without toxic algorithms or invasive ads.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-glass)] hover:border-[var(--border-accent)] transition-all space-y-2 group"
            >
              <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] w-fit group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h4 className="font-['Outfit'] font-bold text-sm text-[var(--text-primary)]">{f.title}</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[var(--border-glass)] text-center">
          <button
            onClick={onClose}
            className="btn-gradient px-6 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-lg"
          >
            Start Vibing Now 🚀
          </button>
        </div>

      </div>
    </div>
  );
}

