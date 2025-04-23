import express from 'express';
import BookingController from '../controllers/bookingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('user'), BookingController.createBooking);
router.get('/', authMiddleware.authorizeRoles('user'), BookingController.getUserBookings);
router.get('/operator', authMiddleware.authorizeRoles('operator'), BookingController.getOperatorBookings);
router.delete('/:id', authMiddleware.authorizeRoles('user'), BookingController.deleteBooking);

export default router;