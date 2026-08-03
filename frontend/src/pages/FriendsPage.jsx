import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, UserCheck, MessageSquare, Sparkles, User as UserIcon, Circle } from 'lucide-react';
import { usersAPI } from '../services/api';
import { toast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useWebSocket } from '../context/WebSocketContext';

export default function FriendsPage({ user, onOpenAuth, onOpenMessenger }) {
  const { onlineUsers } = useWebSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('suggestions'); // 'suggestions' | 'following'

  const { confirm } = useConfirm();

  const fetchUsers = async (query = searchQuery) => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (query.trim()) {
        const res = await usersAPI.searchUsers(query);
        setUsersList(res.data);
      } else {
        const res = await usersAPI.getSuggestions();
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch friends list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleToggleFollow = async (userId) => {
    const targetUser = usersList.find((u) => u.id === userId);
    if (targetUser?.is_following) {
      const isConfirmed = await confirm({
        title: `Unfollow @${targetUser.username}?`,
        message: `Are you sure you want to stop following ${targetUser.full_name || targetUser.username}? You will see fewer posts from them in your home feed.`,
        confirmText: 'Unfollow',
        cancelText: 'Cancel',
        type: 'warning'
      });
      if (!isConfirmed) return;
    }

    try {
      const res = await usersAPI.toggleFollow(userId);
      const isFollowingNow = res.data.following !== undefined ? res.data.following : res.data.is_following;

      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_following: isFollowingNow } : u))
      );

      toast.success(isFollowingNow ? `Now following @${targetUser?.username}! 🎉` : `Unfollowed @${targetUser?.username}`);
    } catch (err) {
      toast.error('Action failed. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center space-y-4 border border-[var(--border-glass)]">
        <div className="inline-flex p-3 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="font-['Outfit'] font-bold text-[var(--text-primary)] text-lg">Sign In to Find Friends</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          Connect with creators, techies, and digital nomads across the Vibely network!
        </p>
        <button
          onClick={onOpenAuth}
          className="btn-gradient px-5 py-2.5 rounded-xl text-white font-medium text-xs inline-flex items-center space-x-2 shadow-lg"
        >
          <UserIcon className="w-4 h-4" />
          <span>Sign In / Register</span>
        </button>
      </div>
    );
  }

  const displayedUsers = usersList.filter((u) => {
    if (filter === 'following') return u.is_following;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Search Header Banner */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[var(--border-glass)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[var(--text-primary)]">Discover Friends & Creators</h2>
              <p className="text-xs text-[var(--text-muted)]">Search members, follow accounts, and start direct chats</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, handle, or badge..."
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <button type="submit" className="btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-md">
            Search
          </button>
        </form>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2 text-xs pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('suggestions')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              filter === 'suggestions'
                ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-semibold'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Suggestions ({usersList.length})
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              filter === 'following'
                ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-semibold'
                : 'bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            My Friends / Following ({usersList.filter((u) => u.is_following).length})
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[var(--text-muted)]">Searching community members...</div>
      ) : displayedUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedUsers.map((u) => {
            const isUserOnline = onlineUsers[u.id] ?? u.is_online;
            return (
              <div
                key={u.id}
                className="glass-card rounded-2xl p-4 border border-[var(--border-glass)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="relative shrink-0">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--border-glass)] object-cover"
                    />
                    <Circle className={`w-3.5 h-3.5 absolute bottom-0 right-0 border-2 border-[var(--bg-primary)] rounded-full ${
                      isUserOnline ? 'text-emerald-400 fill-emerald-400 animate-pulse' : 'text-[var(--text-muted)] fill-[var(--text-muted)]'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate">{u.full_name || u.username}</span>
                      <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shrink-0">
                        {u.vibe_badge || 'Creator'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5">
                      <span>@{u.username}</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                      <span className={isUserOnline ? "text-emerald-400 font-medium" : "text-[var(--text-muted)]"}>
                        {isUserOnline ? "Online" : "Offline"}
                      </span>
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate pt-0.5">{u.bio || 'Vibing on Vibely ✨'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleFollow(u.id)}
                    className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                      u.is_following
                        ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                        : 'btn-gradient text-white shadow-md'
                    }`}
                  >
                    {u.is_following ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">+ Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenMessenger(u)}
                    className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--scrollbar-thumb)] border border-[var(--border-glass)] text-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-xs text-[var(--text-muted)] border border-[var(--border-glass)] space-y-2">
          <Sparkles className="w-6 h-6 text-[var(--accent-primary)] mx-auto" />
          <p className="font-medium text-[var(--text-primary)]">No users found matching your search</p>
          <p className="text-[var(--text-muted)]">Try searching for another name or handle!</p>
        </div>
      )}

    </div>
  );
}

