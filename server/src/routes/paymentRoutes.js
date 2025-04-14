import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/', PaymentController.processPayment);

export default router;
