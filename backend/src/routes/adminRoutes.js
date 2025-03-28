import express from 'express';
import adminController from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', adminController.viewAllUsers);
router.put('/users/:userId/block', adminController.blockUnblockUser);

router.get('/operators', adminController.viewAllOperators);
router.put('/operator/:userId/block', adminController.blockUnblockOperator);

router.get('/trips', adminController.viewAllTrips);
router.get('/trips/:tripId/view', adminController.viewTrip);
router.put('/trips/:tripId/cancel', adminController.cancelTrip);

export default router;
