import {
  addFavorite,
  removeFavorite,
  listFavorites
} from '../services/favoriteService.js';
import { sendSuccess } from '../utils/response.js';

export const handleAddFavorite = async (req, res, next) => {
  try {
    const result = await addFavorite({
      userId: req.user.id,
      mediaId: req.params.mediaId,
      sharedSpaceId: req.sharedSpaceId
    });
    return sendSuccess(res, result, 'Added to favorites');
  } catch (err) {
    next(err);
  }
};

export const handleRemoveFavorite = async (req, res, next) => {
  try {
    const result = await removeFavorite({
      userId: req.user.id,
      mediaId: req.params.mediaId,
      sharedSpaceId: req.sharedSpaceId
    });
    return sendSuccess(res, result, 'Removed from favorites');
  } catch (err) {
    next(err);
  }
};

export const handleListFavorites = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listFavorites({
      userId: req.user.id,
      sharedSpaceId: req.sharedSpaceId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
    });
    return sendSuccess(res, result, 'Favorite media retrieved');
  } catch (err) {
    next(err);
  }
};
