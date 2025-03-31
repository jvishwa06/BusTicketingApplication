import express from 'express';
import BookingController from '../controllers/bookingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware.authenticate, BookingController.createBooking);
router.get('/user', authMiddleware.authenticate, BookingController.getUserBookings);
router.get('/operator', authMiddleware.authenticate, authMiddleware.authorizeRoles('operator'), BookingController.getOperatorBookings);
router.get('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin'), BookingController.getAllBookings);
router.get('/:id', authMiddleware.authenticate, BookingController.getBookingById);
router.put('/:id', authMiddleware.authenticate, BookingController.updateBooking);
router.delete('/:id', authMiddleware.authenticate, BookingController.deleteBooking);

export default router;