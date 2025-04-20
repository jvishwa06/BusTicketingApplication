import express from 'express';
import RatingController from '../controllers/ratingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/bookings/:bookingId', authMiddleware.authorizeRoles('user'), RatingController.submitRating);
router.put('/:ratingId', authMiddleware.authorizeRoles('user'), RatingController.updateRating);
router.get('/', authMiddleware.authorizeRoles('user'), RatingController.getUserRatings);
router.delete('/:ratingId', authMiddleware.authorizeRoles('user'), RatingController.deleteRating);

router.get('/buses/:busId', authMiddleware.authorizeRoles('operator'), RatingController.getBusRatings);
router.get('/bookings/:bookingId', authMiddleware.authorizeRoles('operator'), RatingController.getBookingRating);

export default router;