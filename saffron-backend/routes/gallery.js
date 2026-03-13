const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { getAllImages, uploadImage, updateImage, deleteImage } = require('../controllers/galleryController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/gallery';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `gallery-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/',             getAllImages);
router.post('/',            verifyToken, adminOnly, upload.single('image'), uploadImage);
router.put('/:id',          verifyToken, adminOnly, updateImage);
router.delete('/:id',       verifyToken, adminOnly, deleteImage);

module.exports = router;
