import PaymentService from '../services/paymentService.js';
import paymentRepository from '../repositories/PaymentRepository.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/PaymentRepository.js');
jest.mock('../utils/logger.js');

describe('PaymentService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserPayments', () => {
        it('should fetch all payments for a user', async () => {
            const mockUserId = 'user123';
            const mockPayments = [{ id: 'payment1', amount: 100 }, { id: 'payment2', amount: 200 }];
            
            paymentRepository.getPaymentsByUserId.mockResolvedValue(mockPayments);

            const result = await PaymentService.getUserPayments(mockUserId);

            expect(paymentRepository.getPaymentsByUserId).toHaveBeenCalledWith(mockUserId);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockPayments);
        });
    });

    describe('getPaymentById', () => {
        it('should return a payment by ID', async () => {
            const mockPayment = { id: 'payment1', amount: 100 };
            paymentRepository.getPaymentById.mockResolvedValue(mockPayment);

            const result = await PaymentService.getPaymentById('payment1');

            expect(paymentRepository.getPaymentById).toHaveBeenCalledWith('payment1');
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockPayment);
        });
    });
});
