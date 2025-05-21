import express from 'express';
import BookingController from '../controllers/bookingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('user'), BookingController.createBooking);
router.get('/', authMiddleware.authorizeRoles('user'), BookingController.getUserBookings);
router.post('/:id/cancel', authMiddleware.authorizeRoles('user'), BookingController.cancelBooking);

export default router;