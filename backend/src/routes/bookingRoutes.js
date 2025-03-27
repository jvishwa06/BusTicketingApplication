const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const { authenticateOperatorandUser } = require('../middleware/authMiddleware');

router.use(authenticateOperatorandUser);

router.get('/trips/:tripId', BookingController.getTripBookings);
router.put('/:id/status', BookingController.updateBookingStatus);
router.get('/analytics', BookingController.getBookingAnalytics);
router.get('/:id', BookingController.getBookingDetails);

module.exports = router;