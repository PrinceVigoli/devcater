const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getAllPosts, getAdminAllPosts, getPostBySlug,
  createPost, updatePost, deletePost,
} = require('../controllers/blogController');

router.get('/admin/all',    verifyToken, adminOnly, getAdminAllPosts);
router.get('/',             getAllPosts);
router.get('/:slug',        getPostBySlug);
router.post('/',            verifyToken, adminOnly, createPost);
router.put('/:id',          verifyToken, adminOnly, updatePost);
router.delete('/:id',       verifyToken, adminOnly, deletePost);

module.exports = router;
