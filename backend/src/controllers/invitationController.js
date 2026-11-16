import {
  generateNewInvitation,
  getSystemAuthStatus
} from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Generate a new invitation code.
 * POST /api/invitations
 * (Requires authentication)
 */
export const handleCreateInvitation = async (req, res, next) => {
  try {
    const { expiresInDays } = req.body;
    const result = await generateNewInvitation({
      userId: req.user.id,
      expiresInDays
    });

    return sendSuccess(
      res,
      result,
      'New single-use invitation code generated successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get registration and invitation status.
 * GET /api/invitations/status
 * (Public endpoint - so landing/invite pages know system state)
 */
export const handleGetInvitationStatus = async (req, res, next) => {
  try {
    const status = await getSystemAuthStatus();
    return sendSuccess(res, status, 'System invitation status');
  } catch (err) {
    next(err);
  }
};
