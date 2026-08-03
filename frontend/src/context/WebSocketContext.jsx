import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { playToastSound } from '../utils/toastSound';

const WebSocketContext = createContext();

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').trim().replace(/\/$/, '');
const API_BASE_URL = rawApiBaseUrl.endsWith('/api/v1') ? rawApiBaseUrl : `${rawApiBaseUrl}/api/v1`;

const getWebSocketUrl = () => {
  const token = localStorage.getItem('vibely_token');
  const wsHost = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1$/, '');
  let wsUrl = `${wsHost}/api/v1/ws/chat`;
  if (token) {
    wsUrl += `?token=${encodeURIComponent(token)}`;
  }
  return wsUrl;
};

export function WebSocketProvider({ children, user }) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({}); // { [user_id]: boolean }
  const [typingMap, setTypingMap] = useState({}); // { [user_id]: boolean }
  const [incomingMessage, setIncomingMessage] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connectWebSocket = () => {
      const wsUrl = getWebSocketUrl();

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          console.log('⚡ Connected to Enterprise Vibely WebSocket Server');
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'user_presence') {
              setOnlineUsers((prev) => ({
                ...prev,
                [data.user_id]: data.is_online
              }));
            } else if (data.type === 'new_message') {
              setIncomingMessage(data);
              if (data.sender_id !== user.id) {
                playToastSound('success');
              }
            } else if (data.type === 'message_updated' || data.type === 'message_deleted') {
              setIncomingMessage(data);
            } else if (data.type === 'user_typing') {
              setTypingMap((prev) => ({
                ...prev,
                [data.sender_id]: data.is_typing
              }));
            }
          } catch (e) {
            console.error('Error parsing WebSocket frame', e);
          }
        };


        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket connection closed. Retrying in 3s...');
          reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          ws.close();
        };

        socketRef.current = ws;
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        reconnectTimerRef.current = setTimeout(connectWebSocket, 4000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user]);

  const sendWebSocketMessage = (receiverId, content, image_url = null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat_message',
        receiver_id: receiverId,
        content: content,
        image_url: image_url
      }));
      return true;
    }
    return false;
  };

  // Send binary audio over the websocket. Protocol: first send a JSON metadata frame
  // with type 'chat_message_binary' then send the raw audio Blob as a separate frame.
  const sendWebSocketAudio = (receiverId, audioBlob, meta = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const metadata = {
          type: 'chat_message_binary',
          receiver_id: receiverId,
          filename: meta.filename || 'voice.webm',
          mime_type: audioBlob.type || 'audio/webm',
          content: meta.content || '',
        };
        socketRef.current.send(JSON.stringify(metadata));
        // send Blob directly as binary frame
        socketRef.current.send(audioBlob);
        return true;
      } catch (err) {
        console.error('Failed to send audio via websocket', err);
        return false;
      }
    }
    return false;
  };

  const sendTypingStatus = (receiverId, isTyping) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        receiver_id: receiverId,
        is_typing: isTyping
      }));
    }
  };

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      onlineUsers,
      typingMap,
      incomingMessage,
      sendWebSocketMessage,
      sendWebSocketAudio,
      sendTypingStatus
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
