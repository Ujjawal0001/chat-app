import { Server } from 'socket.io';
import { verifyJwtToken } from '../utils/token.js';
import prisma from '../config/db.js';
import { createMessage, markMessagesAsRead } from './messageService.js';

let io = null;

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
      // 1. Try extracting token from handshake auth or headers
      let token = socket.handshake.auth?.token;

      // 2. Fallback to cookie parser in handshake headers
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

    // Join space room
    socket.join(room);

    // Notify partner that user is online
    socket.to(room).emit('user_online', {
      userId: user.id,
      name: user.name
    });

    // Handle incoming chat message over socket
    socket.on('send_message', async (data, ack) => {
      try {
        const { content, mediaUrl, mediaType } = data;
        const message = await createMessage({
          senderId: user.id,
          sharedSpaceId: user.sharedSpaceId,
          content,
          mediaUrl,
          mediaType
        });

        // Broadcast to space room
        io.to(room).emit('new_message', message);

        if (typeof ack === 'function') {
          ack({ success: true, message });
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

    socket.on('disconnect', () => {
      socket.to(room).emit('user_offline', {
        userId: user.id
      });
    });
  });

  return io;
};

export const getIO = () => io;
