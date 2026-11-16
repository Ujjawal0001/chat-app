import { getSpaceUsers } from '../services/userService.js';
import { sendSuccess } from '../utils/response.js';

export const handleGetUsers = async (req, res, next) => {
  try {
    const data = await getSpaceUsers({
      sharedSpaceId: req.sharedSpaceId
    });
    return sendSuccess(res, data, 'Space users and stats retrieved');
  } catch (err) {
    next(err);
  }
};
