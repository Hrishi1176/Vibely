import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, LogOut, ShieldAlert, X, ShieldCheck, Sparkles } from 'lucide-react';
import { playToastSound } from '../utils/toastSound';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmConfig, setConfirmConfig] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      playToastSound('error'); // Warning tone chime
      setConfirmConfig({
        title: options.title || 'Are you sure?',
        message: options.message || 'Please confirm if you wish to proceed with this sensitive operation.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger', // 'danger' | 'warning' | 'info'
        icon: options.icon || null,
        resolve
      });
    });
  }, []);

  const handleCancel = () => {
    if (confirmConfig?.resolve) {
      confirmConfig.resolve(false);
    }
    setConfirmConfig(null);
  };

  const handleConfirm = () => {
    if (confirmConfig?.resolve) {
      confirmConfig.resolve(true);
    }
    setConfirmConfig(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmConfig && (
        <FloatingConfirmWidget
          config={confirmConfig}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return { confirm: () => Promise.resolve(true) };
  }
  return ctx;
}

function FloatingConfirmWidget({ config, onCancel, onConfirm }) {
  const isDanger = config.type === 'danger';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      
      {/* Outer Floating Neon Glowing Background Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className={`w-80 h-80 rounded-full ${isDanger ? 'bg-rose-500/25' : 'bg-purple-500/25'} animate-neon-glow`} />
      </div>

      <div className="glass-panel w-full max-w-md rounded-3xl border border-rose-500/40 p-6 space-y-6 shadow-2xl relative text-center toast-floating-shadow animate-modal-float overflow-hidden">
        
        {/* Decorative Top Accent Light Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${isDanger ? 'from-rose-500 via-purple-500 to-amber-500' : 'from-purple-500 via-indigo-500 to-emerald-500'}`} />

        {/* Floating Animated 3D Icon Badge */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-2xl ${isDanger ? 'bg-rose-500/30' : 'bg-purple-500/30'} animate-ping opacity-75`} />
          <div className={`relative w-16 h-16 rounded-2xl ${isDanger ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-rose-500/40' : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/40'} border border-white/20 flex items-center justify-center shadow-xl animate-float-slow`}>
            {config.icon || (isDanger ? <LogOut className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />)}
          </div>
        </div>

        {/* Verification Status Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-widest shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>2-Layer Security Verification</span>
          </div>

          <h3 className="font-['Outfit'] font-black text-2xl text-gray-100 tracking-tight">
            {config.title}
          </h3>

          <p className="text-xs text-gray-300 leading-relaxed px-3 font-medium">
            {config.message}
          </p>
        </div>

        {/* Interactive Dual Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800/80">
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-2xl bg-gray-900/90 hover:bg-gray-800 text-gray-300 font-bold text-xs transition-all border border-gray-700 hover:border-gray-600 active:scale-95 shadow-md"
          >
            {config.cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`px-4 py-3 rounded-2xl text-white font-bold text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-1.5 ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 border border-rose-400/30 shadow-rose-950/60'
                : 'btn-gradient border border-purple-400/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{config.confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
