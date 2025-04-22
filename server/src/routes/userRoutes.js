import express from 'express';
import UserController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/logout', authMiddleware.authenticate, UserController.logout);
router.get('/profile', authMiddleware.authenticate, UserController.getProfile);
router.put('/profile', authMiddleware.authenticate, UserController.updateProfile);

export default router;