const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getAllCustomers, getCustomerById, updateCustomerStatus,
  getDashboardStats, deleteCustomer,
} = require('../controllers/customerController');

router.get('/stats/dashboard',  verifyToken, adminOnly, getDashboardStats);
router.get('/',                 verifyToken, adminOnly, getAllCustomers);
router.get('/:id',              verifyToken, adminOnly, getCustomerById);
router.put('/:id/status',       verifyToken, adminOnly, updateCustomerStatus);
router.delete('/:id',           verifyToken, adminOnly, deleteCustomer);

module.exports = router;
