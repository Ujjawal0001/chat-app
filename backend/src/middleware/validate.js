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

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errorMap = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.') || 'query';
        errorMap[field] = err.message;
      });
      return sendError(res, 'Query validation failed', 400, errorMap);
    }
    req.query = result.data;
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errorMap = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.') || 'params';
        errorMap[field] = err.message;
      });
      return sendError(res, 'Parameter validation failed', 400, errorMap);
    }
    req.params = result.data;
    next();
  };
};
