import { sendError } from '../utils/response.js';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMap = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.') || 'body';
        errorMap[field] = err.message;
      });
      return sendError(res, 'Validation failed', 400, errorMap);
    }
    req.body = result.data;
    next();
  };
};
