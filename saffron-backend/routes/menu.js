const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getAllMenuItems, getMenuItemById, getMenuByCategory,
  createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemStatus, getMenuStats,
} = require('../controllers/menuController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/menu';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `menu-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error('Images only'));
  },
});

router.get('/stats',            verifyToken, adminOnly, getMenuStats);
router.get('/category/:category', getMenuByCategory);
router.get('/',                 getAllMenuItems);
router.get('/:id',              getMenuItemById);
router.post('/',                verifyToken, adminOnly, upload.single('image'), createMenuItem);
router.put('/:id',              verifyToken, adminOnly, upload.single('image'), updateMenuItem);
router.patch('/:id/toggle',     verifyToken, adminOnly, toggleMenuItemStatus);
router.delete('/:id',           verifyToken, adminOnly, deleteMenuItem);

module.exports = router;
