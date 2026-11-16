import { Server } from 'socket.io';
import { verifyJwtToken } from '../utils/token.js';
import prisma from '../config/db.js';
import { createMessage, markMessagesAsRead } from './messageService.js';

let io = null;

// Registry of active users in each space: sharedSpaceId -> Set of userIds
const spaceActiveUsers = new Map();

/**
 * Checks if the partner in the space has an active socket connection.
 */
export const isPartnerOnlineInSpace = (sharedSpaceId, currentUserId) => {
  const activeSet = spaceActiveUsers.get(sharedSpaceId);
  if (!activeSet) return false;
  for (const uid of activeSet) {
    if (uid !== currentUserId) return true;
  }
  return false;
};

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
          const [key, val] = c.trim().split('=');
          if (key && val) res[key] = decodeURIComponent(val);
          return res;
        }, {});
        token = cookies.token || cookies.jwt;
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyJwtToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, sharedSpaceId: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const room = `space:${user.sharedSpaceId}`;

    socket.join(room);

    // Track user presence in space
    if (!spaceActiveUsers.has(user.sharedSpaceId)) {
      spaceActiveUsers.set(user.sharedSpaceId, new Set());
    }
    const spaceSet = spaceActiveUsers.get(user.sharedSpaceId);
    spaceSet.add(user.id);

    // Check if partner is already online in this space
    const partnerIsOnline = Array.from(spaceSet).some((id) => id !== user.id);

    // Send immediate room status to newly connected client
    socket.emit('room_status', { isPartnerOnline: partnerIsOnline });

    // Notify partner that this user is online
    socket.to(room).emit('user_online', {
      userId: user.id,
      name: user.name
    });

    // Query online status on request
    socket.on('check_online', () => {
      const isOnline = isPartnerOnlineInSpace(user.sharedSpaceId, user.id);
      socket.emit('room_status', { isPartnerOnline: isOnline });
    });

    // Handle incoming chat message over socket
    socket.on('send_message', async (data, ack) => {
      try {
        const { content, mediaUrl, mediaType, clientTempId } = data;
        const message = await createMessage({
          senderId: user.id,
          sharedSpaceId: user.sharedSpaceId,
          content,
          mediaUrl,
          mediaType
        });

        const payload = {
          ...message,
          clientTempId: clientTempId || null
        };

        io.to(room).emit('new_message', payload);

        if (typeof ack === 'function') {
          ack({ success: true, message: payload });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ success: false, error: err.message });
        }
      }
    });

    // Typing indicators
    socket.on('typing_start', () => {
      socket.to(room).emit('user_typing', {
        userId: user.id,
        name: user.name
      });
    });

    socket.on('typing_stop', () => {
      socket.to(room).emit('user_stop_typing', {
        userId: user.id
      });
    });

    // Read status
    socket.on('mark_read', async () => {
      try {
        await markMessagesAsRead({
          sharedSpaceId: user.sharedSpaceId,
          currentUserId: user.id
        });
        socket.to(room).emit('messages_read', {
          readBy: user.id
        });
      } catch (err) {}
    });

    socket.on('disconnect', async () => {
      // Check if user has any remaining active sockets in this room
      const roomSockets = await io.in(room).fetchSockets();
      const userStillConnected = roomSockets.some((s) => s.user?.id === user.id);

      if (!userStillConnected) {
        const currentSet = spaceActiveUsers.get(user.sharedSpaceId);
        if (currentSet) {
          currentSet.delete(user.id);
          if (currentSet.size === 0) {
            spaceActiveUsers.delete(user.sharedSpaceId);
          }
        }
        socket.to(room).emit('user_offline', {
          userId: user.id
        });
      }
    });
  });

  return io;
};

export const getIO = () => io;
