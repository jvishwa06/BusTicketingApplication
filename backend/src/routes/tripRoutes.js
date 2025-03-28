import express from 'express';
import TripController from '../controllers/tripController.js';
import { authenticateOperatorandUser } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateOperatorandUser);

router.post('/', TripController.createTrip);
router.get('/', TripController.getOperatorTrips);
router.get('/:id', TripController.getTrip);
router.put('/:id', TripController.updateTrip);
router.delete('/:id', TripController.cancelTrip);
router.get('/:id/analytics', TripController.getTripAnalytics);
router.get('/:id/seats', TripController.getSeatAvailability);
export default router;