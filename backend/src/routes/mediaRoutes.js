import { Router } from 'express';
import {
  handleListMedia,
  handleGetMediaById,
  handleConfirmUpload,
  handleDeleteMedia,
  handleDownloadMedia,
  handleGetUploadSignature,
  handleDirectUpload
} from '../controllers/mediaController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  listMediaQuerySchema,
  confirmUploadSchema,
  mediaIdParamSchema
} from '../validators/mediaValidator.js';

const router = Router();

// All media endpoints require authentication
router.use(requireAuth);

router.get('/', validateQuery(listMediaQuerySchema), handleListMedia);
router.post('/upload-signature', handleGetUploadSignature);
router.post('/direct-upload', uploadSingle('file'), handleDirectUpload);
router.post('/confirm-upload', validateBody(confirmUploadSchema), handleConfirmUpload);
router.get('/:id', validateParams(mediaIdParamSchema), handleGetMediaById);
router.delete('/:id', validateParams(mediaIdParamSchema), handleDeleteMedia);
router.get('/:id/download', validateParams(mediaIdParamSchema), handleDownloadMedia);

export default router;
