import express from 'express';
import BookingController from '../controllers/bookingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/user', BookingController.createBooking);
router.get('/user', BookingController.getUserBookings);
router.get('/operator', authMiddleware.authorizeRoles('operator', 'admin'), BookingController.getOperatorBookings);
router.get('/', authMiddleware.authorizeRoles('admin'), BookingController.getAllBookings);
router.get('/:id', authMiddleware.authorizeRoles('admin'), BookingController.getBookingById);
router.put('/:id', authMiddleware.authorizeRoles('admin'), BookingController.updateBooking);
router.delete('/:id', BookingController.deleteBooking);

export default router;