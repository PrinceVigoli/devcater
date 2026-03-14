const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// ─── CONFIGURE CLOUDINARY ─────────────────────────────────────────────────────
// Supports CLOUDINARY_URL (full string) OR individual vars
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('⚠️  Cloudinary not configured - image uploads will be disabled');
}

// ─── MULTER STORAGE → uploads directly to Cloudinary ─────────────────────────
const createUpload = (folder) => {
  if (!cloudinaryConfigured) {
    // Fallback: memory storage, no actual upload
    return multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  }
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          `saffron/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
    },
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
};

// ─── DELETE FROM CLOUDINARY ───────────────────────────────────────────────────
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary')) return;
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (match) await cloudinary.uploader.destroy(match[1]);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, createUpload, deleteImage };