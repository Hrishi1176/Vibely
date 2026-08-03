import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  // ── Dark Themes ──────────────────────────────────────────────
  { id: 'midnight',  name: 'Midnight Obsidian', icon: '🌙', primary: '#8b5cf6', secondary: '#6366f1', mode: 'dark' },
  { id: 'cyber',     name: 'Cyber Neon',         icon: '⚡', primary: '#06b6d4', secondary: '#10b981', mode: 'dark' },
  { id: 'sunset',    name: 'Sunset Rose',         icon: '🌅', primary: '#ec4899', secondary: '#f43f5e', mode: 'dark' },
  { id: 'aurora',    name: 'Aurora Teal',          icon: '🌌', primary: '#14b8a6', secondary: '#3b82f6', mode: 'dark' },
  { id: 'amethyst',  name: 'Deep Amethyst',       icon: '🔮', primary: '#a855f7', secondary: '#f59e0b', mode: 'dark' },
  // ── Light Themes ─────────────────────────────────────────────
  { id: 'daylight',  name: 'Daylight Pearl',      icon: '☀️', primary: '#6366f1', secondary: '#8b5cf6', mode: 'light' },
  { id: 'rose-gold', name: 'Rose Gold',            icon: '🌸', primary: '#f43f5e', secondary: '#ec4899', mode: 'light' },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vibely_theme') || 'midnight';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('vibely_theme', theme);

    // Add light/dark class to <html> for Tailwind dark-mode utilities
    const current = THEMES.find((t) => t.id === theme);
    if (current?.mode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (THEMES.some((t) => t.id === newTheme)) {
      setTheme(newTheme);
    }
  };

  const isLight = THEMES.find((t) => t.id === theme)?.mode === 'light';

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES, isLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: 'midnight', changeTheme: () => {}, themes: THEMES, isLight: false };
  }
  return ctx;
}
