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
    });

    describe('getTripsByBusIds', () => {
        it('should return trips for the specified bus IDs', async () => {
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
        
        it('should throw error if bus IDs are invalid', async () => {
            const invalidInputs = [null, [], undefined];
            
            for (const invalidInput of invalidInputs) {
                await expect(TripService.getTripsByBusIds(invalidInput))
                    .rejects.toThrow('Valid bus IDs are required to fetch trips');
                expect(appLogger.warn).toHaveBeenCalledWith('Trip search failed: Invalid bus IDs');
                expect(TripRepository.getTripsByBusIds).not.toHaveBeenCalled();
                
                jest.clearAllMocks();
            }
        });
        
        it('should handle repository errors', async () => {
            const mockBusIds = ['bus1', 'bus2'];
            const error = new Error('Database error');
            
            TripRepository.getTripsByBusIds.mockRejectedValue(error);
            
            await expect(TripService.getTripsByBusIds(mockBusIds))
                .rejects.toThrow('Database error');
            expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trips by bus IDs: ${error.message}`);
        });
    });
});