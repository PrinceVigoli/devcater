const express = require('express');
const router  = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { createUpload } = require('../config/cloudinary');
const {
  getAllMenuItems, getMenuItemById, getMenuByCategory,
  createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemStatus, getMenuStats,
} = require('../controllers/menuController');

const upload = createUpload('menu');

router.get('/stats',              verifyToken, adminOnly, getMenuStats);
router.get('/category/:category', getMenuByCategory);
router.get('/',                   getAllMenuItems);
router.get('/:id',                getMenuItemById);
router.post('/',                  verifyToken, adminOnly, upload.single('image'), createMenuItem);
router.put('/:id',                verifyToken, adminOnly, upload.single('image'), updateMenuItem);
router.patch('/:id/toggle',       verifyToken, adminOnly, toggleMenuItemStatus);
router.delete('/:id',             verifyToken, adminOnly, deleteMenuItem);

module.exports = router;