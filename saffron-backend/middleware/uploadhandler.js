// ─── WRAPS MULTER UPLOAD TO CATCH ERRORS PROPERLY ────────────────────────────
// Multer errors don't pass through Express error handlers automatically.
// This wrapper catches them and returns clean JSON responses.

const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    // File too large
    if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    // Wrong file type
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message?.includes('Images only')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed (JPG, PNG, WEBP).' });
    }
    // Cloudinary not configured
    if (err.message?.includes('CLOUDINARY_URL') || err.message?.includes('not configured')) {
      return res.status(400).json({ success: false, message: 'Image uploads not configured. Please add an image URL instead, or contact the admin.' });
    }
    // Any other multer/upload error
    console.error('Upload error:', err.message);
    return res.status(400).json({ success: false, message: `Upload failed: ${err.message}` });
  });
};

module.exports = { handleUpload };