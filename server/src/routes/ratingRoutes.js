import express from 'express';
import RatingController from '../controllers/ratingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/bookings/:bookingId', authMiddleware.authorizeRoles('user'), RatingController.submitRating);
router.get('/', authMiddleware.authorizeRoles('user'), RatingController.getUserRatings);
router.get('/trips/:tripId', RatingController.getTripRatings);
router.put('/:ratingId', authMiddleware.authorizeRoles('user'), RatingController.updateRating);
router.delete('/:ratingId', authMiddleware.authorizeRoles('user'), RatingController.deleteRating);

export default router;