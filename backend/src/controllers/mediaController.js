import {
  listMedia,
  getMediaById,
  createMediaRecord,
  deleteMedia,
  getMediaDownloadUrl
} from '../services/mediaService.js';
import { sendSuccess, sendError } from '../utils/response.js';

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
