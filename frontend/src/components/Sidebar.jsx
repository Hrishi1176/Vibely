import React from 'react';
import { Home, Bot, User, Users, MessageSquare, Download, Zap, Sparkles } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, quota }) {
  const navItems = [
    { id: 'feed',      label: 'Home Feed',          icon: Home,         badge: null },
    { id: 'friends',   label: 'Friends & Community', icon: Users,        badge: null },
    { id: 'messenger', label: 'Messenger',           icon: MessageSquare, badge: 'Live' },
    { id: 'ai-studio', label: 'VibeAI Hub',          icon: Bot,          badge: 'Free' },
    { id: 'profile',   label: 'My Profile',          icon: User,         badge: null },
  ];

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 glass-panel rounded-2xl p-4 border border-[var(--border-glass)] space-y-5">

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                style={isActive
                  ? { background: 'var(--accent-gradient)', boxShadow: `0 4px 14px var(--accent-glow)` }
                  : {}
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[var(--accent-primary)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
                  }`}
                    style={isActive ? {} : { background: 'var(--accent-primary)15' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Daily Quota Card */}
        {quota && (
          <div className="p-3.5 rounded-xl border border-[var(--border-glass)] space-y-3"
            style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Daily Free Quota
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Resets 00:00 UTC</span>
            </div>

            {/* AI Generations */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)] flex items-center gap-1">
                  <Bot className="w-3 h-3 text-[var(--accent-primary)]" /> AI Generations
                </span>
                <span className="font-bold text-[var(--text-primary)]">{quota.ai_used} / {quota.ai_max}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-glass)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(quota.ai_used / quota.ai_max) * 100}%`,
                    background: 'var(--accent-gradient)'
                  }}
                />
              </div>
            </div>

            {/* Daily Posts */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Daily Posts
                </span>
                <span className="font-bold text-[var(--text-primary)]">{quota.posts_used} / {quota.posts_max}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-glass)' }}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(quota.posts_used / quota.posts_max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}


      </div>
    </aside>
  );
}
