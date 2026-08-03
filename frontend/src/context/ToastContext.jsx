import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { playToastSound } from '../utils/toastSound';

const ToastContext = createContext(null);

// Global subscriber set allowing `toast.success()` outside of React components
const toastSubscribers = new Set();

export const toast = {
  success: (message, options = {}) => {
    toastSubscribers.forEach((sub) => sub({ message, type: 'success', ...options }));
  },
  error: (message, options = {}) => {
    toastSubscribers.forEach((sub) => sub({ message, type: 'error', ...options }));
  },
  show: (message, type = 'success', options = {}) => {
    toastSubscribers.forEach((sub) => sub({ message, type, ...options }));
  }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(({ message, type = 'success', duration = 4000, sound = true }) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);

    if (sound) {
      playToastSound(type);
    }

    const newToast = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
      exiting: false
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    toastSubscribers.add(addToast);
    return () => {
      toastSubscribers.delete(addToast);
    };
  }, [addToast]);

  const showSuccess = useCallback((msg, duration) => addToast({ message: msg, type: 'success', duration }), [addToast]);
  const showError = useCallback((msg, duration) => addToast({ message: msg, type: 'error', duration }), [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, showSuccess, showError, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: toast.show,
      showSuccess: toast.success,
      showError: toast.error,
      removeToast: () => {},
      toasts: []
    };
  }
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-5 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-300 transform ${
        toast.exiting ? 'animate-toast-slide-out' : 'animate-toast-slide-in'
      } ${
        isSuccess
          ? 'bg-[#0b1320]/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
          : 'bg-[#1a0c16]/90 border-rose-500/40 text-rose-100 shadow-rose-950/40'
      } toast-floating-shadow flex items-start space-x-3.5 group`}
    >
      {/* Glowing accent bar on left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isSuccess
            ? 'bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-600'
            : 'bg-gradient-to-b from-rose-400 via-pink-500 to-rose-600'
        }`}
      />

      {/* Icon Badge */}
      <div
        className={`p-2 rounded-xl shrink-0 ${
          isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 animate-pulse" />
        ) : (
          <AlertCircle className="w-5 h-5 animate-bounce" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5 min-w-0 pr-2">
        <div className="flex items-center justify-between">
          <h4
            className={`font-['Outfit'] font-bold text-xs uppercase tracking-wider ${
              isSuccess ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSuccess ? 'Success' : 'Error Notification'}
          </h4>
        </div>
        <p className="text-sm text-gray-200 font-medium leading-relaxed mt-0.5 break-words">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 focus:outline-none"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Animated Countdown Progress Bar */}
      {toast.duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            isSuccess ? 'bg-emerald-500/80' : 'bg-rose-500/80'
          }`}
          style={{
            animation: `toastProgress ${toast.duration}ms linear forwards`
          }}
        />
      )}
    </div>
  );
}
