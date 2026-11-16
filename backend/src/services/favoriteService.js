import prisma from '../config/db.js';
import { formatMediaItem } from './mediaService.js';

/**
 * Adds a media item to current user's favorites.
 */
export const addFavorite = async ({ userId, mediaId, sharedSpaceId }) => {
  // Verify media exists in user's shared space
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });

  if (!media || media.sharedSpaceId !== sharedSpaceId) {
    const err = new Error('Media not found.');
    err.statusCode = 404;
    throw err;
  }

  // Idempotent upsert to prevent duplicate errors
  await prisma.favorite.upsert({
    where: {
      userId_mediaId: {
        userId,
        mediaId
      }
    },
    create: {
      userId,
      mediaId
    },
    update: {}
  });

  return { mediaId, isFavorite: true };
};

/**
 * Removes a media item from current user's favorites.
 */
export const removeFavorite = async ({ userId, mediaId, sharedSpaceId }) => {
  try {
    await prisma.favorite.delete({
      where: {
        userId_mediaId: {
          userId,
          mediaId
        }
      }
    });
  } catch (err) {
    // If not found in favorites, treat as already removed (idempotent)
    if (err.code !== 'P2025') {
      throw err;
    }
  }

  return { mediaId, isFavorite: false };
};

/**
 * Lists all favorited media for the current user.
 */
export const listFavorites = async ({ userId, sharedSpaceId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    media: {
      sharedSpaceId
    }
  };

  const [total, favorites] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
            },
            favorites: {
              where: { userId },
              select: { userId: true }
            }
          }
        }
      }
    })
  ]);

  const items = favorites.map((fav) => formatMediaItem(fav.media, userId));
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    }
  };
};
