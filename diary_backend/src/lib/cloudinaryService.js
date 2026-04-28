const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMedia = async (fileBuffer, folder = 'photodiary/media') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        // In a real production app, we would use signed URLs for access control
        // For this platform, we'll use secure transport
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type,
            format: result.format,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteMedia = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary Deletion Error:', error);
  }
};

module.exports = {
  uploadMedia,
  deleteMedia,
};
