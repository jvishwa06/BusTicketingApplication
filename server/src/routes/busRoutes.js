import express from 'express';
import BusController from '../controllers/busController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('operator','admin'), BusController.createBus);
router.get('/', authMiddleware.authenticate, authMiddleware.authorizeRoles('operator','admin'), BusController.getBuses);
router.put('/:busId', authMiddleware.authenticate, authMiddleware.authorizeRoles('operator','admin'), BusController.updateBus);
router.delete('/:busId', authMiddleware.authenticate, authMiddleware.authorizeRoles('operator','admin'), BusController.deleteBus);

export default router;
