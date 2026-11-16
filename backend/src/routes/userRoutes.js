import { Router } from 'express';
import { handleGetUsers } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', handleGetUsers);

export default router;
