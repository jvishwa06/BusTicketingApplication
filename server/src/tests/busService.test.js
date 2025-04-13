import BusService from '../services/busService.js';
import BusRepository from '../repositories/busRepository.js';
import { appLogger } from '../utils/logger.js';

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
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockBus);
        });
    });

    describe('getBuses', () => {
        it('should fetch all buses successfully', async () => {
            const mockBuses = [{ id: 'bus1' }, { id: 'bus2' }];
            BusRepository.getAllBuses.mockResolvedValue(mockBuses);

            const result = await BusService.getBuses();

            expect(BusRepository.getAllBuses).toHaveBeenCalled();
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockBuses);
        });
    });

    describe('updateBus', () => {
        it('should update a bus successfully', async () => {
            const mockBusId = 'bus1';
            const mockUpdateData = { name: 'Updated Bus', totalSeats: 55 };
            const mockUpdatedBus = { id: mockBusId, ...mockUpdateData };

            BusRepository.updateBus.mockResolvedValue(mockUpdatedBus);

            const result = await BusService.updateBus(mockBusId, mockUpdateData);

            expect(BusRepository.updateBus).toHaveBeenCalledWith(mockBusId, mockUpdateData);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedBus);
        });

        it('should throw an error if bus is not found', async () => {
            const mockBusId = 'invalidBusId';
            BusRepository.updateBus.mockResolvedValue(null);

            await expect(BusService.updateBus(mockBusId, {})).rejects.toThrow('Bus not found');

            expect(BusRepository.updateBus).toHaveBeenCalledWith(mockBusId, {});
            expect(appLogger.warn).toHaveBeenCalled();
        });
    });

    describe('deleteBus', () => {
        it('should delete a bus successfully', async () => {
            const mockBusId = 'bus1';
            const mockDeletedBus = { id: mockBusId };

            BusRepository.deleteBus.mockResolvedValue(mockDeletedBus);

            const result = await BusService.deleteBus(mockBusId);

            expect(BusRepository.deleteBus).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockDeletedBus);
        });

        it('should throw an error if bus is not found', async () => {
            const mockBusId = 'invalidBusId';
            BusRepository.deleteBus.mockResolvedValue(null);

            await expect(BusService.deleteBus(mockBusId)).rejects.toThrow('Bus not found');

            expect(BusRepository.deleteBus).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.warn).toHaveBeenCalled();
        });
    });
});
