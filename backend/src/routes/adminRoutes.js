import express from 'express';
import AdminController from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.put('/block/:userId', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin'), AdminController.blockUser);
router.put('/unblock/:userId', authMiddleware.authenticate, authMiddleware.authorizeRoles('admin'), AdminController.unblockUser);

export default router;
