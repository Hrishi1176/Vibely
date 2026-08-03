import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Edit3, Sparkles, Check, RefreshCw, Upload,
  Calendar, Users, FileText, Heart, Settings, Camera
} from 'lucide-react';
import { usersAPI, postsAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { toast } from '../context/ToastContext';
import { compressAndReadFile } from '../utils/imageUploader';

const VIBE_BADGES = [
  'Creator', 'AI Pioneer', 'Digital Nomad', 'Techie',
  'Visionary', 'Pioneer', 'Official', 'Trendsetter',
];

export default function ProfilePage({ user, onUserUpdated, onOpenAuth }) {
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isEditing, setIsEditing]     = useState(false);

  // Edit fields
  const [fullName, setFullName]   = useState('');
  const [bio, setBio]             = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [vibeBadge, setVibeBadge] = useState('Creator');
  const [saving, setSaving]       = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return setLoading(false);
    setLoading(true);
    try {
      // Fetch profile data (includes posts_count, followers_count, following_count)
      const res = await usersAPI.getProfile(user.username);
      const profile = res.data;
      setProfileData(profile);
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
      setVibeBadge(profile.vibe_badge || 'Creator');

      // Fetch user's own posts — filter feed by author
      const feedRes = await postsAPI.getFeed(0, 50);
      const mine = feedRes.data.filter((p) => p.author?.username === user.username);
      setUserPosts(mine);
    } catch (err) {
      console.error('Profile load error:', err);
      toast.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await usersAPI.updateProfile({ full_name: fullName, bio, avatar_url: avatarUrl, vibe_badge: vibeBadge });
      setIsEditing(false);
      onUserUpdated(updated.data);
      toast.success('Profile updated! ✨');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await compressAndReadFile(file, 400, 400);
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
      toast.success('Avatar preview ready — save to apply!');
    } catch (err) {
      toast.error(err.message || 'Failed to process image.');
    }
  };

  /* ── Not logged in ───────────────────────────────── */
  if (!user) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center space-y-5 border border-[var(--border-glass)] animate-scale-bounce">
        <div
          className="inline-flex p-4 rounded-3xl animate-float-slow"
          style={{ background: 'var(--accent-gradient)', boxShadow: `0 8px 24px var(--accent-glow)` }}
        >
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-['Outfit'] font-black text-xl text-[var(--text-primary)] mb-2">
            Sign In to View Your Profile
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
            Create a custom profile, set your Vibe Badge, and start sharing your world!
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="btn-gradient btn-glow-pulse px-6 py-2.5 rounded-2xl text-white font-bold text-sm inline-flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Sign In / Register Free</span>
        </button>
      </div>
    );
  }

  /* ── Loading skeleton ────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="glass-card rounded-3xl p-6 border border-[var(--border-glass)] space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full skeleton" />
            <div className="flex-1 space-y-3">
              <div className="w-40 h-5 skeleton rounded-lg" />
              <div className="w-24 h-3 skeleton rounded" />
              <div className="w-56 h-3 skeleton rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[1, 2, 3].map((n) => <div key={n} className="h-16 skeleton rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((n) => <div key={n} className="h-32 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  /* ── Profile view ────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Profile Header Card ──────────────────────── */}
      <div className="glass-card rounded-3xl p-6 border border-[var(--border-glass)] space-y-5 animate-slide-up relative overflow-hidden">
        {/* Background gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: 'var(--accent-gradient)' }}
        />
        <div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none animate-neon-glow"
          style={{ background: 'var(--accent-primary)' }}
        />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <div
              className="w-20 h-20 rounded-full p-[2.5px] animate-float-slow"
              style={{ background: 'var(--accent-gradient)', boxShadow: `0 0 24px var(--accent-glow)` }}
            >
              <img
                src={avatarPreview || profileData?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-primary)]"
              />
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[var(--bg-primary)] badge-glow" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-['Outfit'] font-extrabold text-xl text-[var(--text-primary)]">
                {profileData?.full_name || user.username}
              </h2>
              <span
                className="px-2.5 py-0.5 text-xs font-bold rounded-full border"
                style={{
                  background: 'var(--accent-primary)20',
                  color: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)40',
                }}
              >
                {profileData?.vibe_badge}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">@{profileData?.username}</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              {profileData?.bio || 'Vibing on Vibely ✨'}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] text-[var(--text-muted)] pt-0.5">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(profileData?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-[var(--border-glass)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <Settings className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border-glass)]">
          {[
            { icon: FileText, label: 'Posts',     value: profileData?.posts_count     ?? userPosts.length },
            { icon: Users,    label: 'Followers',  value: profileData?.followers_count ?? 0 },
            { icon: Heart,    label: 'Following',  value: profileData?.following_count ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="p-3 rounded-2xl border border-[var(--border-glass)] text-center transition-all hover:border-[var(--accent-primary)] hover:shadow-lg"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Icon className="w-4 h-4 mx-auto mb-1 text-[var(--accent-primary)]" />
              <div className="font-['Outfit'] font-black text-lg text-[var(--text-primary)]">{value}</div>
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Profile Form ─────────────────────────── */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="glass-card rounded-3xl p-6 border border-[var(--border-glass)] space-y-5 animate-slide-up"
          style={{ borderColor: 'var(--accent-primary)40' }}
        >
          <h3 className="font-['Outfit'] font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[var(--accent-primary)]" />
            Edit Profile Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--accent-primary)',
                }}
              />
            </div>

            {/* Vibe Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Vibe Badge</label>
              <select
                value={vibeBadge}
                onChange={(e) => setVibeBadge(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                }}
              >
                {VIBE_BADGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Profile Photo</label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <img
                src={avatarPreview || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt="Avatar preview"
                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--accent-primary)]/40 shrink-0"
              />
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] shrink-0"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value); }}
                  placeholder="Or paste an image URL"
                  className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world your vibe..."
              className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none transition-all"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center space-x-2 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />
              }
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-[var(--border-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              style={{ background: 'var(--bg-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── My Posts ──────────────────────────────────── */}
      <div className="space-y-3 animate-slide-up stagger-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-['Outfit'] font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            My Vibes
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full"
              style={{ background: 'var(--accent-primary)20', color: 'var(--accent-primary)' }}
            >
              {userPosts.length}
            </span>
          </h3>
          <button
            onClick={fetchProfile}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] transition-all"
            title="Refresh posts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {userPosts.length > 0 ? (
          <div>
            {userPosts.map((p, i) => (
              <div key={p.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <PostCard post={p} currentUser={user} onPostUpdated={fetchProfile} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center space-y-4 border border-[var(--border-glass)] animate-scale-bounce">
            <div
              className="inline-flex p-4 rounded-3xl animate-float-slow"
              style={{ background: 'var(--accent-gradient)', boxShadow: `0 8px 24px var(--accent-glow)` }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="font-['Outfit'] font-black text-lg text-[var(--text-primary)] mb-1">No Vibes Yet!</h4>
              <p className="text-sm text-[var(--text-muted)]">
                Share your first post — try the AI Caption Generator!
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
