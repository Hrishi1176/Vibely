import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Demo state (when Client ID is missing or in dev test mode)
  const [showGoogleDemo, setShowGoogleDemo] = useState(false);
  const [googleDemoEmail, setGoogleDemoEmail] = useState('');
  const [googleDemoName, setGoogleDemoName] = useState('');

  // System generated 5 unique usernames state
  const [username, setUsername] = useState('');
  const [systemUsernames, setSystemUsernames] = useState([]);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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

  // Initialize Google GIS if googleClientId is configured
  useEffect(() => {
    if (isOpen && googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
      } catch (err) {
        console.warn("Google GIS initialization warning:", err);
      }
    }
  }, [isOpen, googleClientId]);

  if (!isOpen) return null;

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      await authAPI.googleLogin({ credential: response.credential });
      toast.success('Signed in with Google! Welcome to Vibely 🚀');
      const userRes = await authAPI.getMe();
      onAuthSuccess(userRes.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Google sign-in failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleDemo(true);
          }
        });
      } catch {
        setShowGoogleDemo(true);
      }
    } else {
      setShowGoogleDemo(true);
    }
  };

  const handleGoogleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!googleDemoEmail) {
      toast.error('Please enter a valid Google email.');
      return;
    }

    setLoading(true);
    try {
      const sampleName = googleDemoName || googleDemoEmail.split('@')[0];
      const googleAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleDemoEmail)}`;
      await authAPI.googleLogin({
        email: googleDemoEmail,
        full_name: sampleName,
        sub: `google_user_${googleDemoEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        avatar_url: googleAvatar
      });
      toast.success(`Google Sign-In successful! Welcome, ${googleDemoName || googleDemoEmail} 🎉`);
      const userRes = await authAPI.getMe();
      onAuthSuccess(userRes.data);
      setShowGoogleDemo(false);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Google authentication failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && !username) {
      toast.error('Please enter your Full Name and select one of the generated handles.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await authAPI.login(usernameOrEmail, password);
        toast.success(`Welcome back to Vibely! 👋`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-[var(--border-glass)] p-5 sm:p-6 space-y-5 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-xl hover:bg-[var(--scrollbar-thumb)] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-['Outfit'] font-extrabold text-xl sm:text-2xl text-[var(--text-primary)]">
            {isLogin ? 'Welcome Back to Vibely' : 'Join Vibely Network'}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {isLogin ? 'Sign in with Google or enter your account details' : 'Sign up with Google or create a custom handle'}
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={triggerGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm group active:scale-[0.99]"
          >
            {/* Official Google 4-Color SVG Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[var(--border-glass)] w-full"></div>
            <span className="bg-[var(--bg-secondary)] px-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider rounded-full border border-[var(--border-glass)]">
              OR
            </span>
          </div>
        </div>

        {/* Traditional Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          )}

          {/* Registration Mode: System Designed Handle displayed in Read-Only View Mode */}
          {!isLogin ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  System Designed Handle <span className="text-[var(--accent-primary)] font-normal">(Auto-Generated)</span>
                </label>
                {fullName.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => fetchSystemUsernames(fullName)}
                    disabled={loadingUsernames}
                    className="text-[11px] text-[var(--accent-primary)] flex items-center gap-1 font-medium hover:underline transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingUsernames ? 'animate-spin' : ''}`} />
                    {loadingUsernames ? 'Generating...' : 'Roll New Handle'}
                  </button>
                )}
              </div>

              {fullName.trim().length < 2 ? (
                <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-center text-xs text-[var(--text-muted)] space-y-1">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)] mx-auto" />
                  <p className="font-medium text-[var(--text-primary)]">Type your Full Name above</p>
                  <p className="text-[11px] text-[var(--text-muted)]">The system will generate your unique handle automatically in view mode.</p>
                </div>
              ) : loadingUsernames ? (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-center text-xs text-[var(--accent-primary)] flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Designing system handle for "{fullName}"...</span>
                </div>
              ) : (
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--accent-primary)] absolute left-3 top-3" />
                  <input
                    type="text"
                    readOnly
                    value={`@${username}`}
                    className="w-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 rounded-xl pl-9 pr-24 py-2 text-xs font-mono font-bold text-[var(--accent-primary)] cursor-not-allowed focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-[10px] font-bold border border-[var(--accent-primary)]/30">
                    VIEW MODE
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Login Mode: Supports Username or Email Address */
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email or Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter email or @username"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@vibely.ai"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 mt-2 shadow-md"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="text-center text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-glass)]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
            }}
            className="text-[var(--accent-primary)] hover:underline font-semibold"
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </button>
        </div>
      </div>

      {/* Google OAuth Quick Sign-In Modal / Demo Fallback */}
      {showGoogleDemo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-gray-700 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowGoogleDemo(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-md">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h4 className="font-['Outfit'] font-bold text-xl text-gray-100">
                Google Quick Sign-In
              </h4>
              <p className="text-xs text-gray-400">
                Enter your Google Account email to sign in or create your Vibely profile instantly.
              </p>
            </div>

            <form onSubmit={handleGoogleDemoSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Google Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={googleDemoEmail}
                    onChange={(e) => setGoogleDemoEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name (Optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={googleDemoName}
                    onChange={(e) => setGoogleDemoName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-1"
              >
                {loading ? 'Authenticating...' : 'Sign In with Google'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
