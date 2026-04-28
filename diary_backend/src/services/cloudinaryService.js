const cloudinary = require('cloudinary').v2;
const logger = require('../lib/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generates a signed URL for a specific resource
 * @param {string} publicId - The Cloudinary public ID
 */
const getSignedUrl = (publicId) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      // You can add expiration or other transformations here
    });
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Uploads a file to Cloudinary
 * @param {string} filePath - Path to local file
 * @param {string} folder - Destination folder
 */
const uploadMedia = async (filePath, folder = 'photodiary') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // Detects image/video
    });
    return result;
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = {
  getSignedUrl,
  uploadMedia,
};
