import express from 'express';
import TripController from '../controllers/tripController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin', 'operator'), TripController.createTrip);
router.get('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin', 'operator'),TripController.getAllTrips);
router.get('/search', authMiddleware.authenticate, TripController.getFilteredTrips);
router.put('/:tripId', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin', 'operator'), TripController.updateTrip);
router.delete('/:tripId', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin', 'operator'), TripController.deleteTrip);

export default router;