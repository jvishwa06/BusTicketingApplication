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
            
            // Create a copy of the result without the save function for assertion
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

        it('should handle repository errors', async () => {
            const mockUserId = 'user123';
            const mockPaymentData = { 
                bookingId: 'booking123', 
                amount: 100, 
                paymentMethod: 'card' 
            };
            
            const error = new Error('Database error');
            paymentRepository.createPayment = jest.fn().mockRejectedValue(error);

            await expect(PaymentService.processPayment(mockUserId, mockPaymentData))
                .rejects.toThrow('Database error');
            expect(appLogger.error).toHaveBeenCalledWith(`Error processing payment for user ID ${mockUserId}: ${error.message}`);
        });
    });

    describe('getUserPayments', () => {
        it('should fetch all payments for a user', async () => {
            const mockUserId = 'user123';
            const mockPayments = [{ id: 'payment1', amount: 100 }, { id: 'payment2', amount: 200 }];
            
            paymentRepository.getUserPayments = jest.fn().mockResolvedValue(mockPayments);

            const result = await PaymentService.getUserPayments(mockUserId);

            expect(paymentRepository.getUserPayments).toHaveBeenCalledWith(mockUserId);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockPayments);
        });
    });

    describe('getPaymentById', () => {
        it('should return a payment by ID', async () => {
            const mockPayment = { id: 'payment1', amount: 100 };
            
            paymentRepository.getPaymentById = jest.fn().mockResolvedValue(mockPayment);

            const result = await PaymentService.getPaymentById('payment1');

            expect(paymentRepository.getPaymentById).toHaveBeenCalledWith('payment1');
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockPayment);
        });
    });
});
