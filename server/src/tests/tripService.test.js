import TripService from '../services/tripService.js';
import TripRepository from '../repositories/tripRepository.js';
import BusRepository from '../repositories/busRepository.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/tripRepository.js');
jest.mock('../repositories/busRepository.js');
jest.mock('../utils/logger.js');

describe('TripService', () => {
    afterEach(() => {
        jest.clearAllMocks();
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

    describe('getAllTrips', () => {
        it('should fetch all trips successfully', async () => {
            const mockTrips = [{ id: 'trip1' }, { id: 'trip2' }];
            TripRepository.getAllTrips.mockResolvedValue(mockTrips);

            const result = await TripService.getAllTrips();

            expect(TripRepository.getAllTrips).toHaveBeenCalled();
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockTrips);
        });

        it('should handle and log repository errors', async () => {
            const mockError = new Error('Database error');
            TripRepository.getAllTrips.mockRejectedValue(mockError);
            
            await expect(TripService.getAllTrips())
                .rejects.toThrow('Database error');
            
            expect(TripRepository.getAllTrips).toHaveBeenCalled();
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching all trips: ${mockError.message}`);
        });
    });

    describe('getTripById', () => {
        it('should return a trip by ID', async () => {
            const mockTrip = { id: 'trip1', source: 'City A', destination: 'City B' };
            TripRepository.getTripById.mockResolvedValue(mockTrip);

            const result = await TripService.getTripById('trip1');

            expect(TripRepository.getTripById).toHaveBeenCalledWith('trip1');
            expect(appLogger.info).toHaveBeenCalled();
            expect(result).toEqual(mockTrip);
        });

        it('should handle and log repository errors', async () => {
            const mockTripId = 'trip1';
            const mockError = new Error('Database error');
            TripRepository.getTripById.mockRejectedValue(mockError);
            
            await expect(TripService.getTripById(mockTripId))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trip by ID ${mockTripId}: ${mockError.message}`);
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

    describe('getTripsByBusIds', () => {
        it('should return trips for given bus IDs', async () => {
            const mockBusIds = ['bus1', 'bus2'];
            const mockTrips = [
                { id: 'trip1', busId: 'bus1', source: 'City A', destination: 'City B' },
                { id: 'trip2', busId: 'bus2', source: 'City C', destination: 'City D' }
            ];
            
            TripRepository.getTripsByBusIds.mockResolvedValue(mockTrips);
            
            const result = await TripService.getTripsByBusIds(mockBusIds);
            
            expect(TripRepository.getTripsByBusIds).toHaveBeenCalledWith(mockBusIds);
            expect(appLogger.info).toHaveBeenCalledWith(`Fetching trips for bus IDs: ${mockBusIds.join(', ')}`);
            expect(result).toEqual(mockTrips);
        });

        it('should throw error when busIds is not provided', async () => {
            await expect(TripService.getTripsByBusIds())
                .rejects.toThrow('Valid bus IDs are required to fetch trips');
            
            expect(TripRepository.getTripsByBusIds).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Invalid bus IDs');
        });

        it('should throw error when busIds is not an array', async () => {
            await expect(TripService.getTripsByBusIds('bus1'))
                .rejects.toThrow('Valid bus IDs are required to fetch trips');
            
            expect(TripRepository.getTripsByBusIds).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Invalid bus IDs');
        });

        it('should throw error when busIds is an empty array', async () => {
            await expect(TripService.getTripsByBusIds([]))
                .rejects.toThrow('Valid bus IDs are required to fetch trips');
            
            expect(TripRepository.getTripsByBusIds).not.toHaveBeenCalled();
            expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Invalid bus IDs');
        });

        it('should handle and log repository errors', async () => {
            const mockBusIds = ['bus1', 'bus2'];
            const mockError = new Error('Database error');
            
            TripRepository.getTripsByBusIds.mockRejectedValue(mockError);
            
            await expect(TripService.getTripsByBusIds(mockBusIds))
                .rejects.toThrow('Database error');
            
            expect(TripRepository.getTripsByBusIds).toHaveBeenCalledWith(mockBusIds);
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trips by bus IDs: ${mockError.message}`);
        });
    });
});