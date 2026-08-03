import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Sparkles, Send, Check, UserPlus, UserCheck, Bookmark, Hash, Bot } from 'lucide-react';
import { postsAPI, usersAPI } from '../services/api';
import { toast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function PostCard({ post, currentUser, onPostUpdated }) {
  const [liked, setLiked]                 = useState(post.is_liked_by_me);
  const [likesCount, setLikesCount]       = useState(post.likes_count || 0);
  const [following, setFollowing]         = useState(post.author?.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showComments, setShowComments]   = useState(false);
  const [comments, setComments]           = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [newComment, setNewComment]       = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [heartBurst, setHeartBurst]       = useState(false);
  const [saved, setSaved]                 = useState(false);

  // 3D Tilt state
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const { confirm } = useConfirm();

  /* ── 3D Tilt ────────────────── */
  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 6;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 6;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  /* ── Like ───────────────────── */
  const handleLike = async () => {
    if (!currentUser) return toast.error('Please sign in to like posts!');
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    if (nextLiked) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
    }
    try {
      await postsAPI.toggleLike(post.id);
    } catch {
      setLiked(liked);
      setLikesCount(post.likes_count || 0);
      toast.error('Failed to update like.');
    }
  };

  /* ── Follow ─────────────────── */
  const handleToggleFollow = async () => {
    if (!currentUser) return toast.error('Please sign in to follow users!');
    if (!post.author?.id) return;

    if (following) {
      const ok = await confirm({
        title: `Unfollow @${post.author.username}?`,
        message: `Are you sure you want to stop following @${post.author.username}?`,
        confirmText: 'Unfollow',
        cancelText: 'Keep Following',
        type: 'danger',
      });
      if (!ok) return;
    }

    setFollowLoading(true);
    try {
      const res = await usersAPI.toggleFollow(post.author.id);
      setFollowing(res.data.following);
      toast.success(res.data.following
        ? `Now following @${post.author.username} 🎉`
        : `Unfollowed @${post.author.username}`
      );
    } catch {
      toast.error('Failed to toggle follow.');
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Comments ───────────────── */
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await postsAPI.getComments(post.id);
        setComments(res.data);
      } catch {
        toast.error('Failed to load comments.');
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) return toast.error('Please sign in to comment!');
    try {
      const res = await postsAPI.addComment(post.id, newComment);
      setComments([...comments, res.data]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
      toast.success('Comment posted! 💬');
    } catch {
      toast.error('Failed to post comment.');
    }
  };

  /* ── Share ──────────────────── */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard! 🔗');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card rounded-2xl p-4 sm:p-5 mb-4 border border-[var(--border-glass)] relative overflow-hidden group"
      style={{
        transform: `perspective(900px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: 'transform 0.12s ease-out, box-shadow 0.3s ease',
      }}
    >
      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 shimmer-sweep opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* ── Header ──────────────────────────────── */}
      <div className="relative flex items-start sm:items-center justify-between mb-3.5 gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Avatar with hover ring */}
          <div className="shrink-0 relative group/avatar">
            <div className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity"
              style={{ background: `var(--accent-gradient)`, padding: '2px', borderRadius: '9999px' }}>
            </div>
            <img
              src={post.author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author?.username}`}
              alt={post.author?.username}
              className="relative w-10 h-10 rounded-full object-cover border-2 border-[var(--border-glass)] group-hover/avatar:scale-105 transition-transform"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
              <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                {post.author?.full_name || post.author?.username}
              </span>
              <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full border"
                style={{ background: 'var(--accent-primary)22', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)44' }}>
                {post.author?.vibe_badge || 'Creator'}
              </span>
            </div>
            <span className="block text-xs text-[var(--text-muted)] truncate">
              @{post.author?.username} · {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Follow Button */}
          {currentUser && post.author?.id && post.author.id !== currentUser.id && (
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 ${
                following
                  ? 'border text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
                  : 'text-white shadow-md'
              }`}
              style={following ? {} : { background: 'var(--accent-gradient)' }}
            >
              {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{following ? 'Following' : 'Follow'}</span>
            </button>
          )}

          {post.ai_generated && (
            <div className="px-2 py-1 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center space-x-1" title="Generated by Groq AI">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-bold">AI Vibe</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────── */}
      <p className="text-sm leading-relaxed whitespace-pre-line mb-3 text-[var(--text-primary)]">
        {post.content}
      </p>

      {/* Image */}
      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-3 border border-[var(--border-glass)] max-h-96 group/img">
          <img
            src={post.image_url}
            alt="Post media"
            className="w-full h-full object-cover group-hover/img:scale-[1.02] transition-transform duration-500"
          />
        </div>
      )}

      {/* Vibe Tag */}
      {post.vibe_tag && (
        <button className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg border mb-3 text-xs font-semibold transition-all hover:scale-105"
          style={{ background: 'var(--accent-primary)12', borderColor: 'var(--accent-primary)30', color: 'var(--accent-primary)' }}>
          <Hash className="w-3 h-3" />
          <span>{post.vibe_tag.replace('#', '')}</span>
        </button>
      )}

      {/* ── Action Footer ─────────────────────────── */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-glass)] text-xs text-[var(--text-muted)]">

        {/* Like */}
        <button
          onClick={handleLike}
          className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 group/like ${
            liked ? 'text-pink-500' : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          {/* Heart burst ring */}
          {heartBurst && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-8 h-8 rounded-full bg-pink-500/30 animate-ping" />
            </span>
          )}
          <Heart
            className={`w-4 h-4 icon-bounce transition-all ${liked ? 'fill-pink-500 animate-heart' : ''}`}
          />
          <span className="font-bold">{likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={handleToggleComments}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all group/comment"
        >
          <MessageCircle className="w-4 h-4 icon-bounce" />
          <span>{commentsCount}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all group/share"
        >
          {copied
            ? <Check  className="w-4 h-4 text-emerald-400" />
            : <Share2 className="w-4 h-4 icon-bounce" />
          }
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Save */}
        <button
          onClick={() => { setSaved(!saved); if (!saved) toast.success('Post saved! 🔖'); }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${
            saved ? 'text-amber-400' : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          <Bookmark className={`w-4 h-4 icon-bounce ${saved ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* ── Comments Drawer ──────────────────────── */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-[var(--border-glass)] space-y-3 animate-slide-up">
          {loadingComments ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {comments.map((c, i) => (
                <div key={c.id}
                  className="p-2.5 rounded-xl border text-xs space-y-0.5 animate-slide-up"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-glass)',
                    animationDelay: `${i * 40}ms`
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--accent-primary)]">@{c.author?.username}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)]">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-[var(--text-muted)] py-1">
              No comments yet — be the first! 💬
            </p>
          )}

          {currentUser && (
            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all"
                style={{
                  background: 'var(--input-bg)',
                  borderWidth: '1px',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button type="submit" className="btn-gradient p-2 rounded-xl text-white active:scale-95 transition-transform">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
