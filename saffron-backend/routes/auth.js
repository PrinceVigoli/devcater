const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { handleUpload } = require('../middleware/uploadHandler');
const {
  register, login, getMe, updateProfile,
  changePassword, updateAvatar, getAllUsers, deleteUser,
} = require('../controllers/authController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               verifyToken, getMe);
router.put('/profile',          verifyToken, updateProfile);
router.put('/password',         verifyToken, changePassword);
router.put('/avatar',           verifyToken, handleUpload(upload.single('avatar')), updateAvatar);
router.get('/users',            verifyToken, adminOnly, getAllUsers);
router.delete('/users/:id',     verifyToken, adminOnly, deleteUser);

module.exports = router;