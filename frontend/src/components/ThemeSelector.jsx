import React, { useState } from 'react';
import { Palette, Check, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { theme, changeTheme, themes, isLight } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const darkThemes  = themes.filter((t) => t.mode === 'dark');
  const lightThemes = themes.filter((t) => t.mode === 'light');

  const handleToggleDarkLight = () => {
    if (isLight) {
      changeTheme('midnight');
    } else {
      changeTheme('daylight');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--scrollbar-thumb)] border border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center space-x-1.5 text-xs font-medium focus:outline-none"
        title="Change App Theme"
      >
        <Palette className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
        <span className="hidden sm:inline text-[var(--text-secondary)]">Theme</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 glass-panel rounded-2xl border border-[var(--border-glass)] p-3.5 shadow-2xl z-[100] animate-slide-up space-y-3 max-h-[80vh] overflow-y-auto transition-colors duration-300"
          style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 20px var(--accent-glow)` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2.5">
            <span className="font-['Outfit'] font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Theme Vibe
            </span>
            <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dark / Light Mode Toggle */}
          <div className="flex items-center justify-between px-1 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-glass)]">
            <div className="flex items-center space-x-2">
              {isLight
                ? <Sun  className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-indigo-400" />
              }
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {isLight ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={handleToggleDarkLight}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                isLight
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isLight ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {isLight
                  ? <Sun  className="w-3 h-3 text-amber-400" />
                  : <Moon className="w-3 h-3 text-indigo-500" />
                }
              </span>
            </button>
          </div>

          {/* Dark Themes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1 mb-1.5 flex items-center gap-1">
              <Moon className="w-3 h-3" /> Dark Themes
            </p>
            <div className="space-y-1">
              {darkThemes.map((t) => <ThemeOption key={t.id} t={t} active={theme} onChange={(id) => { changeTheme(id); setIsOpen(false); }} />)}
            </div>
          </div>

          {/* Light Themes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1 mb-1.5 flex items-center gap-1">
              <Sun className="w-3 h-3" /> Light Themes
            </p>
            <div className="space-y-1">
              {lightThemes.map((t) => <ThemeOption key={t.id} t={t} active={theme} onChange={(id) => { changeTheme(id); setIsOpen(false); }} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeOption({ t, active, onChange }) {
  const isActive = active === t.id;
  return (
    <button
      onClick={() => onChange(t.id)}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
        isActive
          ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-semibold shadow-lg'
          : 'border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]'
      }`}
      style={isActive ? { background: `${t.primary}22` } : { background: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center space-x-2.5">
        <span className="text-base">{t.icon}</span>
        <span>{t.name}</span>
      </div>
      <div className="flex items-center space-x-1.5">
        <div className="flex -space-x-1">
          <div className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: t.primary }} />
          <div className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: t.secondary }} />
        </div>
        {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
      </div>
    </button>
  );
}
