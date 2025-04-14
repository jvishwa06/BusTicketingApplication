import PaymentRepository from '../repositories/paymentRepository.js';
import { appLogger } from '../utils/logger.js';

class PaymentService {
    async processPayment(userId, paymentData) {
        try {
            appLogger.info(`Processing payment for user ID: ${userId}`);

            const payment = await PaymentRepository.createPayment({ ...paymentData, userId });
            appLogger.info(`Payment created with ID: ${payment._id}`);

            const paymentGatewayResponse = { status: 'successful', transactionId: 'TX123456789' };

            payment.status = paymentGatewayResponse.status;
            payment.transactionId = paymentGatewayResponse.transactionId;
            await payment.save();

            if (payment.status !== 'successful') {
                throw new Error('Payment failed during processing.');
            }

            appLogger.info(`Payment processed successfully for user ID: ${userId}`);
            return payment;
        } catch (error) {
            appLogger.error(`Error processing payment for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getPaymentById(paymentId) {
        try {
            appLogger.info(`Fetching payment with ID: ${paymentId}`);
            const payment = await PaymentRepository.getPaymentById(paymentId);
            if (!payment) {
                appLogger.warn(`Payment not found with ID: ${paymentId}`);
            }
            return payment;
        } catch (error) {
            appLogger.error(`Error fetching payment with ID ${paymentId}: ${error.message}`);
            throw error;
        }
    }

    async getUserPayments(userId) {
        try {
            appLogger.info(`Fetching payments for user ID: ${userId}`);
            return await PaymentRepository.getUserPayments(userId);
        } catch (error) {
            appLogger.error(`Error fetching payments for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }
}

export default new PaymentService();
