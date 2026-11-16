import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error in non-test environments
  if (config.nodeEnv !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return sendError(
    res,
    message,
    statusCode,
    config.isProduction ? null : err.stack
  );
};
