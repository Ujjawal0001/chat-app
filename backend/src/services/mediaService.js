import prisma from '../config/db.js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

// Configure Cloudinary SDK
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

/**
 * Transforms a media record to attach `isFavorite` and sanitized uploader info.
 */
export const formatMediaItem = (item, currentUserId) => {
  const isFavorite = item.favorites ? item.favorites.some((f) => f.userId === currentUserId) : false;
  const { favorites, uploadedBy, ...mediaFields } = item;

  return {
    ...mediaFields,
    isFavorite,
    uploader: uploadedBy
      ? {
          id: uploadedBy.id,
          name: uploadedBy.name,
          email: uploadedBy.email
        }
      : null
  };
};

/**
 * Lists shared gallery media with filtering, search, and pagination.
 */
export const listMedia = async ({
  sharedSpaceId,
  currentUserId,
  mediaType = 'all',
  search,
  startDate,
  endDate,
  favoritesOnly = false,
  page = 1,
  limit = 20
}) => {
  const where = {
    sharedSpaceId
  };

  // Filter by media type
  if (mediaType && mediaType !== 'all') {
    where.mediaType = mediaType;
  }

  // Filter by search query (title or description)
  if (search && search.trim() !== '') {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } }
    ];
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      // If date string without time, include full end of day
      if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        end.setHours(23, 59, 59, 999);
      }
      where.createdAt.lte = end;
    }
  }

  // Filter by current user's favorites
  if (favoritesOnly) {
    where.favorites = {
      some: {
        userId: currentUserId
      }
    };
  }

  const skip = (page - 1) * limit;

  // Run count and query in parallel
  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        favorites: {
          where: { userId: currentUserId },
          select: { userId: true }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: items.map((item) => formatMediaItem(item, currentUserId)),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    }
  };
};

/**
 * Retrieves a single media item by ID.
 */
export const getMediaById = async ({ mediaId, sharedSpaceId, currentUserId }) => {
  const item = await prisma.media.findUnique({
    where: { id: mediaId },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true }
      },
      favorites: {
        where: { userId: currentUserId },
        select: { userId: true }
      }
    }
  });

  if (!item || item.sharedSpaceId !== sharedSpaceId) {
    const err = new Error('Media not found.');
    err.statusCode = 404;
    throw err;
  }

  return formatMediaItem(item, currentUserId);
};

/**
 * Confirms an uploaded asset and creates a Media record in PostgreSQL.
 */
export const createMediaRecord = async ({
  sharedSpaceId,
  uploadedById,
  title,
  description,
  mediaUrl,
  thumbnailUrl,
  publicId,
  mediaType,
  mimeType,
  fileSize
}) => {
  const media = await prisma.media.create({
    data: {
      title: title || null,
      description: description || null,
      mediaUrl,
      thumbnailUrl: thumbnailUrl || null,
      publicId,
      mediaType,
      mimeType,
      fileSize,
      uploadedById,
      sharedSpaceId
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return formatMediaItem(media, uploadedById);
};

/**
 * Deletes a media asset.
 * STRICT SECURITY REQUIREMENT:
 * Both users can view shared media, but ONLY the original uploader can delete it.
 */
export const deleteMedia = async ({ mediaId, sharedSpaceId, userId }) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });

  if (!media || media.sharedSpaceId !== sharedSpaceId) {
    const err = new Error('Media not found.');
    err.statusCode = 404;
    throw err;
  }

  // Strict ownership check
  if (media.uploadedById !== userId) {
    const err = new Error('Unauthorized. You can only delete media that you uploaded.');
    err.statusCode = 403;
    err.code = 'NOT_MEDIA_OWNER';
    throw err;
  }

  // Delete from database
  await prisma.media.delete({
    where: { id: mediaId }
  });

  // Remove asset from Cloudinary in background (if configured)
  if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret && media.publicId) {
    try {
      const resourceType = media.mediaType === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType });
    } catch (cloudErr) {
      console.error(`[Cloudinary Warning] Failed to delete asset ${media.publicId}:`, cloudErr);
    }
  }

  return true;
};

/**
 * Gets media download URL.
 */
export const getMediaDownloadUrl = async ({ mediaId, sharedSpaceId }) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });

  if (!media || media.sharedSpaceId !== sharedSpaceId) {
    const err = new Error('Media not found.');
    err.statusCode = 404;
    throw err;
  }

  return {
    url: media.mediaUrl,
    title: media.title || `togetherspace-${media.id}`,
    mediaType: media.mediaType,
    mimeType: media.mimeType
  };
};
