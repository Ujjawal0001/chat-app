import prisma from '../config/db.js';

/**
 * Get messages for the shared space.
 * Retrieves messages in chronological order.
 */
export const getMessages = async ({ sharedSpaceId, limit = 100, before = null }) => {
  const where = {
    sharedSpaceId
  };

  if (before) {
    where.createdAt = {
      lt: new Date(before)
    };
  }

  const messages = await prisma.message.findMany({
    where,
    take: limit,
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return messages;
};

/**
 * Create and persist a new chat message.
 */
export const createMessage = async ({ senderId, sharedSpaceId, content, mediaUrl = null, mediaType = null }) => {
  const message = await prisma.message.create({
    data: {
      content: content ? content.trim() : '',
      mediaUrl,
      mediaType,
      senderId,
      sharedSpaceId
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return message;
};

/**
 * Mark unread messages as read by the recipient.
 */
export const markMessagesAsRead = async ({ sharedSpaceId, currentUserId }) => {
  const result = await prisma.message.updateMany({
    where: {
      sharedSpaceId,
      senderId: {
        not: currentUserId
      },
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return { updatedCount: result.count };
};

/**
 * Delete a message (only allowed by the original sender).
 */
export const deleteMessage = async ({ messageId, userId, sharedSpaceId }) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId }
  });

  if (!message) {
    const err = new Error('Message not found.');
    err.statusCode = 404;
    throw err;
  }

  if (message.sharedSpaceId !== sharedSpaceId) {
    const err = new Error('Unauthorized.');
    err.statusCode = 403;
    throw err;
  }

  if (message.senderId !== userId) {
    const err = new Error('You can only delete messages sent by yourself.');
    err.statusCode = 403;
    throw err;
  }

  await prisma.message.delete({
    where: { id: messageId }
  });

  return { id: messageId, deleted: true };
};
