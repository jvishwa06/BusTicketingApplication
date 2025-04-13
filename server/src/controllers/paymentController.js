import PaymentService from '../services/paymentService.js';
import { appLogger } from '../utils/logger.js';

class PaymentController {
    static async processPayment(req, res) {
        try {
            const payment = await PaymentService.processPayment(req.user.id, req.body);
            appLogger.info(`Payment processed successfully for user ${req.user.id}`);
            res.status(201).json({
                success: true,
                message: 'Payment processed successfully',
                data: payment
            });
        } catch (error) {
            appLogger.error(`Error processing payment for user ${req.user.id}: ${error.message}`);
            res.status(400).json({
                success: false,
                message: 'Payment processing failed',
                data: null
            });
        }
    }
}

export default PaymentController;
