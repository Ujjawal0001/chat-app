import {
  listMedia,
  getMediaById,
  createMediaRecord,
  deleteMedia,
  getMediaDownloadUrl
} from '../services/mediaService.js';
import {
  generateSignedUploadParameters,
  uploadBuffer,
  uploadBufferToCloudinary
} from '../services/uploadService.js';
import { validateFileMetadata } from '../utils/fileValidation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';

/**
 * Generates server-side signed parameters for direct browser-to-Cloudinary upload.
 * POST /api/media/upload-signature
 */
export const handleGetUploadSignature = async (req, res, next) => {
  try {
    const { mediaType } = req.body || {};
    const signatureData = generateSignedUploadParameters({
      userId: req.user.id,
      sharedSpaceId: req.sharedSpaceId,
      mediaType: mediaType || 'auto'
    });

    return sendSuccess(res, signatureData, 'Upload signature generated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Fallback server-side upload endpoint using Multer streaming directly to Cloudinary.
 * POST /api/media/direct-upload
 */
export const handleDirectUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No media file provided for upload.', 400);
    }

    // Validate file
    const validation = validateFileMetadata(req.file.mimetype, req.file.size, req.file.originalname);
    if (!validation.isValid) {
      return sendError(res, validation.error, 400);
    }

    const folder = `${config.cloudinary.folder}/${req.sharedSpaceId}`;
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder,
      resourceType: validation.mediaType === 'video' ? 'video' : 'image',
      originalname: req.file.originalname
    });

    // Create record in PostgreSQL
    const item = await createMediaRecord({
      sharedSpaceId: req.sharedSpaceId,
      uploadedById: req.user.id,
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      description: req.body.description || null,
      ...uploadResult
    });

    return sendSuccess(res, {
      media: item,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType
    }, 'Media uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const handleListMedia = async (req, res, next) => {
  try {
    const result = await listMedia({
      sharedSpaceId: req.sharedSpaceId,
      currentUserId: req.user.id,
      ...req.query
    });
    return sendSuccess(res, result, 'Media items retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const handleGetMediaById = async (req, res, next) => {
  try {
    const item = await getMediaById({
      mediaId: req.params.id,
      sharedSpaceId: req.sharedSpaceId,
      currentUserId: req.user.id
    });
    return sendSuccess(res, { media: item }, 'Media details retrieved');
  } catch (err) {
    next(err);
  }
};

export const handleConfirmUpload = async (req, res, next) => {
  try {
    const item = await createMediaRecord({
      sharedSpaceId: req.sharedSpaceId,
      uploadedById: req.user.id,
      ...req.body
    });
    return sendSuccess(res, { media: item }, 'Media uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const handleDeleteMedia = async (req, res, next) => {
  try {
    await deleteMedia({
      mediaId: req.params.id,
      sharedSpaceId: req.sharedSpaceId,
      userId: req.user.id
    });
    return sendSuccess(res, null, 'Media deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const handleDownloadMedia = async (req, res, next) => {
  try {
    const download = await getMediaDownloadUrl({
      mediaId: req.params.id,
      sharedSpaceId: req.sharedSpaceId
    });

    // Provide download direct redirect or metadata URL
    return sendSuccess(res, download, 'Download URL generated');
  } catch (err) {
    next(err);
  }
};
