import {
  getMessages,
  createMessage,
  markMessagesAsRead,
  deleteMessage
} from '../services/messageService.js';
import { getIO } from '../services/socketService.js';
import { sendSuccess } from '../utils/response.js';

export const handleGetMessages = async (req, res, next) => {
  try {
    const { limit, before } = req.query;
    const messages = await getMessages({
      sharedSpaceId: req.user.sharedSpaceId,
      limit: limit ? parseInt(limit, 10) : 100,
      before
    });

    return sendSuccess(res, messages, 'Messages retrieved');
  } catch (err) {
    next(err);
  }
};

export const handleSendMessage = async (req, res, next) => {
  try {
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media attachment is required.'
      });
    }

    const message = await createMessage({
      senderId: req.user.id,
      sharedSpaceId: req.user.sharedSpaceId,
      content,
      mediaUrl,
      mediaType
    });

    // Broadcast in real-time via Socket.IO if available
    try {
      const io = getIO();
      if (io) {
        io.to(`space:${req.user.sharedSpaceId}`).emit('new_message', message);
      }
    } catch (socketErr) {
      // Socket emission is best effort
    }

    return sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const handleMarkAsRead = async (req, res, next) => {
  try {
    const result = await markMessagesAsRead({
      sharedSpaceId: req.user.sharedSpaceId,
      currentUserId: req.user.id
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`space:${req.user.sharedSpaceId}`).emit('messages_read', {
          readBy: req.user.id,
          sharedSpaceId: req.user.sharedSpaceId
        });
      }
    } catch (socketErr) {}

    return sendSuccess(res, result, 'Messages marked as read');
  } catch (err) {
    next(err);
  }
};

export const handleDeleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteMessage({
      messageId: id,
      userId: req.user.id,
      sharedSpaceId: req.user.sharedSpaceId
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`space:${req.user.sharedSpaceId}`).emit('message_deleted', {
          messageId: id,
          deletedBy: req.user.id
        });
      }
    } catch (socketErr) {}

    return sendSuccess(res, result, 'Message deleted');
  } catch (err) {
    next(err);
  }
};
