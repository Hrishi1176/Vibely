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
      const isFollowingNow = res.data.is_following;

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
      <div className="glass-panel rounded-2xl p-8 text-center space-y-4 border border-gray-800">
        <div className="inline-flex p-3 rounded-full bg-purple-500/10 text-purple-400">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="font-['Outfit'] font-bold text-gray-100 text-lg">Sign In to Find Friends</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Connect with creators, techies, and digital nomads across the Vibely network!
        </p>
        <button
          onClick={onOpenAuth}
          className="btn-gradient px-5 py-2.5 rounded-xl text-white font-medium text-xs inline-flex items-center space-x-2"
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
      <div className="glass-card rounded-2xl p-5 border border-purple-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-xl text-gray-100">Discover Friends & Creators</h2>
              <p className="text-xs text-purple-300">Search members, follow accounts, and start direct chats</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, handle, or badge..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button type="submit" className="btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-semibold">
            Search
          </button>
        </form>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2 text-xs pt-1">
          <button
            onClick={() => setFilter('suggestions')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'suggestions'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            All Suggestions ({usersList.length})
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'following'
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            My Friends / Following ({usersList.filter((u) => u.is_following).length})
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Searching community members...</div>
      ) : displayedUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedUsers.map((u) => {
            const isUserOnline = onlineUsers[u.id] ?? u.is_online;
            return (
              <div
                key={u.id}
                className="glass-card rounded-2xl p-4 border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="relative shrink-0">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-12 h-12 rounded-full border border-purple-500/30 object-cover"
                    />
                    <Circle className={`w-3.5 h-3.5 absolute bottom-0 right-0 border-2 border-gray-950 rounded-full ${
                      isUserOnline ? 'text-emerald-400 fill-emerald-400 animate-pulse' : 'text-gray-600 fill-gray-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-sm text-gray-100 truncate">{u.full_name || u.username}</span>
                      <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                        {u.vibe_badge || 'Creator'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                      <span>@{u.username}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className={isUserOnline ? "text-emerald-400 font-medium" : "text-gray-500"}>
                        {isUserOnline ? "Online" : "Offline"}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500 truncate pt-0.5">{u.bio || 'Vibing on Vibely ✨'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleToggleFollow(u.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                      u.is_following
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20'
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
                    className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-white transition-colors"
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
        <div className="glass-panel rounded-2xl p-8 text-center text-xs text-gray-500 border border-gray-800 space-y-2">
          <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
          <p className="font-medium text-gray-300">No users found matching your search</p>
          <p className="text-gray-500">Try searching for another name or handle!</p>
        </div>
      )}

    </div>
  );
}
