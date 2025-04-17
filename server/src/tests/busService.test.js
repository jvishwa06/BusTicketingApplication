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

        it('should handle and log errors when creating a bus', async () => {
            const mockOperatorId = 'operator123';
            const mockBusData = { name: 'Luxury Bus', totalSeats: 50 };
            const mockError = new Error('Database error');
            
            BusRepository.createBus.mockRejectedValue(mockError);
            
            await expect(BusService.createBus(mockOperatorId, mockBusData))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.createBus).toHaveBeenCalledWith({ ...mockBusData, operatorId: mockOperatorId });
            expect(appLogger.error).toHaveBeenCalledWith(`Error creating bus for operator ${mockOperatorId}: ${mockError.message}`);
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

        it('should handle and log errors when fetching all buses', async () => {
            const mockError = new Error('Database error');
            BusRepository.getAllBuses.mockRejectedValue(mockError);

            await expect(BusService.getBuses())
                .rejects.toThrow('Database error');

            expect(BusRepository.getAllBuses).toHaveBeenCalled();
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching buses: ${mockError.message}`);
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

        it('should handle and log errors when updating a bus', async () => {
            const mockBusId = 'bus1';
            const mockUpdateData = { name: 'Updated Bus', totalSeats: 55 };
            const mockError = new Error('Database error');
            
            BusRepository.updateBus.mockRejectedValue(mockError);
            
            await expect(BusService.updateBus(mockBusId, mockUpdateData))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.updateBus).toHaveBeenCalledWith(mockBusId, mockUpdateData);
            expect(appLogger.error).toHaveBeenCalledWith(`Error updating bus with ID ${mockBusId}: ${mockError.message}`);
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

        it('should handle and log errors when deleting a bus', async () => {
            const mockBusId = 'bus1';
            const mockError = new Error('Database error');
            
            BusRepository.deleteBus.mockRejectedValue(mockError);
            
            await expect(BusService.deleteBus(mockBusId))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.deleteBus).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error deleting bus with ID ${mockBusId}: ${mockError.message}`);
        });
    });
    
    describe('getBusesByOperator', () => {
        it('should fetch buses for a specific operator successfully', async () => {
            const mockOperatorId = 'operator123';
            const mockBuses = [
                { id: 'bus1', operatorId: mockOperatorId, name: 'Luxury Bus' },
                { id: 'bus2', operatorId: mockOperatorId, name: 'Economy Bus' }
            ];
            
            BusRepository.getBusesByOperator.mockResolvedValue(mockBuses);

            const result = await BusService.getBusesByOperator(mockOperatorId);

            expect(BusRepository.getBusesByOperator).toHaveBeenCalledWith(mockOperatorId);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetched buses for operator ${mockOperatorId} successfully`);
            expect(result).toEqual(mockBuses);
        });

        it('should handle errors when fetching buses by operator', async () => {
            const mockOperatorId = 'operator123';
            const mockError = new Error('Database error');
            
            BusRepository.getBusesByOperator.mockRejectedValue(mockError);

            await expect(BusService.getBusesByOperator(mockOperatorId))
                .rejects.toThrow('Database error');
                
            expect(appLogger.error).toHaveBeenCalledWith(
                `Error fetching buses for operator ${mockOperatorId}: ${mockError.message}`
            );
        });
    });
});
