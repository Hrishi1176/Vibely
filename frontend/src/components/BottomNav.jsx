import React from 'react';
import { Home, Bot, User, Users, MessageSquare, PlusCircle } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenCreate }) {
  const tabsLeft = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
  ];
  const tabsRight = [
    { id: 'messenger', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-gray-800 bg-[#0b0f19]/90 backdrop-blur-xl px-4 py-2 flex items-center justify-around">
      {tabsLeft.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 text-[11px] transition-colors ${
              isActive ? 'text-purple-400 font-semibold' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Center Create Action */}
      <button
        onClick={onOpenCreate}
        className="btn-gradient p-3 rounded-full text-white shadow-lg -translate-y-2 border-2 border-[#0b0f19]"
      >
        <PlusCircle className="w-5 h-5" />
      </button>

      {tabsRight.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 text-[11px] transition-colors ${
              isActive ? 'text-purple-400 font-semibold' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
