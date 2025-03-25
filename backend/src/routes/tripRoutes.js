const express = require('express');
const router = express.Router();
const TripController = require('../controllers/tripController');
const { authenticateOperator } = require('../middleware/authMiddleware');

router.use(authenticateOperator);

router.post('/', TripController.createTrip);
router.get('/', TripController.getOperatorTrips);
router.get('/:id', TripController.getTrip);
router.put('/:id', TripController.updateTrip);
router.delete('/:id', TripController.cancelTrip);
router.get('/:id/analytics', TripController.getTripAnalytics);
router.get('/:id/seats', TripController.getSeatAvailability);

module.exports = router;