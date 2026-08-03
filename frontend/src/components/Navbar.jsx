import React from 'react';
import { Sparkles, PlusCircle, User as UserIcon, Zap, LogOut, HelpCircle } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Navbar({ user, quota, onOpenCreate, onOpenAuth, onLogout, activeTab, setActiveTab, onOpenWhyVibely }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-glass)] bg-[var(--bg-primary)]/90 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between overflow-x-auto md:overflow-visible no-scrollbar gap-2 sm:gap-4">

        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('feed')}
          className="flex items-center space-x-2 cursor-pointer group shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[var(--accent-primary)] opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
            <img
              src="/logo.svg"
              alt="Vibely"
              className="relative w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-110 group-hover:rotate-[-6deg] duration-300"
            />
          </div>
          <span className="font-['Outfit'] text-xl sm:text-2xl font-extrabold tracking-tight gradient-text">
            Vibely
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 badge-glow">
            100% Free
          </span>
        </div>

        {/* Center Quota Pill (Desktop & Tablet) */}
        {user && quota && (
          <div className="hidden md:flex items-center space-x-4 bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-full px-4 py-1.5 text-xs text-[var(--text-secondary)] shrink-0">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>AI Credits: <strong className="text-[var(--accent-primary)]">{quota.ai_remaining}/{quota.ai_max}</strong></span>
            </div>
            <div className="w-px h-3 bg-[var(--border-glass)]" />
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Posts: <strong className="text-emerald-500">{quota.posts_remaining}/{quota.posts_max}</strong></span>
            </div>
          </div>
        )}

        {/* Mobile Quota Mini Pill (Mobile Only) */}
        {user && quota && (
          <div className="md:hidden flex items-center space-x-1 text-[11px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-glass)] px-2.5 py-1 rounded-full text-[var(--accent-primary)] shrink-0">
            <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
            <span>{quota.ai_remaining}/{quota.ai_max}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <ThemeSelector />

          <button
            onClick={onOpenWhyVibely}
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--scrollbar-thumb)] border border-[var(--border-glass)] text-[var(--accent-primary)] text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
            title="Why Vibely?"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline text-[var(--text-secondary)]">Why Vibely?</span>
          </button>

          {user ? (
            <>
              <button
                onClick={onOpenCreate}
                className="btn-gradient px-3 py-2 min-h-[38px] rounded-xl text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Vibe</span>
              </button>

              <div className="flex items-center space-x-1.5 border-l border-[var(--border-glass)] pl-2 sm:pl-3">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="relative flex items-center p-0.5 rounded-full transition-all hover:scale-110 min-h-[36px] min-w-[36px]"
                  title="My Profile"
                >
                  <div className="absolute inset-0 rounded-full animated-border p-[1.5px]" />
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.username}
                    className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-[var(--bg-primary)]"
                  />
                </button>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 min-h-[36px] min-w-[36px] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-gradient px-3.5 py-2 min-h-[38px] rounded-xl text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

