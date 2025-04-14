import express from 'express';
import AdminController from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.put('/block/:userId', authMiddleware.authorizeRoles('admin'), AdminController.blockUser);
router.put('/unblock/:userId', authMiddleware.authorizeRoles('admin'), AdminController.unblockUser);

export default router;
