import express from 'express';
import TripController from '../controllers/tripController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin', 'operator'), TripController.createTrip);
router.get('/', authMiddleware.authenticate,  authMiddleware.authorizeRoles('admin', 'operator'),TripController.getAllTrips);
router.get('/search', TripController.getFilteredTrips);

export default router;