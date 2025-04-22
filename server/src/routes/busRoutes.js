import express from 'express';
import BusController from '../controllers/busController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('operator','admin'), BusController.createBus);
router.get('/', authMiddleware.authorizeRoles('operator','admin'), BusController.getBuses);
router.get('/operator', authMiddleware.authorizeRoles('operator'), BusController.getOperatorBuses);
router.put('/:busId', authMiddleware.authorizeRoles('operator','admin'), BusController.updateBus);
router.delete('/:busId', authMiddleware.authorizeRoles('operator','admin'), BusController.deleteBus);

export default router;