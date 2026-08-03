import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, User as UserIcon, Sparkles, RefreshCw, Circle, CheckCheck, Smile, Image as ImageIcon, Mic, ArrowLeft, X, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { messagesAPI, usersAPI } from '../services/api';
import { toast } from '../context/ToastContext';
import { useWebSocket } from '../context/WebSocketContext';
import { compressAndReadFile } from '../utils/imageUploader';

export default function MessengerPage({ user, targetFriend, onOpenAuth }) {
  const { onlineUsers, typingMap, incomingMessage, sendWebSocketMessage, sendTypingStatus } = useWebSocket();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(targetFriend || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [actionMenuMessageId, setActionMenuMessageId] = useState(null);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [reactionsMap, setReactionsMap] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) {
      setLoadingConvos(false);
      return;
    }
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data);
      if (!activeUser && res.data.length > 0) {
        setActiveUser(res.data[0].user);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvos(false);
    }
  };

  const fetchMessages = async (userId) => {
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await messagesAPI.getMessages(userId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load message history', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (targetFriend) {
      setActiveUser(targetFriend);
    }
  }, [targetFriend]);

  useEffect(() => {
    if (activeUser?.id) {
      fetchMessages(activeUser.id);
    }
  }, [activeUser]);

  // Real-time Incoming Message Handler via WebSockets
  useEffect(() => {
    if (!incomingMessage) return;

    const isThisConversation =
      (activeUser?.id === incomingMessage.sender_id && user?.id === incomingMessage.receiver_id) ||
      (activeUser?.id === incomingMessage.receiver_id && user?.id === incomingMessage.sender_id);

    if (incomingMessage.type === 'new_message' && isThisConversation) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
    }

    if (incomingMessage.type === 'message_updated' && isThisConversation) {
      setMessages((prev) => prev.map((m) => (m.id === incomingMessage.id ? { ...m, ...incomingMessage } : m)));
    }

    if (incomingMessage.type === 'message_deleted' && isThisConversation) {
      setMessages((prev) => prev.map((m) => (m.id === incomingMessage.id ? { ...m, ...incomingMessage } : m)));
    }

    fetchConversations();
  }, [incomingMessage, activeUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (activeUser?.id) {
      sendTypingStatus(activeUser.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(activeUser.id, false);
      }, 2000);
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressAndReadFile(file, 1024, 1024, 0.7);
      setImagePreview(compressedDataUrl);
    } catch (err) {
      toast.error(err.message || 'Unable to load image.');
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (textCustom, imageUrlCustom = null) => {
    const textToSend = textCustom || newMessage.trim();
    const imageUrlToSend = imageUrlCustom || imagePreview;
    if ((!textToSend && !imageUrlToSend) || !activeUser?.id || sending) return;

    setNewMessage('');
    setSending(true);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(activeUser.id, false);

    // Try sending over enterprise WebSocket
    const sentViaWs = sendWebSocketMessage(activeUser.id, textToSend, imageUrlToSend);

    if (!sentViaWs) {
      // HTTP fallback if socket disconnected
      try {
        const res = await messagesAPI.sendMessage(activeUser.id, { content: textToSend, image_url: imageUrlToSend });
        setMessages((prev) => [...prev, res.data]);
        fetchConversations();
      } catch (err) {
        toast.error('Failed to send message.');
      } finally {
        setSending(false);
      }
    } else {
      setSending(false);
    }
  };


  const handleToggleReaction = (msgId, emoji) => {
    setReactionsMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === emoji ? null : emoji
    }));
  };

  const startEditingMessage = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.content || '');
    setActionMenuMessageId(null);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || editingMessageText.trim() === '') return;
    try {
      const res = await messagesAPI.updateMessage(editingMessageId, editingMessageText.trim());
      setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? res.data : m)));
      setEditingMessageId(null);
      setEditingMessageText('');
      toast.success('Message updated');
    } catch (err) {
      toast.error('Failed to update message.');
    }
  };

  const shouldRenderMessage = (msg) => {
    if (msg.deleted_by_sender && !msg.deleted_by_receiver && user.id === msg.sender_id) {
      return false;
    }
    if (msg.deleted_by_receiver && !msg.deleted_by_sender && user.id === msg.receiver_id) {
      return false;
    }
    return true;
  };

  const formatMessageContent = (msg) => {
    if (msg.deleted_by_sender && msg.deleted_by_receiver) {
      return 'This message was deleted.';
    }
    return msg.content || (msg.image_url ? 'Shared an image' : '');
  };

  const deleteMessage = async (message, scope = 'me') => {
    try {
      await messagesAPI.deleteMessage(message.id, scope);
      setActionMenuMessageId(null);
      if (scope === 'everyone') {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deleted_by_sender: true, deleted_by_receiver: true, content: 'This message was deleted.', image_url: null } : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }
      toast.success(scope === 'everyone' ? 'Message deleted for everyone' : 'Message deleted for you');
    } catch (err) {
      toast.error('Failed to delete message.');
    }
  };

  const toggleActionMenu = (messageId) => {
    setActionMenuMessageId((prev) => (prev === messageId ? null : messageId));
  };

  const formatLastSeen = (isoString) => {
    if (!isoString) return 'unknown';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center space-y-4 border border-[var(--border-glass)]">
        <div className="inline-flex p-3 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="font-['Outfit'] font-bold text-[var(--text-primary)] text-lg">Sign In to Open Messenger</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          Chat 1-on-1 with your friends on Vibely with fast direct messaging!
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

  const filteredConvos = conversations.filter(
    (c) =>
      c.user.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.user.username?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const quickReplies = [
    'Sounds awesome! 🔥',
    "Let's catch up soon ☕",
    'Love this vibe ✨',
    'Could you share details? 💬'
  ];

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[78vh] glass-panel rounded-3xl border border-[var(--border-glass)] overflow-hidden flex flex-col md:flex-row shadow-2xl relative transition-colors duration-300">
      
      {/* Left Column: Conversations List */}
      <div className={`w-full md:w-80 border-r border-[var(--border-glass)] flex flex-col bg-[var(--bg-tertiary)]/70 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-[var(--border-glass)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="font-['Outfit'] font-bold text-lg text-[var(--text-primary)]">Chats</h2>
            </div>
            <span className="text-[10px] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-2.5 py-0.5 rounded-full border border-[var(--accent-primary)]/30 font-bold">
              Direct
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-glass)]/40">
          {loadingConvos ? (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">Loading conversations...</div>
          ) : filteredConvos.length > 0 ? (
            filteredConvos.map((c) => {
              const isSelected = activeUser?.id === c.user.id;
              const isUserOnline = onlineUsers[c.user.id] ?? c.user.is_online;
              return (
                <button
                  key={c.user.id}
                  onClick={() => setActiveUser(c.user)}
                  className={`w-full p-3.5 text-left flex items-center space-x-3 transition-all ${
                    isSelected ? 'bg-[var(--accent-primary)]/15 border-l-4 border-[var(--accent-primary)]' : 'hover:bg-[var(--bg-secondary)]/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user.username}`}
                      alt={c.user.username}
                      className="w-10 h-10 rounded-full border border-[var(--border-glass)] object-cover"
                    />
                    <Circle className={`w-3 h-3 absolute bottom-0 right-0 border-2 border-[var(--bg-primary)] rounded-full ${
                      isUserOnline ? 'text-emerald-400 fill-emerald-400 animate-pulse' : 'text-[var(--text-muted)] fill-[var(--text-muted)]'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[var(--text-primary)] truncate">{c.user.full_name || c.user.username}</span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {new Date(c.last_message_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate pt-0.5">
                      {c.is_last_from_me ? 'You: ' : ''}{c.last_message}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-1">
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)] mx-auto mb-1" />
              <p>No chat history yet.</p>
              <p className="text-[11px] text-[var(--text-muted)]">Connect with members in Friends tab to start chatting!</p>
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Chat Window Viewport */}
      <div className={`flex-1 flex flex-col bg-[var(--bg-secondary)]/40 ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Active Recipient Top Header */}
            <div className="p-3.5 px-4 border-b border-[var(--border-glass)] flex items-center justify-between bg-[var(--bg-secondary)]/80 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveUser(null)}
                  className="md:hidden p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[var(--bg-tertiary)] text-[var(--accent-primary)] hover:text-[var(--text-primary)] border border-[var(--border-glass)] transition-colors flex items-center justify-center"
                  title="Back to Conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <img
                    src={activeUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUser.username}`}
                    alt={activeUser.username}
                    className="w-10 h-10 rounded-full border-2 border-[var(--border-glass)] object-cover"
                  />
                  <Circle className={`w-3 h-3 absolute bottom-0 right-0 border-2 border-[var(--bg-primary)] rounded-full ${
                    (onlineUsers[activeUser.id] ?? activeUser.is_online)
                      ? 'text-emerald-400 fill-emerald-400 animate-pulse'
                      : 'text-[var(--text-muted)] fill-[var(--text-muted)]'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-['Outfit'] font-bold text-sm text-[var(--text-primary)]">{activeUser.full_name || activeUser.username}</h3>
                    <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                      {activeUser.vibe_badge || 'Creator'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <span>@{activeUser.username}</span>
                    <span>·</span>
                    <span className={(onlineUsers[activeUser.id] ?? activeUser.is_online) ? 'text-emerald-400 font-medium' : 'text-[var(--text-muted)]'}>
                      {(onlineUsers[activeUser.id] ?? activeUser.is_online) ? 'Online' : `Last seen ${formatLastSeen(activeUser.last_login_at)}`}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-12 text-xs text-[var(--text-muted)]">Loading messages...</div>
              ) : messages.length > 0 ? (
                messages.filter(shouldRenderMessage).map((m) => {
                  const isMine = m.sender_id === user.id;
                  const activeReaction = reactionsMap[m.id];
                  return (
                    <div
                      key={m.id}
                      className={`group relative flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-slide-up`}
                    >
                      <div className="relative flex items-center space-x-2">
                        {/* Action Menu (Delete/Edit) */}
                        {isMine && (
                          <div className="relative">
                            <button
                              onClick={() => toggleActionMenu(m.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-opacity"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {actionMenuMessageId === m.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-44 glass-panel rounded-2xl border border-[var(--border-glass)] p-1.5 shadow-xl z-20 space-y-1 text-xs">
                                {!m.deleted_by_sender && (
                                  <button
                                    onClick={() => startEditingMessage(m)}
                                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center space-x-2"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                    <span>Edit Message</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteMessage(m, 'me')}
                                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center space-x-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete for me</span>
                                </button>
                                <button
                                  onClick={() => deleteMessage(m, 'everyone')}
                                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center space-x-2 font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete for everyone</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative ${
                            isMine
                              ? 'btn-gradient text-white rounded-br-none shadow-lg'
                              : 'bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)] rounded-bl-none shadow-md'
                          }`}
                        >
                          {m.image_url && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                              <img src={m.image_url} alt="Shared attachment" className="max-h-52 w-full object-cover" />
                            </div>
                          )}

                          <p className="whitespace-pre-line break-words">{formatMessageContent(m)}</p>

                          {/* Reaction badge */}
                          {activeReaction && (
                            <div className={`absolute -bottom-2 ${isMine ? 'left-2' : 'right-2'} bg-[var(--bg-primary)] border border-[var(--border-glass)] px-1.5 py-0.5 rounded-full text-xs shadow-md`}>
                              {activeReaction}
                            </div>
                          )}
                        </div>

                        {/* Quick Hover Reaction Picker Bar */}
                        <div className={`absolute -top-7 ${isMine ? 'right-0' : 'left-0'} hidden group-hover:flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-glass)] rounded-full px-2 py-1 shadow-xl z-10 text-xs`}>
                          {['❤️', '👍', '😂', '🔥', '😮'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(m.id, emoji)}
                              className="hover:scale-125 transition-transform p-0.5"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timestamp & Read Tick */}
                      <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)] mt-1 px-1">
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.is_edited && !m.deleted_by_sender && !m.deleted_by_receiver && (
                          <span className="text-[9px] text-[var(--accent-primary)] italic">edited</span>
                        )}
                        {isMine && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                      </div>

                      {editingMessageId === m.id && (
                        <div className="mt-2 flex flex-col gap-2 w-full max-w-sm">
                          <textarea
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            rows={3}
                            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-xl border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="btn-gradient px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-md transition"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-[var(--text-muted)] space-y-2">
                  <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
                  <p className="font-['Outfit'] font-bold text-[var(--text-primary)] text-sm">Say Hello to {activeUser.full_name || activeUser.username}! 👋</p>
                  <p className="text-xs text-[var(--text-muted)]">Send a direct message to start your instant conversation.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Quick Replies Bar */}
            <div className="px-3 py-2 border-t border-[var(--border-glass)] bg-[var(--bg-primary)]/40 flex items-center space-x-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[var(--accent-primary)] font-semibold shrink-0 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick AI Reply:
              </span>
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(reply)}
                  className="px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--border-glass)] hover:border-[var(--border-accent)] text-[var(--text-secondary)] text-[11px] shrink-0 transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-2.5 sm:p-3 border-t border-[var(--border-glass)] bg-[var(--bg-secondary)]/80 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="p-2 min-h-[38px] min-w-[38px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] rounded-xl transition-colors flex items-center justify-center"
                title="Send Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />

              <button
                type="button"
                onClick={() => handleSendMessage('🎙️ [Voice Note Preview]')}
                className="p-2 min-h-[38px] min-w-[38px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] rounded-xl transition-colors flex items-center justify-center"
                title="Send Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={`Message @${activeUser.username}...`}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />

              <button
                type="submit"
                disabled={sending || (!newMessage.trim() && !imagePreview)}
                className="btn-gradient p-2.5 min-h-[38px] min-w-[38px] rounded-xl text-white disabled:opacity-50 transition-opacity shrink-0 shadow-md flex items-center justify-center"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            {imagePreview && (
              <div className="px-4 pb-3 pt-2 space-y-2">
                <div className="relative max-w-sm rounded-3xl overflow-hidden border border-[var(--border-glass)] bg-[var(--bg-primary)]">
                  <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Image attached. Hit send to share it in chat.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-[var(--text-muted)] space-y-3">
            <div className="p-4 rounded-3xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--border-glass)]">
              <MessageSquare className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="font-['Outfit'] font-bold text-[var(--text-primary)] text-base">Your Vibely Direct Messages</h3>
            <p className="max-w-xs text-[var(--text-muted)] leading-relaxed">
              Select a chat from the sidebar or connect with creators in the Friends tab to start messaging!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
