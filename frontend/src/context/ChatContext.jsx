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

  // Fetch initial messages history and initial partner online status
  const fetchMessagesAndStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [messagesRes, statusRes] = await Promise.allSettled([
        api.get('/messages'),
        api.get('/messages/status')
      ]);

      if (messagesRes.status === 'fulfilled' && messagesRes.value?.success && Array.isArray(messagesRes.value.data)) {
        setMessages(messagesRes.value.data);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value?.success && typeof statusRes.value.data?.isPartnerOnline === 'boolean') {
        setIsPartnerOnline(statusRes.value.data.isPartnerOnline);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
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

    fetchMessagesAndStatus();

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Handler for room_status (sent immediately upon connect/reconnect)
    const handleRoomStatus = (data) => {
      if (typeof data?.isPartnerOnline === 'boolean') {
        setIsPartnerOnline(data.isPartnerOnline);
      }
    };

    // Handler for incoming new message
    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        // 1. If permanent ID already exists in the list, ignore duplicate
        if (prev.some((m) => m.id === newMsg.id)) return prev;

        // 2. If clientTempId matches an existing optimistic message, replace it in place
        if (newMsg.clientTempId && prev.some((m) => m.id === newMsg.clientTempId)) {
          return prev.map((m) => (m.id === newMsg.clientTempId ? newMsg : m));
        }

        // 3. Otherwise append new message
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

    const handleUserOnline = (data) => {
      if (data?.userId !== user.id) {
        setIsPartnerOnline(true);
      }
    };

    const handleUserOffline = (data) => {
      if (data?.userId !== user.id) {
        setIsPartnerOnline(false);
      }
    };

    const handleUserTyping = (data) => {
      if (data?.userId !== user.id) {
        setPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setPartnerTyping(false);
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data?.userId !== user.id) {
        setPartnerTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    socket.on('room_status', handleRoomStatus);
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    // Re-check presence periodically
    const presenceInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('check_online');
      }
    }, 15000);

    return () => {
      clearInterval(presenceInterval);
      socket.off('room_status', handleRoomStatus);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isAuthenticated, user, fetchMessagesAndStatus]);

  // Send message handler with rock-solid deduplication
  const sendMessage = async ({ content, mediaUrl, mediaType }) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: tempId,
      clientTempId: tempId,
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

    // Optimistically insert message
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api.post('/messages', {
        content,
        mediaUrl,
        mediaType,
        clientTempId: tempId
      });

      if (res.success && res.data) {
        setMessages((prev) => {
          // If socket already added this permanent message, simply filter out the optimistic tempId
          if (prev.some((m) => m.id === res.data.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          // Otherwise update optimistic item to real item
          return prev.map((m) => (m.id === tempId ? res.data : m));
        });
        return res.data;
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message if submission failed
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
        refreshMessages: fetchMessagesAndStatus
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
