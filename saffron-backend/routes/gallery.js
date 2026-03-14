const express = require('express');
const router  = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { createUpload } = require('../config/cloudinary');
const { handleUpload } = require('../middleware/uploadHandler');
const { getAllImages, uploadImage, updateImage, deleteImage } = require('../controllers/galleryController');

const upload = createUpload('gallery');
const uploadSingle = handleUpload(upload.single('image'));

router.get('/',       getAllImages);
router.post('/',      verifyToken, adminOnly, uploadSingle, uploadImage);
router.put('/:id',    verifyToken, adminOnly, updateImage);
router.delete('/:id', verifyToken, adminOnly, deleteImage);

module.exports = router;