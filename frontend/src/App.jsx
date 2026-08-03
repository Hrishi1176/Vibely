import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HomeFeed from './pages/HomeFeed';
import FriendsPage from './pages/FriendsPage';
import MessengerPage from './pages/MessengerPage';
import AIStudio from './pages/AIStudio';
import ProfilePage from './pages/ProfilePage';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import WhyVibelyModal from './components/WhyVibelyModal';
import { authAPI, quotaAPI, markAuthCheckCompleted } from './services/api';
import { useConfirm } from './context/ConfirmContext';
import { toast } from './context/ToastContext';

import { WebSocketProvider } from './context/WebSocketContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [messengerTarget, setMessengerTarget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWhyVibelyOpen, setIsWhyVibelyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  const { confirm } = useConfirm();

  const fetchUserAndQuota = useCallback(async () => {
    try {
      const uRes = await authAPI.getMe();
      setUser(uRes.data);
      const qRes = await quotaAPI.getMyQuota();
      setQuota(qRes.data);
    } catch {
      setUser(null);
      setQuota(null);
    } finally {
      setLoading(false);
      markAuthCheckCompleted();
    }
  }, []);

  const refreshCommunity = useCallback(() => {
    setFeedRefreshKey((prev) => prev + 1);
    fetchUserAndQuota();
  }, [fetchUserAndQuota]);

  useEffect(() => {
    fetchUserAndQuota();
  }, [fetchUserAndQuota]);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Confirm Account Logout',
      message: 'Are you sure you want to log out of Vibely? You will need to sign in again to access your account and direct messages.',
      confirmText: 'Yes, Log Out',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await authAPI.logout();
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    setQuota(null);
    setActiveTab('feed');
    toast.success('Successfully logged out of Vibely 👋');
  };


  const handleOpenMessengerWithUser = (friendUser) => {
    setMessengerTarget(friendUser);
    setActiveTab('messenger');
  };

  const [postDraft, setPostDraft] = useState(null);

  const handlePublishToFeed = (draft) => {
    setPostDraft(draft);
    setIsCreateOpen(true);
  };

  return (
    <WebSocketProvider user={user}>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent-primary)] selection:text-white transition-colors duration-300">


      
      {/* Top Header */}
      <Navbar
        user={user}
        quota={quota}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreate={() => { setPostDraft(null); setIsCreateOpen(true); }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWhyVibely={() => setIsWhyVibelyOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Layout */}
      <div className="max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex gap-6 flex-1 mb-20 lg:mb-0">
        
        {/* Left Sidebar (Desktop) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} quota={quota} />

        {/* Center Main Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'feed' && (
            <HomeFeed
              user={user}
              refreshKey={feedRefreshKey}
              onOpenCreate={() => { setPostDraft(null); setIsCreateOpen(true); }}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenWhyVibely={() => setIsWhyVibelyOpen(true)}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsPage
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenMessenger={handleOpenMessengerWithUser}
            />
          )}

          {activeTab === 'messenger' && (
            <MessengerPage
              user={user}
              targetFriend={messengerTarget}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {activeTab === 'ai-studio' && (
            <AIStudio
              user={user}
              quota={quota}
              refreshQuota={fetchUserAndQuota}
              onOpenAuth={() => setIsAuthOpen(true)}
              onPublishToFeed={handlePublishToFeed}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              user={user}
              onUserUpdated={(u) => setUser(u)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>

      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreate={() => { setPostDraft(null); (user ? setIsCreateOpen(true) : setIsAuthOpen(true)); }}
      />

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        quota={quota}
        refreshQuota={fetchUserAndQuota}
        onPostCreated={refreshCommunity}
        initialDraft={postDraft}
      />


      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          refreshCommunity();
        }}
      />

      <WhyVibelyModal
        isOpen={isWhyVibelyOpen}
        onClose={() => setIsWhyVibelyOpen(false)}
      />


    </div>
    </WebSocketProvider>
  );
}

