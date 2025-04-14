import paymentRepository from '../repositories/paymentRepository.js';
import PaymentService from '../services/paymentService.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/paymentRepository.js');
jest.mock('../utils/logger.js');

describe('PaymentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
