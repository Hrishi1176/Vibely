import React from 'react';
import { Home, Bot, User, Users, MessageSquare, PlusCircle } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenCreate }) {
  const tabsLeft = [
    { id: 'feed',      label: 'Feed',    icon: Home },
    { id: 'friends',   label: 'Friends', icon: Users },
  ];
  const tabsRight = [
    { id: 'messenger', label: 'Chat',    icon: MessageSquare },
    { id: 'ai-studio', label: 'AI Hub',  icon: Bot },
    { id: 'profile',   label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-2xl border-t border-[var(--border-glass)] px-3 sm:px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-sm transition-colors duration-300">
      {tabsLeft.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 sm:px-2.5 rounded-xl transition-all min-h-[44px] shrink-0 ${
              isActive
                ? 'text-[var(--accent-primary)] font-bold scale-105'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Floating Center Create Action Widget */}
      <button
        onClick={onOpenCreate}
        aria-label="Create Vibe"
        className="btn-gradient p-3.5 rounded-full text-white shadow-sm -translate-y-2 border-2 border-[var(--bg-primary)] hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center shrink-0"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      {tabsRight.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 sm:px-2.5 rounded-xl transition-all min-h-[44px] shrink-0 ${
              isActive
                ? 'text-[var(--accent-primary)] font-bold scale-105'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

