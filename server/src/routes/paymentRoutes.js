import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware.authenticate, PaymentController.processPayment);

export default router;
