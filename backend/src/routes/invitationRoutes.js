import { Router } from 'express';
import {
  handleCreateInvitation,
  handleGetInvitationStatus
} from '../controllers/invitationController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createInvitationSchema } from '../validators/authValidator.js';

const router = Router();

router.get('/status', handleGetInvitationStatus);
router.post('/', requireAuth, validateBody(createInvitationSchema), handleCreateInvitation);

export default router;
