import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/operatorController.js';
import { authenticateOperatorandUser } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticateOperatorandUser);

router.get('/profile',  getUserProfile);
router.put('/profile', updateUserProfile);

export default router;