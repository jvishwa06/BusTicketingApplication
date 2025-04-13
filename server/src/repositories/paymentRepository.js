import Payment from '../models/Payment.js';
import { appLogger } from '../utils/logger.js';

class PaymentRepository {
    async createPayment(paymentData) {
        try {
            const payment = await Payment.create(paymentData);
            appLogger.info(`Payment created successfully: ${payment._id}`);
            return payment;
        } catch (error) {
            appLogger.error(`Error creating payment: ${error.message}`);
            throw error;
        }
    }

    async getPaymentById(paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                appLogger.warn(`Payment not found with ID: ${paymentId}`);
            }
            return payment;
        } catch (error) {
            appLogger.error(`Error fetching payment by ID ${paymentId}: ${error.message}`);
            throw error;
        }
    }

    async getUserPayments(userId) {
        try {
            const payments = await Payment.find({ userId });
            appLogger.info(`Fetched payments for user ${userId}`);
            return payments;
        } catch (error) {
            appLogger.error(`Error fetching payments for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async updatePaymentStatus(paymentId, status) {
        try {
            const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });
            if (!payment) {
                appLogger.warn(`Payment not found with ID: ${paymentId}`);
            } else {
                appLogger.info(`Payment status updated for ID: ${paymentId}, New Status: ${status}`);
            }
            return payment;
        } catch (error) {
            appLogger.error(`Error updating payment status for ID ${paymentId}: ${error.message}`);
            throw error;
        }
    }
}

export default new PaymentRepository();
