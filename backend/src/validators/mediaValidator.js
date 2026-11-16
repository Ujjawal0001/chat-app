import { z } from 'zod';

export const listMediaQuerySchema = z.object({
  mediaType: z.enum(['all', 'image', 'video']).optional().default('all'),
  search: z.string().trim().optional(),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  favoritesOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional().default(false)),
  page: z.preprocess((val) => parseInt(val || '1', 10), z.number().int().min(1).optional().default(1)),
  limit: z.preprocess((val) => parseInt(val || '20', 10), z.number().int().min(1).max(100).optional().default(20))
});

export const confirmUploadSchema = z.object({
  title: z.string().trim().max(100, 'Title cannot exceed 100 characters').optional().nullable(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  mediaUrl: z.string().url('Invalid media URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
  publicId: z.string().trim().min(1, 'Cloudinary publicId is required'),
  mediaType: z.enum(['image', 'video'], { required_error: 'mediaType must be image or video' }),
  mimeType: z.string().trim().min(1, 'MIME type is required'),
  fileSize: z.number().int().positive('fileSize must be a positive integer')
});

export const mediaIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Media ID is required')
});

export const favoriteParamSchema = z.object({
  mediaId: z.string().trim().min(1, 'Media ID is required')
});
