import express from 'express';
import BookingController from '../controllers/bookingController.js';
import { authenticateOperatorandUser } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateOperatorandUser);

router.get('/trips/:tripId', BookingController.getTripBookings);
router.put('/:id/status', BookingController.updateBookingStatus);
router.get('/analytics', BookingController.getBookingAnalytics);
router.get('/:id', BookingController.getBookingDetails);

export default router;