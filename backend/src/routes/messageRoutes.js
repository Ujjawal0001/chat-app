import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  handleGetMessages,
  handleGetChatStatus,
  handleSendMessage,
  handleMarkAsRead,
  handleDeleteMessage
} from '../controllers/messageController.js';

const router = Router();

// All message routes require valid authentication
router.use(requireAuth);

router.get('/', handleGetMessages);
router.get('/status', handleGetChatStatus);
router.post('/', handleSendMessage);
router.put('/read', handleMarkAsRead);
router.delete('/:id', handleDeleteMessage);

export default router;
