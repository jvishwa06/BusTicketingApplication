import express from 'express';
import TripController from '../controllers/tripController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('operator'), TripController.createTrip);
router.get('/', authMiddleware.authorizeRoles('admin', 'operator'),TripController.getAllTrips);
router.get('/search', TripController.getFilteredTrips);
router.get('/:tripId', TripController.getTripById);
router.put('/:tripId', authMiddleware.authorizeRoles('admin', 'operator'), TripController.updateTrip);
router.delete('/:tripId', authMiddleware.authorizeRoles('admin', 'operator'), TripController.deleteTrip);

export default router;