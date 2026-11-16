import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true
});

/**
 * Checks if Cloudinary is configured with valid credentials.
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret &&
    config.cloudinary.apiKey !== '123456789012345'
  );
};

export default cloudinary;
