const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  submitBooking, getMyBookings, getAllBookings, getBookingById,
  updateBookingStatus, assignTeam, deleteBooking, getBookingStats,
} = require('../controllers/bookingController');

router.get('/stats',        verifyToken, adminOnly, getBookingStats);
router.get('/my',           verifyToken, getMyBookings);
router.get('/',             verifyToken, adminOnly, getAllBookings);
router.get('/:id',          verifyToken, getBookingById);
router.post('/',            optionalAuth, submitBooking);
router.put('/:id/status',   verifyToken, adminOnly, updateBookingStatus);
router.put('/:id/assign',   verifyToken, adminOnly, assignTeam);
router.delete('/:id',       verifyToken, adminOnly, deleteBooking);

module.exports = router;
