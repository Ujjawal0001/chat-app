import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/env.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generates server-side signed Cloudinary upload parameters for direct client uploads.
 * IMPORTANT: The API Secret NEVER touches the browser.
 */
export const generateSignedUploadParameters = ({ userId, sharedSpaceId, mediaType = 'auto' }) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `${config.cloudinary.folder}/${sharedSpaceId}`;
  const tags = `togetherspace,space_${sharedSpaceId},user_${userId}`;
  const resourceType = mediaType === 'video' ? 'video' : (mediaType === 'image' ? 'image' : 'auto');

  // Parameters to sign (alphabetical order required by Cloudinary)
  const paramsToSign = {
    folder,
    tags,
    timestamp
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.cloudinary.apiSecret
  );

  return {
    signature,
    timestamp,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
    folder,
    tags,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/${resourceType}/upload`
  };
};

/**
 * Saves a file buffer locally to the server's uploads directory.
 * Used as reliable fallback when Cloudinary is not configured or in local development.
 */
export const saveBufferLocally = async (fileBuffer, { originalname, resourceType = 'image' }) => {
  const ext = originalname ? path.extname(originalname).toLowerCase() : (resourceType === 'video' ? '.mp4' : '.jpg');
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, fileBuffer);

  const mediaUrl = `/uploads/${filename}`;
  return {
    mediaUrl,
    thumbnailUrl: resourceType === 'video' ? null : mediaUrl,
    publicId: `local_${filename}`,
    mediaType: resourceType === 'video' ? 'video' : 'image',
    mimeType: resourceType === 'video' ? 'video/mp4' : 'image/jpeg',
    fileSize: fileBuffer.length
  };
};

/**
 * Uploads a file buffer directly to Cloudinary using streaming.
 */
export const uploadBufferToCloudinary = (fileBuffer, { folder, resourceType = 'auto', originalname }) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        filename_override: originalname,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        let thumbnailUrl = null;
        if (result.resource_type === 'video') {
          thumbnailUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [{ width: 800, crop: 'limit' }]
          });
        }

        resolve({
          mediaUrl: result.secure_url || result.url,
          thumbnailUrl: thumbnailUrl || (result.resource_type === 'image' ? result.secure_url : null),
          publicId: result.public_id,
          mediaType: result.resource_type === 'video' ? 'video' : 'image',
          mimeType: result.format ? `${result.resource_type}/${result.format}` : 'application/octet-stream',
          fileSize: result.bytes
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Unified buffer uploader: Tries Cloudinary first if configured; falls back to local storage seamlessly.
 */
export const uploadBuffer = async (fileBuffer, { folder, resourceType = 'auto', originalname }) => {
  if (isCloudinaryConfigured()) {
    try {
      return await uploadBufferToCloudinary(fileBuffer, { folder, resourceType, originalname });
    } catch (cloudErr) {
      console.warn('[Upload Notice] Cloudinary upload notice, utilizing local storage fallback:', cloudErr.message);
    }
  }

  // Reliable local storage fallback (requires 0 external setup)
  return await saveBufferLocally(fileBuffer, { originalname, resourceType });
};

/**
 * Removes an asset from Cloudinary or local storage by its public ID.
 */
export const removeCloudinaryAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return false;

  if (publicId.startsWith('local_')) {
    const filename = publicId.replace('local_', '');
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  if (!isCloudinaryConfigured()) {
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'video' ? 'video' : 'image'
    });
    return result.result === 'ok';
  } catch (err) {
    console.error(`[Cloudinary Warning] Error deleting asset ${publicId}:`, err);
    return false;
  }
};
