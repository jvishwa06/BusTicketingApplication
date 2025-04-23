import express from 'express';
import BusController from '../controllers/busController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, BusController.createBus);
router.get('/', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, BusController.getBus);
router.put('/:busId', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, BusController.updateBus);
router.delete('/:busId', authMiddleware.authorizeRoles('operator'), authMiddleware.verifiedOperatorOnly, BusController.deleteBus);

export default router;