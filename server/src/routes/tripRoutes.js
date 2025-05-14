import express from 'express';
import TripController from '../controllers/tripController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/search', TripController.getFilteredTrips);
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, TripController.createTrip);
router.get('/', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, TripController.getTrip);
router.put('/:tripId', authMiddleware.authorizeRoles('admin','operator'), authMiddleware.verifiedOperatorOnly, TripController.updateTrip);
router.delete('/:tripId', authMiddleware.authorizeRoles('admin','operator'), authMiddleware.verifiedOperatorOnly, TripController.deleteTrip);

export default router;