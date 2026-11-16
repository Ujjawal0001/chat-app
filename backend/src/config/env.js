import dotenv from 'dotenv';
dotenv.config();

// Ensure DIRECT_URL defaults to DATABASE_URL if not explicitly set (e.g. on Render/Neon)
// or if it was mistakenly set to localhost while DATABASE_URL points to a cloud database
if (
  process.env.DATABASE_URL &&
  (!process.env.DIRECT_URL ||
    ((process.env.DIRECT_URL.includes('localhost') || process.env.DIRECT_URL.includes('127.0.0.1')) &&
      !process.env.DATABASE_URL.includes('localhost') &&
      !process.env.DATABASE_URL.includes('127.0.0.1')))
) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'temporary_dev_secret_change_in_production_min32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  },
  initialSetupSecret: process.env.INITIAL_SETUP_SECRET || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'togetherspace'
  },
  mediaLimits: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_FILE_SIZE || '20971520', 10), // 20 MB
    maxVideoSize: parseInt(process.env.MAX_VIDEO_FILE_SIZE || '104857600', 10)  // 100 MB
  }
};
