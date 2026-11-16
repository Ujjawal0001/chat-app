import { config } from '../config/env.js';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif'
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/ogg'
];

export const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif',
  'mp4', 'webm', 'mov', 'mkv', 'ogg'
];

/**
 * Validates a file's MIME type and size.
 */
export const validateFileMetadata = (mimeType, fileSize, originalname = '') => {
  const normalizedMime = (mimeType || '').toLowerCase().trim();
  const ext = originalname ? originalname.split('.').pop()?.toLowerCase() : null;

  // Check extension if available
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `File extension .${ext} is not supported. Please upload supported images or videos.`
    };
  }

  // Check if image
  if (ALLOWED_IMAGE_MIME_TYPES.includes(normalizedMime)) {
    if (fileSize > config.mediaLimits.maxImageSize) {
      const maxMb = Math.round(config.mediaLimits.maxImageSize / (1024 * 1024));
      return {
        isValid: false,
        error: `Image exceeds maximum permitted size of ${maxMb}MB.`
      };
    }
    return { isValid: true, mediaType: 'image' };
  }

  // Check if video
  if (ALLOWED_VIDEO_MIME_TYPES.includes(normalizedMime)) {
    if (fileSize > config.mediaLimits.maxVideoSize) {
      const maxMb = Math.round(config.mediaLimits.maxVideoSize / (1024 * 1024));
      return {
        isValid: false,
        error: `Video exceeds maximum permitted size of ${maxMb}MB.`
      };
    }
    return { isValid: true, mediaType: 'video' };
  }

  return {
    isValid: false,
    error: `Unsupported file type: ${mimeType}. Only high-resolution images and videos are supported.`
  };
};
