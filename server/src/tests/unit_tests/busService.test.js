import BusService from '../../services/busService.js';
import BusRepository from '../../repositories/busRepository.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../repositories/busRepository.js');
jest.mock('../../utils/logger.js');

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

        it('should throw a specific error for duplicate registration number', async () => {
            const mockOperatorId = 'operator123';
            const mockBusData = { 
                name: 'Luxury Bus', 
                totalSeats: 50, 
                registrationNumber: 'ABC123' 
            };
            const mockError = new Error('E11000 duplicate key error');
            mockError.code = 11000;
            mockError.message = 'E11000 duplicate key error collection: test.buses index: registrationNumber_1 dup key';
            
            BusRepository.createBus.mockRejectedValue(mockError);
            
            await expect(BusService.createBus(mockOperatorId, mockBusData))
                .rejects.toThrow(`A bus with registration number "${mockBusData.registrationNumber}" already exists. Please use a different registration number.`);
            
            expect(BusRepository.createBus).toHaveBeenCalledWith({ ...mockBusData, operatorId: mockOperatorId });
            expect(appLogger.error).toHaveBeenCalled();
        });
    });

    describe('getBus', () => {
        it('should fetch buses for a specific operator successfully', async () => {
            const mockOperatorId = 'operator123';
            const mockBuses = [
                { id: 'bus1', operatorId: mockOperatorId, name: 'Luxury Bus' },
                { id: 'bus2', operatorId: mockOperatorId, name: 'Economy Bus' }
            ];
            
            BusRepository.getBus.mockResolvedValue(mockBuses);

            const result = await BusService.getBus(mockOperatorId);

            expect(BusRepository.getBus).toHaveBeenCalledWith(mockOperatorId);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetched buses for operator ${mockOperatorId} successfully`);
            expect(result).toEqual(mockBuses);
        });

        it('should handle errors when fetching buses by operator', async () => {
            const mockOperatorId = 'operator123';
            const mockError = new Error('Database error');
            
            BusRepository.getBus.mockRejectedValue(mockError);

            await expect(BusService.getBus(mockOperatorId))
                .rejects.toThrow('Database error');
                
            expect(appLogger.error).toHaveBeenCalledWith(
                `Error fetching buses for operator ${mockOperatorId}: ${mockError.message}`
            );
        });
    });

    describe('updateBus', () => {
        it('should update a bus successfully when operator owns the bus', async () => {
            const mockBusId = 'bus1';
            const mockOperatorId = 'operator123';
            const mockUpdateData = { name: 'Updated Bus', totalSeats: 55 };
            const mockBus = { 
                id: mockBusId, 
                operatorId: mockOperatorId,
                name: 'Original Bus',
                totalSeats: 50
            };
            const mockUpdatedBus = { 
                id: mockBusId, 
                operatorId: mockOperatorId,
                ...mockUpdateData 
            };

            BusRepository.getBusById.mockResolvedValue(mockBus);
            BusRepository.updateBus.mockResolvedValue(mockUpdatedBus);

            const result = await BusService.updateBus(mockBusId, mockUpdateData, mockOperatorId);

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.updateBus).toHaveBeenCalledWith(mockBusId, mockUpdateData);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedBus);
        });

        it('should throw an unauthorized error if operator does not own the bus', async () => {
            const mockBusId = 'bus1';
            const mockBusOperatorId = 'operator123';
            const mockRequestingOperatorId = 'operator456';
            const mockUpdateData = { name: 'Updated Bus', totalSeats: 55 };
            const mockBus = { 
                id: mockBusId, 
                operatorId: mockBusOperatorId,
                name: 'Original Bus',
                totalSeats: 50
            };

            BusRepository.getBusById.mockResolvedValue(mockBus);

            await expect(BusService.updateBus(mockBusId, mockUpdateData, mockRequestingOperatorId))
                .rejects.toThrow('Unauthorized: You can only update your own buses');

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.updateBus).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalled();
        });

        it('should throw an error if bus is not found', async () => {
            const mockBusId = 'invalidBusId';
            const mockOperatorId = 'operator123';
            
            BusRepository.getBusById.mockResolvedValue(null);

            await expect(BusService.updateBus(mockBusId, {}, mockOperatorId)).rejects.toThrow('Bus not found');

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.updateBus).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalled();
        });

        it('should handle and log errors when updating a bus', async () => {
            const mockBusId = 'bus1';
            const mockOperatorId = 'operator123';
            const mockUpdateData = { name: 'Updated Bus', totalSeats: 55 };
            const mockError = new Error('Database error');
            
            BusRepository.getBusById.mockRejectedValue(mockError);
            
            await expect(BusService.updateBus(mockBusId, mockUpdateData, mockOperatorId))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error updating bus with ID ${mockBusId}: ${mockError.message}`);
        });

        it('should throw an error when attempting to update restricted fields', async () => {
            const mockBusId = 'bus1';
            const mockOperatorId = 'operator123';
            const mockUpdateData = { 
                name: 'Updated Bus', 
                totalSeats: 55,
                registrationNumber: 'NEW123',
                operatorId: 'operator456' 
            };
            const mockBus = { 
                id: mockBusId, 
                operatorId: mockOperatorId,
                name: 'Original Bus',
                totalSeats: 50
            };

            BusRepository.getBusById.mockResolvedValue(mockBus);

            await expect(BusService.updateBus(mockBusId, mockUpdateData, mockOperatorId))
                .rejects.toThrow(/Only name, totalSeats, type, and amenities can be updated/);

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.updateBus).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalled();
        });
    });

    describe('deleteBus', () => {
        it('should delete a bus successfully when operator owns the bus', async () => {
            const mockBusId = 'bus1';
            const mockOperatorId = 'operator123';
            const mockBus = { 
                id: mockBusId, 
                operatorId: mockOperatorId,
                name: 'Luxury Bus'
            };
            const mockDeletedBus = { id: mockBusId, operatorId: mockOperatorId };

            BusRepository.getBusById.mockResolvedValue(mockBus);
            BusRepository.deleteBus.mockResolvedValue(mockDeletedBus);

            const result = await BusService.deleteBus(mockBusId, mockOperatorId);

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.deleteBus).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockDeletedBus);
        });

        it('should throw an unauthorized error if operator does not own the bus', async () => {
            const mockBusId = 'bus1';
            const mockBusOperatorId = 'operator123';
            const mockRequestingOperatorId = 'operator456';
            const mockBus = { 
                id: mockBusId, 
                operatorId: mockBusOperatorId,
                name: 'Luxury Bus'
            };

            BusRepository.getBusById.mockResolvedValue(mockBus);

            await expect(BusService.deleteBus(mockBusId, mockRequestingOperatorId))
                .rejects.toThrow('Unauthorized: You can only delete your own buses');

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.deleteBus).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalled();
        });

        it('should throw an error if bus is not found', async () => {
            const mockBusId = 'invalidBusId';
            const mockOperatorId = 'operator123';
            
            BusRepository.getBusById.mockResolvedValue(null);

            await expect(BusService.deleteBus(mockBusId, mockOperatorId)).rejects.toThrow('Bus not found');

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(BusRepository.deleteBus).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalled();
        });

        it('should handle and log errors when deleting a bus', async () => {
            const mockBusId = 'bus1';
            const mockOperatorId = 'operator123';
            const mockError = new Error('Database error');
            
            BusRepository.getBusById.mockRejectedValue(mockError);
            
            await expect(BusService.deleteBus(mockBusId, mockOperatorId))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockBusId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error deleting bus with ID ${mockBusId}: ${mockError.message}`);
        });
    });
});
