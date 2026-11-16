import {
  setupOwnerAccount,
  acceptInvitation,
  loginUser,
  changeUserPassword
} from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getSessionCookieOptions, getClearCookieOptions } from '../utils/cookies.js';

/**
 * Step 1: Initial owner account setup.
 * POST /api/auth/setup
 */
export const handleSetup = async (req, res, next) => {
  try {
    const { name, email, password, setupSecret } = req.body;
    const result = await setupOwnerAccount({ name, email, password, setupSecret });

    // Set secure HTTP-only session cookie
    res.cookie('token', result.jwtToken, getSessionCookieOptions());

    return sendSuccess(
      res,
      {
        user: result.user,
        invitationCode: result.invitationCode,
        invitationExpiresAt: result.invitationExpiresAt
      },
      'Initial setup successful! Share your unique invitation code with your partner.',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Step 4: Accept invitation code and create second account.
 * POST /api/auth/accept-invite
 */
export const handleAcceptInvite = async (req, res, next) => {
  try {
    const { token, name, email, password } = req.body;
    const result = await acceptInvitation({ token, name, email, password });

    // Set secure HTTP-only session cookie
    res.cookie('token', result.jwtToken, getSessionCookieOptions());

    return sendSuccess(
      res,
      { user: result.user },
      'Welcome to TogetherSpace! Registration is now permanently closed.',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * User login.
 * POST /api/auth/login
 */
export const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    res.cookie('token', result.jwtToken, getSessionCookieOptions());

    return sendSuccess(
      res,
      { user: result.user },
      'Logged in successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * User logout.
 * POST /api/auth/logout
 */
export const handleLogout = async (req, res) => {
  res.clearCookie('token', getClearCookieOptions());
  return sendSuccess(res, null, 'Logged out successfully');
};

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 */
export const handleGetMe = async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Current session profile');
};

/**
 * Change current user password.
 * POST /api/auth/change-password
 */
export const handleChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await changeUserPassword({
      userId: req.user.id,
      currentPassword,
      newPassword
    });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};
