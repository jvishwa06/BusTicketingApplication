import express from 'express';
import AdminController from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.get('/users', authMiddleware.authorizeRoles('admin'), AdminController.getAllUsers);
router.put('/block/:userId', authMiddleware.authorizeRoles('admin'), AdminController.blockUser);
router.put('/unblock/:userId', authMiddleware.authorizeRoles('admin'), AdminController.unblockUser);
router.put('/verify-operator/:userId', authMiddleware.authorizeRoles('admin'), AdminController.verifyOperator);
router.get('/trips', authMiddleware.authorizeRoles('admin'), AdminController.getAllTrips);
router.get('/bookings', authMiddleware.authorizeRoles('admin'), AdminController.getAllBookings);
router.put('/trips/:tripId', authMiddleware.authorizeRoles('admin'), AdminController.modifyTrip);
router.put('/trips/:tripId/cancel', authMiddleware.authorizeRoles('admin'), AdminController.cancelTrip);

export default router;