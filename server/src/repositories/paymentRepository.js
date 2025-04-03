import Payment from '../models/Payment.js';
import { logger } from '../utils/logger.js';

class PaymentRepository {
    async createPayment(paymentData) {
        try {
            const payment = await Payment.create(paymentData);
            logger.info(`Payment created successfully: ${payment._id}`);
            return payment;
        } catch (error) {
            logger.error(`Error creating payment: ${error.message}`);
            throw error;
        }
    }

    async getPaymentById(paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                logger.warn(`Payment not found with ID: ${paymentId}`);
            }
            return payment;
        } catch (error) {
            logger.error(`Error fetching payment by ID ${paymentId}: ${error.message}`);
            throw error;
        }
    }

    async getUserPayments(userId) {
        try {
            const payments = await Payment.find({ userId });
            logger.info(`Fetched payments for user ${userId}`);
            return payments;
        } catch (error) {
            logger.error(`Error fetching payments for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async updatePaymentStatus(paymentId, status) {
        try {
            const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });
            if (!payment) {
                logger.warn(`Payment not found with ID: ${paymentId}`);
            } else {
                logger.info(`Payment status updated for ID: ${paymentId}, New Status: ${status}`);
            }
            return payment;
        } catch (error) {
            logger.error(`Error updating payment status for ID ${paymentId}: ${error.message}`);
            throw error;
        }
    }
}

export default new PaymentRepository();
