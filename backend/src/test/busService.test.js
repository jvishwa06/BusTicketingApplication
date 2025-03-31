import BusService from '../services/busService.js';
import BusRepository from '../repositories/busRepository.js';
import { logger } from '../utils/logger.js';
import { jest } from '@jest/globals';

jest.mock('../repositories/busRepository.js');
jest.mock('../utils/logger.js');

describe('BusService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createBus', () => {
        it('should create a bus successfully', async () => {
            const mockOperatorId = 'operator123';
            const mockBusData = { name: 'Luxury Bus', totalSeats: 50 };
            const mockBus = { id: 'bus1', ...mockBusData, operatorId: mockOperatorId };
            
            BusRepository.createBus.mockResolvedValue(mockBus);
            
            const result = await BusService.createBus(mockOperatorId, mockBusData);
            
            expect(BusRepository.createBus).toHaveBeenCalledWith({ ...mockBusData, operatorId: mockOperatorId });
            expect(logger.info).toHaveBeenCalled();
            expect(result).toEqual(mockBus);
        });
    });

    describe('getBuses', () => {
        it('should fetch all buses successfully', async () => {
            const mockBuses = [{ id: 'bus1' }, { id: 'bus2' }];
            BusRepository.getAllBuses.mockResolvedValue(mockBuses);

            const result = await BusService.getBuses();

            expect(BusRepository.getAllBuses).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalled();
            expect(result).toEqual(mockBuses);
        });
    });
});
