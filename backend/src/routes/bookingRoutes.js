const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateOperator } = require('../middleware/authMiddleware');

router.use(authenticateOperator);

router.get('/trip/:tripId', bookingController.getTripBookings);
router.get('/:id', bookingController.getBookingDetails);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.get('/analytics/overview', bookingController.getBookingAnalytics);

module.exports = router; 