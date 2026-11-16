import prisma from '../config/db.js';
import { sanitizeUser } from './authService.js';

/**
 * Retrieves the profiles and stats of both users in the shared space.
 */
export const getSpaceUsers = async ({ sharedSpaceId }) => {
  const users = await prisma.user.findMany({
    where: { sharedSpaceId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          uploadedMedia: true,
          favorites: true
        }
      }
    }
  });

  // Calculate space-wide statistics
  const [totalPhotos, totalVideos] = await Promise.all([
    prisma.media.count({
      where: { sharedSpaceId, mediaType: 'image' }
    }),
    prisma.media.count({
      where: { sharedSpaceId, mediaType: 'video' }
    })
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      joinedAt: u.createdAt,
      totalUploads: u._count.uploadedMedia,
      totalFavorites: u._count.favorites
    })),
    stats: {
      totalPhotos,
      totalVideos,
      totalMedia: totalPhotos + totalVideos
    }
  };
};
