const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  createPayment, getAllPayments, getMyPayments,
  updatePaymentStatus, getPaymentById,
} = require('../controllers/paymentController');

router.get('/my',           verifyToken, getMyPayments);
router.get('/',             verifyToken, adminOnly, getAllPayments);
router.get('/:id',          verifyToken, getPaymentById);
router.post('/',            verifyToken, createPayment);
router.put('/:id/status',   verifyToken, adminOnly, updatePaymentStatus);

module.exports = router;
