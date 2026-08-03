import React from 'react';
import { X, Sparkles, ShieldCheck, Zap, HeartHandshake, EyeOff, MessageSquare } from 'lucide-react';

export default function WhyVibelyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-toast-slide-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-purple-500/30 p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 mb-1">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="font-['Outfit'] font-black text-2xl sm:text-3xl text-gray-100">
            Why Choose <span className="gradient-text">Vibely</span> Over Legacy Socials?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
            Built for authentic human connection, powered by next-gen AI, without toxic algorithms or invasive ads.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 hover:border-purple-500/40 hover:bg-gray-900 transition-all space-y-2 group"
            >
              <div className="p-2.5 rounded-xl bg-gray-800/80 w-fit group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h4 className="font-['Outfit'] font-bold text-sm text-gray-100">{f.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-800 text-center">
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
