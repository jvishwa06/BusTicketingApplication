import paymentRepository from '../repositories/paymentRepository.js';
import PaymentService from '../services/paymentService.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/paymentRepository.js');
jest.mock('../utils/logger.js');

describe('PaymentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processPayment', () => {
        it('should process a payment successfully', async () => {
            const mockUserId = 'user123';
            const mockPaymentData = { 
                bookingId: 'booking123', 
                amount: 100, 
                paymentMethod: 'card' 
            };
            
            const mockPaymentWithSave = {
                _id: 'payment123',
                userId: mockUserId,
                bookingId: mockPaymentData.bookingId,
                amount: mockPaymentData.amount,
                paymentMethod: mockPaymentData.paymentMethod,
                status: 'pending',
                save: jest.fn().mockResolvedValue({
                    _id: 'payment123',
                    userId: mockUserId,
                    bookingId: mockPaymentData.bookingId,
                    amount: mockPaymentData.amount,
                    paymentMethod: mockPaymentData.paymentMethod,
                    status: 'successful',
                    transactionId: 'TX123456789'
                })
            };
            
            paymentRepository.createPayment = jest.fn().mockResolvedValue(mockPaymentWithSave);

            const result = await PaymentService.processPayment(mockUserId, mockPaymentData);

            expect(paymentRepository.createPayment).toHaveBeenCalledWith({ 
                ...mockPaymentData, 
                userId: mockUserId 
            });
            expect(mockPaymentWithSave.save).toHaveBeenCalled();
            expect(appLogger.info).toHaveBeenCalledWith(`Processing payment for user ID: ${mockUserId}`);
            expect(appLogger.info).toHaveBeenCalledWith(`Payment created with ID: payment123`);
            expect(appLogger.info).toHaveBeenCalledWith(`Payment processed successfully for user ID: ${mockUserId}`);
            
            const resultWithoutSave = {...result};
            delete resultWithoutSave.save;
            
            expect(resultWithoutSave).toEqual({
                _id: 'payment123',
                userId: mockUserId,
                bookingId: mockPaymentData.bookingId,
                amount: mockPaymentData.amount,
                paymentMethod: mockPaymentData.paymentMethod,
                status: 'successful',
                transactionId: 'TX123456789'
            });
        });

        it('should throw an error if payment processing fails', async () => {
            const mockUserId = 'user123';
            const mockPaymentData = { 
                bookingId: 'booking123', 
                amount: 100, 
                paymentMethod: 'card' 
            };
            
            const mockPaymentWithSave = {
                _id: 'payment123',
                userId: mockUserId,
                bookingId: mockPaymentData.bookingId,
                amount: mockPaymentData.amount,
                paymentMethod: mockPaymentData.paymentMethod,
                status: 'pending',
                save: jest.fn().mockImplementation(() => {
                    mockPaymentWithSave.status = 'failed';
                    return Promise.resolve({
                        _id: 'payment123',
                        userId: mockUserId,
                        bookingId: mockPaymentData.bookingId,
                        amount: mockPaymentData.amount,
                        paymentMethod: mockPaymentData.paymentMethod,
                        status: 'failed',
                        transactionId: 'TX123456789'
                    });
                })
            };
            
            paymentRepository.createPayment = jest.fn().mockResolvedValue(mockPaymentWithSave);

            await expect(PaymentService.processPayment(mockUserId, mockPaymentData))
                .rejects.toThrow('Payment failed during processing.');
            expect(appLogger.error).toHaveBeenCalled();
        });
        
        it('should handle and log repository errors during payment creation', async () => {
            const mockUserId = 'user123';
            const mockPaymentData = { 
                bookingId: 'booking123', 
                amount: 100, 
                paymentMethod: 'card' 
            };
            
            const mockError = new Error('Database error');
            paymentRepository.createPayment = jest.fn().mockRejectedValue(mockError);
            
            await expect(PaymentService.processPayment(mockUserId, mockPaymentData))
                .rejects.toThrow('Database error');
            
            expect(paymentRepository.createPayment).toHaveBeenCalledWith({ 
                ...mockPaymentData, 
                userId: mockUserId 
            });
            expect(appLogger.error).toHaveBeenCalledWith(`Error processing payment for user ID ${mockUserId}: ${mockError.message}`);
        });
    });

    describe('getUserPayments', () => {
        it('should return all payments for a user', async () => {
            const mockUserId = 'user123';
            const mockPayments = [
                { _id: 'payment1', userId: mockUserId, amount: 100 },
                { _id: 'payment2', userId: mockUserId, amount: 150 }
            ];

            paymentRepository.getUserPayments = jest.fn().mockResolvedValue(mockPayments);

            const result = await PaymentService.getUserPayments(mockUserId);

            expect(paymentRepository.getUserPayments).toHaveBeenCalledWith(mockUserId);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetching payments for user ID: ${mockUserId}`);
            expect(result).toEqual(mockPayments);
        });

        it('should handle and log repository errors', async () => {
            const mockUserId = 'user123';
            const mockError = new Error('Database error');

            paymentRepository.getUserPayments = jest.fn().mockRejectedValue(mockError);

            await expect(PaymentService.getUserPayments(mockUserId))
                .rejects.toThrow('Database error');

            expect(paymentRepository.getUserPayments).toHaveBeenCalledWith(mockUserId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching payments for user ID ${mockUserId}: ${mockError.message}`);
        });
    });

    describe('getPaymentById', () => {
        it('should return payment when found', async () => {
            const mockPaymentId = 'payment123';
            const mockPayment = { 
                _id: mockPaymentId, 
                userId: 'user123', 
                amount: 100 
            };

            paymentRepository.getPaymentById = jest.fn().mockResolvedValue(mockPayment);

            const result = await PaymentService.getPaymentById(mockPaymentId);

            expect(paymentRepository.getPaymentById).toHaveBeenCalledWith(mockPaymentId);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetching payment with ID: ${mockPaymentId}`);
            expect(result).toEqual(mockPayment);
        });

        it('should return null when payment not found', async () => {
            const mockPaymentId = 'nonexistent';

            paymentRepository.getPaymentById = jest.fn().mockResolvedValue(null);

            const result = await PaymentService.getPaymentById(mockPaymentId);

            expect(paymentRepository.getPaymentById).toHaveBeenCalledWith(mockPaymentId);
            expect(appLogger.warn).toHaveBeenCalledWith(`Payment not found with ID: ${mockPaymentId}`);
            expect(result).toBeNull();
        });

        it('should handle and log repository errors', async () => {
            const mockPaymentId = 'payment123';
            const mockError = new Error('Database error');

            paymentRepository.getPaymentById = jest.fn().mockRejectedValue(mockError);

            await expect(PaymentService.getPaymentById(mockPaymentId))
                .rejects.toThrow('Database error');

            expect(paymentRepository.getPaymentById).toHaveBeenCalledWith(mockPaymentId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching payment with ID ${mockPaymentId}: ${mockError.message}`);
        });
    });
});
