import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Fetch initial messages history
  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/messages');
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark all unread messages as read
  const markAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await api.put('/messages/read');
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('mark_read');
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId !== user?.id ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Failed to mark messages read:', err);
    }
  }, [isAuthenticated, user?.id]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    fetchMessages();

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate appending
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // If partner sent it while we are in the chat, mark as read
      if (newMsg.senderId !== user.id) {
        socket.emit('mark_read');
      }
    };

    const handleMessagesRead = ({ readBy }) => {
      if (readBy !== user.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === user.id ? { ...m, isRead: true } : m))
        );
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleUserOnline = () => setIsPartnerOnline(true);
    const handleUserOffline = () => setIsPartnerOnline(false);

    const handleUserTyping = () => {
      setPartnerTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setPartnerTyping(false);
      }, 3000);
    };

    const handleUserStopTyping = () => {
      setPartnerTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAuthenticated, user, fetchMessages]);

  // Send message handler (Supports both WebSocket and REST fallback)
  const sendMessage = async ({ content, mediaUrl, mediaType }) => {
    const socket = getSocket();

    // Optimistic message placeholder
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: tempId,
      content,
      mediaUrl,
      mediaType,
      isRead: false,
      senderId: user.id,
      sharedSpaceId: user.sharedSpaceId,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Send via REST for rock-solid persistence
      const res = await api.post('/messages', { content, mediaUrl, mediaType });
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data : m))
        );
        return res.data;
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw err;
    }
  };

  // Delete message handler
  const deleteMsg = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  };

  // Typing event emission
  const sendTypingStatus = (isTyping) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop');
    }
  };

  // Calculate unread count from partner
  const unreadCount = messages.filter(
    (m) => m.senderId !== user?.id && !m.isRead
  ).length;

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        unreadCount,
        isPartnerOnline,
        partnerTyping,
        sendMessage,
        deleteMessage: deleteMsg,
        sendTypingStatus,
        markAsRead,
        refreshMessages: fetchMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
