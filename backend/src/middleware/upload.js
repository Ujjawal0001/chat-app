import multer from 'multer';
import { validateFileMetadata } from '../utils/fileValidation.js';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const validation = validateFileMetadata(file.mimetype, 0, file.originalname);
  if (!validation.isValid && validation.error && !validation.error.includes('exceeds maximum permitted size')) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.mediaLimits.maxVideoSize, // upper limit for single file
    files: 10 // max 10 files per batch
  }
});

export const uploadSingle = (fieldName = 'file') => {
  const handler = upload.single(fieldName);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, `File is too large. Maximum size is ${Math.round(config.mediaLimits.maxVideoSize / (1024 * 1024))}MB.`, 400);
        }
        return sendError(res, `Upload error: ${err.message}`, 400);
      } else if (err) {
        return sendError(res, err.message, err.statusCode || 400);
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  const handler = upload.array(fieldName, maxCount);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'One of the files exceeds the maximum size limit.', 400);
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, `Too many files. Maximum allowed is ${maxCount}.`, 400);
        }
        return sendError(res, `Upload error: ${err.message}`, 400);
      } else if (err) {
        return sendError(res, err.message, err.statusCode || 400);
      }
      next();
    });
  };
};

export default upload;
