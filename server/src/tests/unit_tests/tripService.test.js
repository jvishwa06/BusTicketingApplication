import TripService from '../../services/tripService.js';
import TripRepository from '../../repositories/tripRepository.js';
import BusRepository from '../../repositories/busRepository.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../repositories/tripRepository.js');
jest.mock('../../repositories/busRepository.js');
jest.mock('../../utils/logger.js');

describe('TripService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createTrip', () => {
        it('should create a trip successfully', async () => {
            const mockTripData = { busId: 'bus123', source: 'City A', destination: 'City B' };
            const mockBus = { id: 'bus123', operatorId: 'operator1' };
            const mockTrip = { id: 'trip1', ...mockTripData, operatorId: mockBus.operatorId };

            BusRepository.getBusById.mockResolvedValue(mockBus);
            TripRepository.createTrip.mockResolvedValue(mockTrip);

            const result = await TripService.createTrip(mockTripData);

            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockTripData.busId);
            expect(TripRepository.createTrip).toHaveBeenCalledWith({ ...mockTripData, operatorId: mockBus.operatorId });
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockTrip);
        });

        it('should throw error when busId is not provided', async () => {
            const mockTripData = { source: 'City A', destination: 'City B' };
            
            await expect(TripService.createTrip(mockTripData))
                .rejects.toThrow('Bus ID is required to create a trip');
            
            expect(BusRepository.getBusById).not.toHaveBeenCalled();
            expect(TripRepository.createTrip).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip creation failed: Missing bus ID');
        });

        it('should throw error when bus is not found', async () => {
            const mockTripData = { busId: 'invalidBus', source: 'City A', destination: 'City B' };
            
            BusRepository.getBusById.mockResolvedValue(null);
            
            await expect(TripService.createTrip(mockTripData))
                .rejects.toThrow(`Bus with ID ${mockTripData.busId} not found`);
            
            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockTripData.busId);
            expect(TripRepository.createTrip).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith(`Trip creation failed: Bus not found with ID ${mockTripData.busId}`);
        });

        it('should handle and log repository errors', async () => {
            const mockTripData = { busId: 'bus123', source: 'City A', destination: 'City B' };
            const mockBus = { id: 'bus123', operatorId: 'operator1' };
            const mockError = new Error('Database error');
            
            BusRepository.getBusById.mockResolvedValue(mockBus);
            TripRepository.createTrip.mockRejectedValue(mockError);
            
            await expect(TripService.createTrip(mockTripData))
                .rejects.toThrow('Database error');
            
            expect(BusRepository.getBusById).toHaveBeenCalledWith(mockTripData.busId);
            expect(TripRepository.createTrip).toHaveBeenCalled();
            expect(appLogger.error).toHaveBeenCalledWith(`Error creating trip: ${mockError.message}`);
        });
    });

    describe('getTripsByFilters', () => {
        it('should return trips based on filters', async () => {
            const mockFilters = { source: 'City A', destination: 'City B', date: '2025-04-01' };
            const mockTrips = [{ id: 'trip1', source: 'City A', destination: 'City B' }];
            
            TripRepository.findTripsByFilters.mockResolvedValue(mockTrips);
            
            const result = await TripService.getTripsByFilters(mockFilters);
            
            expect(TripRepository.findTripsByFilters).toHaveBeenCalled();
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockTrips);
        });

        it('should throw error when source is missing', async () => {
            const mockFilters = { destination: 'City B', date: '2025-04-01' };
            
            await expect(TripService.getTripsByFilters(mockFilters))
                .rejects.toThrow('Source, destination, and date are required to search for trips.');
            
            expect(TripRepository.findTripsByFilters).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Missing required parameters');
        });

        it('should throw error when destination is missing', async () => {
            const mockFilters = { source: 'City A', date: '2025-04-01' };
            
            await expect(TripService.getTripsByFilters(mockFilters))
                .rejects.toThrow('Source, destination, and date are required to search for trips.');
            
            expect(TripRepository.findTripsByFilters).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Missing required parameters');
        });

        it('should throw error when date is missing', async () => {
            const mockFilters = { source: 'City A', destination: 'City B' };
            
            await expect(TripService.getTripsByFilters(mockFilters))
                .rejects.toThrow('Source, destination, and date are required to search for trips.');
            
            expect(TripRepository.findTripsByFilters).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Missing required parameters');
        });

        it('should handle and log repository errors', async () => {
            const mockFilters = { source: 'City A', destination: 'City B', date: '2025-04-01' };
            const mockError = new Error('Database error');
            
            TripRepository.findTripsByFilters.mockRejectedValue(mockError);
            
            await expect(TripService.getTripsByFilters(mockFilters))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.findTripsByFilters).toHaveBeenCalled();
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trips by filters: ${mockError.message}`);
        });
    });

    describe('getTrip', () => {
        it('should return trips for a specific operator', async () => {
            const mockOperatorId = 'operator1';
            const mockTrips = [
                { id: 'trip1', operatorId: mockOperatorId, source: 'City A', destination: 'City B' },
                { id: 'trip2', operatorId: mockOperatorId, source: 'City C', destination: 'City D' }
            ];
            
            TripRepository.getTrip.mockResolvedValue(mockTrips);
            
            const result = await TripService.getTrip(mockOperatorId);
            
            expect(TripRepository.getTrip).toHaveBeenCalledWith(mockOperatorId);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetching trips for operator with ID: ${mockOperatorId}`);
            expect(result).toEqual(mockTrips);
        });

        it('should handle and log repository errors', async () => {
            const mockOperatorId = 'operator1';
            const mockError = new Error('Database error');
            
            TripRepository.getTrip.mockRejectedValue(mockError);
            
            await expect(TripService.getTrip(mockOperatorId))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.getTrip).toHaveBeenCalledWith(mockOperatorId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trips for operator ${mockOperatorId}: ${mockError.message}`);
        });
    });

    describe('updateTrip', () => {
        it('should update a trip successfully', async () => {
            const mockTripId = 'trip1';
            const mockUpdateData = { price: 100 };
            const mockUpdatedTrip = { id: mockTripId, ...mockUpdateData };
            TripRepository.updateTrip.mockResolvedValue(mockUpdatedTrip);

            const result = await TripService.updateTrip(mockTripId, mockUpdateData);

            expect(TripRepository.updateTrip).toHaveBeenCalledWith(mockTripId, mockUpdateData);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedTrip);
        });

        it('should check trip ownership when userId is provided', async () => {
            const mockTripId = 'trip1';
            const mockUserId = 'operator1';
            const mockUpdateData = { price: 100 };
            const mockTrip = { 
                id: mockTripId, 
                operatorId: mockUserId,
                source: 'City A', 
                destination: 'City B',
                toObject: jest.fn().mockReturnValue({ id: mockTripId, operatorId: mockUserId })
            };
            const mockUpdatedTrip = { id: mockTripId, ...mockUpdateData, operatorId: mockUserId };
            
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            TripRepository.updateTrip.mockResolvedValue(mockUpdatedTrip);

            const result = await TripService.updateTrip(mockTripId, mockUpdateData, mockUserId);

            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.updateTrip).toHaveBeenCalledWith(mockTripId, mockUpdateData);
            expect(result).toEqual(mockUpdatedTrip);
        });

        it('should throw error when trip does not belong to the operator', async () => {
            const mockTripId = 'trip1';
            const mockUserId = 'operator1';
            const mockDifferentOperatorId = 'operator2';
            const mockUpdateData = { price: 100 };
            const mockTrip = { 
                id: mockTripId, 
                operatorId: mockDifferentOperatorId,
                source: 'City A', 
                destination: 'City B',
                toObject: jest.fn().mockReturnValue({ id: mockTripId, operatorId: mockDifferentOperatorId })
            };
            
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            
            await expect(TripService.updateTrip(mockTripId, mockUpdateData, mockUserId))
                .rejects.toThrow('You are not authorized to update this trip');
            
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith(`Unauthorized attempt to update trip ${mockTripId} by user ${mockUserId}`);
        });

        it('should throw error when trip is not found during ownership check for update', async () => {
            const mockTripId = 'nonexistent';
            const mockUserId = 'operator1';
            const mockUpdateData = { price: 100 };
            
            TripRepository.getTripById.mockResolvedValue(null);
            
            await expect(TripService.updateTrip(mockTripId, mockUpdateData, mockUserId))
                .rejects.toThrow(`Trip with ID ${mockTripId} not found`);
            
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

        it('should handle and log repository errors', async () => {
            const mockTripId = 'trip1';
            const mockUpdateData = { price: 100 };
            const mockError = new Error('Database error');
            
            TripRepository.updateTrip.mockRejectedValue(mockError);
            
            await expect(TripService.updateTrip(mockTripId, mockUpdateData))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.updateTrip).toHaveBeenCalledWith(mockTripId, mockUpdateData);
            expect(appLogger.error).toHaveBeenCalledWith(`Error updating trip with ID ${mockTripId}: ${mockError.message}`);
        });
    });

    describe('deleteTrip', () => {
        it('should delete a trip successfully', async () => {
            const mockTripId = 'trip1';
            const mockDeletedTrip = { id: mockTripId };
            TripRepository.deleteTrip.mockResolvedValue(mockDeletedTrip);

            const result = await TripService.deleteTrip(mockTripId);

            expect(TripRepository.deleteTrip).toHaveBeenCalledWith(mockTripId);
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockDeletedTrip);
        });

        it('should check trip ownership when userId is provided', async () => {
            const mockTripId = 'trip1';
            const mockUserId = 'operator1';
            const mockTrip = { 
                id: mockTripId, 
                operatorId: mockUserId,
                source: 'City A', 
                destination: 'City B',
                toObject: jest.fn().mockReturnValue({ id: mockTripId, operatorId: mockUserId })
            };
            const mockDeletedTrip = { id: mockTripId };
            
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            TripRepository.deleteTrip.mockResolvedValue(mockDeletedTrip);

            const result = await TripService.deleteTrip(mockTripId, mockUserId);

            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.deleteTrip).toHaveBeenCalledWith(mockTripId);
            expect(result).toEqual(mockDeletedTrip);
        });

        it('should throw error when trip does not belong to the operator', async () => {
            const mockTripId = 'trip1';
            const mockUserId = 'operator1';
            const mockDifferentOperatorId = 'operator2';
            const mockTrip = { 
                id: mockTripId, 
                operatorId: mockDifferentOperatorId,
                source: 'City A', 
                destination: 'City B',
                toObject: jest.fn().mockReturnValue({ id: mockTripId, operatorId: mockDifferentOperatorId })
            };
            
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            
            await expect(TripService.deleteTrip(mockTripId, mockUserId))
                .rejects.toThrow('You are not authorized to delete this trip');
            
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.deleteTrip).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith(`Unauthorized attempt to delete trip ${mockTripId} by user ${mockUserId}`);
        });

        it('should throw error when trip is not found during ownership check for delete', async () => {
            const mockTripId = 'nonexistent';
            const mockUserId = 'operator1';
            
            TripRepository.getTripById.mockResolvedValue(null);
            
            await expect(TripService.deleteTrip(mockTripId, mockUserId))
                .rejects.toThrow(`Trip with ID ${mockTripId} not found`);
            
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.deleteTrip).not.toHaveBeenCalled();
        });

        it('should handle and log repository errors', async () => {
            const mockTripId = 'trip1';
            const mockError = new Error('Database error');
            
            TripRepository.deleteTrip.mockRejectedValue(mockError);
            
            await expect(TripService.deleteTrip(mockTripId))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.deleteTrip).toHaveBeenCalledWith(mockTripId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error deleting trip with ID ${mockTripId}: ${mockError.message}`);
        });
    });
});