import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { playToastSound } from '../utils/toastSound';

const WebSocketContext = createContext();

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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/ws/chat`;

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
      sendTypingStatus
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
