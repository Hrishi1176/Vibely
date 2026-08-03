import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, RefreshCw, PlusCircle, Zap, EyeOff,
  TrendingUp, Users, Bot, Star, Flame,
  ChevronRight, Play, Globe, Shield, Cpu,
  Hash, Heart, Loader2
} from 'lucide-react';
import PostCard from '../components/PostCard';
import { postsAPI, usersAPI } from '../services/api';

/* ─────────────────────────────────────
   Animated count-up hook
───────────────────────────────────── */
function useCountUp(target, duration = 1600, delay = 0) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!target) return;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(ease * target));
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return count;
}

/* ─────────────────────────────────────
   Hero Stat Card — driven by real data
───────────────────────────────────── */
function StatCard({ icon: Icon, value, suffix = '', label, colorClass, delay }) {
  const count = useCountUp(value, 1600, delay);
  return (
    <div className="flex flex-col items-center space-y-1 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1 ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="font-['Outfit'] font-black text-2xl sm:text-3xl text-[var(--text-primary)]">
        {value === null ? '—' : count.toLocaleString()}{suffix}
      </span>
      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest text-center">
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────
   Floating Particle dot
───────────────────────────────────── */
function Particle({ className, style }) {
  return <div className={`absolute w-2 h-2 rounded-full opacity-40 pointer-events-none ${className}`} style={style} />;
}

/* ─────────────────────────────────────
   Feature Badge
───────────────────────────────────── */
function FeatureBadge({ icon: Icon, label, colorCls }) {
  return (
    <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${colorCls}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────
   Story Circle — real users from suggestions API
───────────────────────────────────── */
function StoryCircle({ user, isCreate, onClick, index }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center space-y-1.5 shrink-0 group animate-slide-up"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="relative">
        {isCreate ? (
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--accent-primary)] group-hover:scale-110 transition-transform shadow-lg">
            <PlusCircle className="w-6 h-6 text-[var(--accent-primary)]" />
          </div>
        ) : (
          <div
            className="story-ring w-14 h-14 rounded-full p-[2px] group-hover:scale-110 transition-transform"
            style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.username}
              className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-primary)]"
            />
          </div>
        )}
        {/* Online indicator for real users */}
        {!isCreate && user.is_online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[var(--bg-primary)] badge-glow" />
        )}
      </div>
      <span className="text-[10px] font-semibold text-[var(--text-secondary)] max-w-[56px] truncate text-center">
        {isCreate ? 'Your Vibe' : (user.full_name?.split(' ')[0] || user.username)}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────
   Trending Widget — real vibe tag data
───────────────────────────────────── */
function TrendingWidget({ trends, trendsLoading, onOpenCreate, user, onOpenAuth }) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-[var(--border-glass)] space-y-3 animate-slide-up stagger-4">
      <div className="flex items-center justify-between">
        <h3 className="font-['Outfit'] font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
          Trending Vibes
        </h3>
        <span className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block" />
          Live
        </span>
      </div>

      {trendsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center justify-between p-2 rounded-xl">
              <div className="w-24 h-3 skeleton rounded-lg" />
              <div className="w-10 h-3 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      ) : trends.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-3">
          No trending tags yet. Be the first! 🚀
        </p>
      ) : (
        <div className="space-y-1.5">
          {trends.map((t, i) => (
            <div
              key={t.tag}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < 2 ? 'bg-orange-400 animate-pulse' : 'bg-[var(--accent-primary)]'}`} />
                <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate max-w-[100px]">
                  {t.tag}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium shrink-0">
                {t.post_count} {t.post_count === 1 ? 'post' : 'posts'}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={user ? onOpenCreate : onOpenAuth}
        className="w-full btn-gradient py-2 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-1.5"
      >
        <Flame className="w-3.5 h-3.5 text-amber-300" />
        <span>Join the Trend</span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────
   FILTERS — derived from real posts
───────────────────────────────────── */
const STATIC_FILTERS = [
  { id: 'All',  icon: '✨', label: 'All Vibes' },
  { id: 'AI',   icon: '🤖', label: 'AI Made' },
];

/* ─────────────────────────────────────
   Main HomeFeed
───────────────────────────────────── */
export default function HomeFeed({ user, refreshKey, onOpenCreate, onOpenAuth, onOpenWhyVibely }) {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // Dynamic data states
  const [stats, setStats]               = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [trends, setTrends]             = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [storyUsers, setStoryUsers]     = useState([]);
  const [storyLoading, setStoryLoading] = useState(true);

  /* ── Derived dynamic filter tabs from real vibe tags ── */
  const dynamicFilters = React.useMemo(() => {
    const tagSet = new Set();
    posts.forEach((p) => { if (p.vibe_tag) tagSet.add(p.vibe_tag); });
    const tagFilters = Array.from(tagSet).slice(0, 5).map((tag) => ({
      id: tag,
      icon: '🏷️',
      label: tag,
    }));
    return [...STATIC_FILTERS, ...tagFilters];
  }, [posts]);

  /* ── Fetch all data in parallel ── */
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getFeed();
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await postsAPI.getPlatformStats();
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await postsAPI.getTrendingTags(8);
      setTrends(res.data);
    } catch {
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  const fetchStoryUsers = useCallback(async () => {
    setStoryLoading(true);
    try {
      const res = await usersAPI.getSuggestions();
      // Only show up to 8 users in story tray
      setStoryUsers(res.data.slice(0, 8));
    } catch {
      setStoryUsers([]);
    } finally {
      setStoryLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kick off all fetches in parallel
    fetchFeed();
    fetchStats();
    fetchTrends();
    fetchStoryUsers();
  }, [fetchFeed, fetchStats, fetchTrends, fetchStoryUsers, refreshKey]);

  /* ── Refresh everything ── */
  const handleRefresh = useCallback(() => {
    fetchFeed();
    fetchStats();
    fetchTrends();
    fetchStoryUsers();
  }, [fetchFeed, fetchStats, fetchTrends, fetchStoryUsers]);

  /* ── Filter posts ── */
  const filteredPosts = activeFilter === 'All'
    ? posts
    : activeFilter === 'AI'
    ? posts.filter((p) => p.ai_generated)
    : posts.filter((p) => p.vibe_tag === activeFilter);

  /* ── Extract unique quick-post hashtags from existing posts ── */
  const quickTags = React.useMemo(() => {
    const seen = new Set();
    const out = [];
    posts.forEach((p) => {
      if (p.vibe_tag && !seen.has(p.vibe_tag) && out.length < 3) {
        seen.add(p.vibe_tag);
        out.push(p.vibe_tag);
      }
    });
    return out.length > 0 ? out : ['#Vibely'];
  }, [posts]);

  return (
    <div className="space-y-5">

      {/* ── HERO BANNER ──────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden border border-[var(--border-glass)] shadow-2xl animate-slide-up"
        style={{ background: `linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%)` }}
      >
        {/* Floating particles */}
        <Particle className="particle-1 bg-[var(--accent-primary)]"    style={{ top: '18%', left: '8%' }} />
        <Particle className="particle-2 bg-[var(--accent-secondary)]"  style={{ top: '62%', left: '22%' }} />
        <Particle className="particle-3 bg-purple-400"                 style={{ top: '30%', left: '75%' }} />
        <Particle className="particle-4 bg-[var(--accent-primary)]"    style={{ top: '75%', left: '65%' }} />
        <Particle className="particle-5 bg-emerald-400"                style={{ top: '12%', left: '55%' }} />
        <Particle className="particle-6 bg-pink-400"                   style={{ top: '50%', left: '90%' }} />

        {/* Glow orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none animate-neon-glow"
          style={{ background: 'var(--accent-primary)' }} />
        <div className="absolute -bottom-12 -right-12 w-52 h-52 rounded-full opacity-15 blur-3xl pointer-events-none animate-neon-glow"
          style={{ background: 'var(--accent-secondary)', animationDelay: '2s' }} />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mb-5 animate-slide-up stagger-1">
            <FeatureBadge icon={Bot}    label="Free Groq AI"       colorCls="bg-purple-500/15 text-purple-400 border-purple-500/30" />
            <FeatureBadge icon={EyeOff} label="Zero Ad Noise"      colorCls="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" />
            <FeatureBadge icon={Shield} label="Enterprise Privacy"  colorCls="bg-blue-500/15 text-blue-400 border-blue-500/30" />
            <FeatureBadge icon={Globe}  label="Chronological Feed"  colorCls="bg-amber-500/15 text-amber-400 border-amber-500/30" />
          </div>

          {/* Headline */}
          <div className="mb-6 animate-slide-up stagger-2">
            <h1 className="font-['Outfit'] font-black text-2xl sm:text-4xl leading-tight text-[var(--text-primary)] mb-2">
              The Social Platform{' '}
              <span className="gradient-text">Built for Creators</span>
              <span className="cursor-blink text-[var(--accent-primary)]"> |</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
              No manipulation. No ads. Just pure connection powered by{' '}
              <strong className="text-[var(--text-primary)]">Groq Llama 3 AI</strong> — 100% free forever.
            </p>
          </div>

          {/* Live Platform Stats — real data from /posts/stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {statsLoading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="flex flex-col items-center space-y-2 animate-slide-up" style={{ animationDelay: `${n * 100}ms` }}>
                  <div className="w-10 h-10 rounded-2xl skeleton" />
                  <div className="w-16 h-7 skeleton rounded-lg" />
                  <div className="w-14 h-2.5 skeleton rounded" />
                </div>
              ))
            ) : (
              <>
                <StatCard icon={Users}    value={stats?.total_users    ?? 0} label="Creators"     colorClass="bg-purple-600"  delay={200} />
                <StatCard icon={Sparkles} value={stats?.total_posts    ?? 0} label="Vibes Posted"  colorClass="bg-indigo-600"  delay={360} />
                <StatCard icon={Cpu}      value={stats?.total_ai_posts ?? 0} label="AI Vibes"      colorClass="bg-emerald-600" delay={520} />
              </>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 animate-slide-up stagger-4">
            <button
              onClick={user ? onOpenCreate : onOpenAuth}
              className="btn-gradient btn-glow-pulse px-5 py-2.5 rounded-2xl text-white font-bold text-sm flex items-center space-x-2 shadow-xl"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{user ? 'Drop Your Vibe ✨' : 'Join Free — No Ads Ever'}</span>
            </button>
            <button
              onClick={onOpenWhyVibely}
              className="px-5 py-2.5 rounded-2xl border border-[var(--border-accent)] text-[var(--text-primary)] font-semibold text-sm flex items-center space-x-2 hover:bg-[var(--bg-secondary)] transition-all"
            >
              <Play className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Why Choose Vibely</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STORY TRAY — real user suggestions ──────── */}
      <div className="glass-card rounded-2xl border border-[var(--border-glass)] p-4 animate-slide-up stagger-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Outfit'] font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 animate-pulse" />
            Vibe Stories
          </h2>
          {storyLoading && <Loader2 className="w-3.5 h-3.5 text-[var(--text-muted)] animate-spin" />}
        </div>
        <div className="flex items-start space-x-4 overflow-x-auto pb-1 no-scrollbar">
          {/* Create Vibe (always first) */}
          <StoryCircle isCreate onClick={user ? onOpenCreate : onOpenAuth} index={0} />

          {storyLoading ? (
            [1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex flex-col items-center space-y-2 shrink-0">
                <div className="w-14 h-14 rounded-full skeleton" />
                <div className="w-10 h-2.5 skeleton rounded" />
              </div>
            ))
          ) : storyUsers.length > 0 ? (
            storyUsers.map((u, i) => (
              <StoryCircle
                key={u.id}
                user={u}
                onClick={() => {}}
                index={i + 1}
              />
            ))
          ) : (
            <p className="text-xs text-[var(--text-muted)] self-center pl-2">
              No other creators yet — invite friends! 🎉
            </p>
          )}
        </div>
      </div>

      {/* ── CREATE POST TRIGGER ──────────────────────── */}
      <div className="relative glass-card rounded-2xl border border-[var(--border-glass)] p-4 overflow-hidden animate-slide-up stagger-3">
        <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}
                alt="You"
                className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-primary)]/40"
              />
              {user && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[var(--bg-primary)] badge-glow" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-['Outfit'] font-semibold text-sm text-[var(--text-primary)] truncate">
                {user
                  ? `What's your vibe, ${user.full_name?.split(' ')[0] || user.username}?`
                  : 'Join the conversation on Vibely!'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">AI Caption • Image Art • Free Forever</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick tag pills — derived from real posts */}
            <div className="hidden sm:flex items-center space-x-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={user ? onOpenCreate : onOpenAuth}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              onClick={user ? onOpenCreate : onOpenAuth}
              className="btn-gradient px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-float-slow" />
              <span>Post Vibe</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER TABS — dynamic from real post vibe_tags ── */}
      <div className="flex items-center justify-between px-1 animate-slide-up stagger-4">
        <div className="relative flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {dynamicFilters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-glass)]'
                }`}
                style={isActive ? {
                  background: 'var(--accent-gradient)',
                  boxShadow: `0 4px 14px var(--accent-glow)`
                } : {}}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
                {isActive && (
                  <span className="tab-indicator absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white/40" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleRefresh}
          title="Refresh Feed"
          className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all shrink-0 ml-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── POSTS + TRENDING LAYOUT ─────────────────── */}
      <div className="flex gap-5">

        {/* ── Post Feed ───────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="glass-card rounded-2xl p-5 space-y-4 border border-[var(--border-glass)] animate-slide-up"
                  style={{ animationDelay: `${n * 80}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full skeleton" />
                    <div className="space-y-2 flex-1">
                      <div className="w-32 h-3 skeleton rounded-lg" />
                      <div className="w-20 h-2.5 skeleton rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 skeleton rounded-lg" />
                    <div className="w-3/4 h-3 skeleton rounded-lg" />
                  </div>
                  <div className="w-full h-28 skeleton rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div>
              {filteredPosts.map((post, i) => (
                <div
                  key={post.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 65}ms` }}
                >
                  <PostCard post={post} currentUser={user} onPostUpdated={handleRefresh} />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-card rounded-3xl p-10 text-center space-y-4 border border-[var(--border-glass)] animate-scale-bounce">
              <div
                className="inline-flex p-4 rounded-3xl animate-float-slow"
                style={{ background: 'var(--accent-gradient)', boxShadow: `0 8px 24px var(--accent-glow)` }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-black text-xl text-[var(--text-primary)] mb-1">
                  {activeFilter === 'All' ? 'No Vibes Yet!' : `No "${activeFilter}" posts found`}
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                  {activeFilter === 'All'
                    ? 'Be the first to drop a post using the AI Caption Generator — free!'
                    : 'Try a different filter or be the first to post with this tag!'}
                </p>
              </div>
              <button
                onClick={user ? onOpenCreate : onOpenAuth}
                className="btn-gradient btn-glow-pulse px-6 py-2.5 rounded-2xl text-white font-bold text-sm inline-flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Vibe ✨</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Trending Widget ─────── */}
        <div className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Trending Tags — real data */}
            <TrendingWidget
              trends={trends}
              trendsLoading={trendsLoading}
              onOpenCreate={onOpenCreate}
              user={user}
              onOpenAuth={onOpenAuth}
            />

            {/* Platform stats mini card — real numbers */}
            <div className="glass-card rounded-2xl p-4 border border-[var(--border-glass)] space-y-3 animate-slide-up stagger-5">
              <h3 className="font-['Outfit'] font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Platform Pulse
              </h3>
              {statsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center justify-between">
                      <div className="w-20 h-2.5 skeleton rounded" />
                      <div className="w-10 h-2.5 skeleton rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {[
                    { icon: Users,    label: 'Creators',    value: stats?.total_users    ?? 0 },
                    { icon: Sparkles, label: 'Total Vibes', value: stats?.total_posts    ?? 0 },
                    { icon: Bot,      label: 'AI Vibes',    value: stats?.total_ai_posts ?? 0 },
                    { icon: Heart,    label: 'Total Likes', value: stats?.total_likes    ?? 0 },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[var(--accent-primary)]" />
                        {label}
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Why Vibely mini card */}
            <div className="glass-card rounded-2xl p-4 border border-[var(--border-glass)] space-y-3 animate-slide-up stagger-6">
              <h3 className="font-['Outfit'] font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Why Vibely?
              </h3>
              {[
                { icon: '🚀', text: 'Groq Llama 3 AI — Free' },
                { icon: '🔒', text: 'Zero data selling' },
                { icon: '📢', text: 'No algorithm bias' },
                { icon: '💬', text: 'Real-time chat' },
                { icon: '🌙', text: '7 premium themes' },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-xs text-[var(--text-secondary)]">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
              <button
                onClick={onOpenWhyVibely}
                className="w-full py-2 rounded-xl border border-[var(--border-accent)] text-[var(--accent-primary)] font-semibold text-xs hover:bg-[var(--accent-primary)]/10 transition-all flex items-center justify-center space-x-1"
              >
                <span>Full Comparison</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
