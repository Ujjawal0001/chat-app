import { verifyJwtToken } from '../utils/token.js';
import { sendError } from '../utils/response.js';
import prisma from '../config/db.js';
import { sanitizeUser } from '../services/authService.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Also support Authorization: Bearer <token> header for flexibility
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyJwtToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return sendError(res, 'Session has expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    // Retrieve user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { sharedSpace: true }
    });

    if (!user) {
      return sendError(res, 'Account no longer exists.', 401);
    }

    req.user = sanitizeUser(user);
    req.sharedSpaceId = user.sharedSpaceId;
    next();
  } catch (err) {
    next(err);
  }
};
