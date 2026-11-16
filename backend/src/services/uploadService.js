import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/env.js';

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
 * Uploads a file buffer directly to Cloudinary using streaming.
 * Generates video poster thumbnails automatically where supported.
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
          // Cloudinary generates video poster thumbnails by transforming or replacing the extension
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
 * Removes an asset from Cloudinary by its public ID.
 */
export const removeCloudinaryAsset = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured() || !publicId) {
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
