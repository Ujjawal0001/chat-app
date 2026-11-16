import { Router } from 'express';
import {
  handleAddFavorite,
  handleRemoveFavorite,
  handleListFavorites
} from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateParams } from '../middleware/validate.js';
import { favoriteParamSchema } from '../validators/mediaValidator.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleListFavorites);
router.post('/:mediaId', validateParams(favoriteParamSchema), handleAddFavorite);
router.delete('/:mediaId', validateParams(favoriteParamSchema), handleRemoveFavorite);

export default router;
