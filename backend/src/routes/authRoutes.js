import { Router } from 'express';
import {
  handleSetup,
  handleAcceptInvite,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleChangePassword
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  setupSchema,
  acceptInviteSchema,
  loginSchema,
  changePasswordSchema
} from '../validators/authValidator.js';

const router = Router();

router.post('/setup', validateBody(setupSchema), handleSetup);
router.post('/accept-invite', validateBody(acceptInviteSchema), handleAcceptInvite);
router.post('/login', validateBody(loginSchema), handleLogin);
router.post('/logout', handleLogout);
router.get('/me', requireAuth, handleGetMe);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), handleChangePassword);

export default router;
