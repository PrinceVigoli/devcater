const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  placeOrder, getMyOrders, getAllOrders, getOrderById,
  updateOrderStatus, cancelOrder, deleteOrder, getOrderStats,
} = require('../controllers/orderController');

router.get('/stats',        verifyToken, adminOnly, getOrderStats);
router.get('/my',           verifyToken, getMyOrders);
router.get('/',             verifyToken, adminOnly, getAllOrders);
router.get('/:id',          verifyToken, getOrderById);
router.post('/',            optionalAuth, placeOrder);
router.put('/:id/status',   verifyToken, adminOnly, updateOrderStatus);
router.put('/:id/cancel',   verifyToken, cancelOrder);
router.delete('/:id',       verifyToken, adminOnly, deleteOrder);

module.exports = router;
