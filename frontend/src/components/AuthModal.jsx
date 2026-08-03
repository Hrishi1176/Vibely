import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // System generated 5 unique usernames state
  const [systemUsernames, setSystemUsernames] = useState([]);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  const fetchSystemUsernames = async (nameInput = fullName) => {
    if (!nameInput || nameInput.trim().length < 2) {
      setSystemUsernames([]);
      setUsername('');
      return;
    }

    setLoadingUsernames(true);
    try {
      const res = await authAPI.generateUsername(nameInput, 5);
      const list = res.data?.usernames || (res.data?.username ? [res.data.username] : []);
      if (list && list.length > 0) {
        setSystemUsernames(list);
        if (!username || !list.includes(username)) {
          setUsername(list[0]);
        }
      }
    } catch {
      const cleanName = nameInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const fallbackList = [
        `${cleanName || 'vibe'}.vibe`,
        `real.${cleanName || 'vibe'}`,
        `iam.${cleanName || 'vibe'}`,
        `the.${cleanName || 'vibe'}`,
        `${cleanName || 'vibe'}_official`
      ];
      setSystemUsernames(fallbackList);
      setUsername(fallbackList[0]);
    } finally {
      setLoadingUsernames(false);
    }
  };

  // Debounced auto-generation based on Full Name
  useEffect(() => {
    if (!isLogin && isOpen) {
      if (fullName.trim().length >= 2) {
        const timer = setTimeout(() => {
          fetchSystemUsernames(fullName);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setSystemUsernames([]);
        setUsername('');
      }
    }
  }, [fullName, isLogin, isOpen]);

  // Early return MUST be after hooks to satisfy Rules of Hooks
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && !username) {
      toast.error('Please enter your Full Name and select one of the generated handles.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await authAPI.login(username, password);
        toast.success(`Welcome back, @${username}! 👋`);
      } else {
        await authAPI.register({ username, email, password, full_name: fullName });
        toast.success(`Account created! Welcome to Vibely, @${username} 🎉`);
      }
      const userRes = await authAPI.getMe();
      onAuthSuccess(userRes.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-gray-800 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-200">
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 text-purple-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-['Outfit'] font-extrabold text-2xl text-gray-100">
            {isLogin ? 'Welcome Back to Vibely' : 'Join Vibely Network'}
          </h3>
          <p className="text-xs text-gray-400">
            {isLogin ? 'Enter your details to access your account' : 'Enter your name to unlock custom system-generated handles'}
          </p>
        </div>


        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Registration Mode: System Designed Handle displayed in Read-Only View Mode */}
          {!isLogin ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-300">
                  System Designed Handle <span className="text-purple-400 font-normal">(Auto-Generated)</span>
                </label>
                {fullName.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => fetchSystemUsernames(fullName)}
                    disabled={loadingUsernames}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium hover:underline transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingUsernames ? 'animate-spin' : ''}`} />
                    {loadingUsernames ? 'Generating...' : 'Roll New Handle'}
                  </button>
                )}
              </div>

              {fullName.trim().length < 2 ? (
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center text-xs text-gray-400 space-y-1">
                  <Sparkles className="w-4 h-4 text-purple-400 mx-auto" />
                  <p className="font-medium text-gray-300">Type your Full Name above</p>
                  <p className="text-[11px] text-gray-500">The system will generate your unique handle automatically in view mode.</p>
                </div>
              ) : loadingUsernames ? (
                <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 text-center text-xs text-purple-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Designing system handle for "{fullName}"...</span>
                </div>
              ) : (
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    readOnly
                    value={`@${username}`}
                    className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl pl-9 pr-24 py-2 text-xs font-mono font-bold text-purple-200 cursor-not-allowed selection:bg-purple-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    VIEW MODE
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Login Mode: Standard Manual Username Input */
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}


          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@vibely.ai"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
            }}
            className="text-purple-400 hover:underline font-semibold"
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </button>
        </div>

      </div>
    </div>
  );
}
