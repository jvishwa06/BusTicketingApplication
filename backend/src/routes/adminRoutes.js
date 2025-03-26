const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.viewAllUsers);
router.put('/users/:userId/block', adminController.blockUnblockUser);

router.get('/operators', adminController.viewAllOperators);
router.put('/operator/:userId/block', adminController.blockUnblockOperator);

router.get('/trips', adminController.viewAllTrips);
router.get('/trips/:tripId/view', adminController.viewTrip);
router.put('/trips/:tripId/cancel', adminController.cancelTrip);

module.exports = router;
