import tripRepository from '../../repositories/tripRepository.js';
import Trip from '../../models/trip.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../models/trip');
jest.mock('../../utils/logger', () => ({
  appLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('TripRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      const tripData = {
        busId: 'mockBusId',
        source: 'Bangalore',
        destination: 'Chennai',
        departureTime: new Date('2023-06-01T08:00:00Z'),
        arrivalTime: new Date('2023-06-01T14:00:00Z'),
        price: 800,
        totalSeats: 40,
        availableSeats: 40
      };
      
      const expectedTrip = {
        _id: 'mockTripId',
        ...tripData
      };
      
      Trip.create.mockResolvedValue(expectedTrip);
      
      const result = await tripRepository.createTrip(tripData);
      
      expect(Trip.create).toHaveBeenCalledWith(tripData);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('Saving new trip to DB'));
      expect(result).toEqual(expectedTrip);
    });
  });

  describe('findTripsByFilters', () => {
    it('should find trips based on filters', async () => {
      const source = 'Bangalore';
      const destination = 'Chennai';
      const searchDate = new Date('2023-06-01T00:00:00Z');
      const nextDay = new Date('2023-06-02T00:00:00Z');
      
      const expectedTrips = [
        { _id: 'trip1', source, destination, departureTime: searchDate },
        { _id: 'trip2', source, destination, departureTime: new Date('2023-06-01T09:00:00Z') }
      ];
      
      const mockPopulate = jest.fn().mockResolvedValue(expectedTrips);
      
      Trip.find.mockReturnValue({
        populate: mockPopulate
      });
      
      const result = await tripRepository.findTripsByFilters(source, destination, searchDate, nextDay);
      
      expect(Trip.find).toHaveBeenCalledWith({
        source: { $regex: new RegExp(`^${source}$`, "i") },
        destination: { $regex: new RegExp(`^${destination}$`, "i") },
        departureTime: { $gte: searchDate, $lt: nextDay }
      });
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('Querying trips from DB'));
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('getTripById', () => {
    it('should get a trip by ID', async () => {
      const tripId = 'mockTripId';
      const expectedTrip = {
        _id: tripId,
        source: 'Bangalore',
        destination: 'Chennai'
      };
      
      const mockExec = jest.fn().mockResolvedValue(expectedTrip);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      
      Trip.findById.mockReturnValue({
        populate: mockPopulate
      });
      
      const result = await tripRepository.getTripById(tripId);
      
      expect(Trip.findById).toHaveBeenCalledWith(tripId);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('Fetching trip from DB with ID'));
      expect(result).toEqual(expectedTrip);
    });

    it('should return null when trip is not found', async () => {
      const tripId = 'nonExistentTripId';
      
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      
      Trip.findById.mockReturnValue({
        populate: mockPopulate
      });
      
      const result = await tripRepository.getTripById(tripId);
      
      expect(result).toBeNull();
    });
  });

  describe('getTrip', () => {
    it('should get trips for an operator', async () => {
      const operatorId = 'mockOperatorId';
      const expectedTrips = [
        { _id: 'trip1', operatorId },
        { _id: 'trip2', operatorId }
      ];
      
      const mockExec = jest.fn().mockResolvedValue(expectedTrips);
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec });
      
      Trip.find.mockReturnValue({
        populate: mockPopulate
      });
      
      const result = await tripRepository.getTrip(operatorId);
      
      expect(Trip.find).toHaveBeenCalledWith({ operatorId });
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('Fetching trips from DB for operator ID'));
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('updateTrip', () => {
    it('should update a trip with allowed fields', async () => {
      const tripId = 'mockTripId';
      const updateData = {
        departureTime: '2023-06-01T10:00:00Z',
        arrivalTime: '2023-06-01T16:00:00Z',
        price: 900,
        status: 'Scheduled',
        availableSeats: 35,
        notAllowedField: 'This should be filtered out'
      };
      
      const updatedTrip = {
        _id: tripId,
        departureTime: new Date(updateData.departureTime),
        arrivalTime: new Date(updateData.arrivalTime),
        price: updateData.price,
        status: updateData.status,
        availableSeats: updateData.availableSeats
      };
      
      Trip.findByIdAndUpdate.mockResolvedValue(updatedTrip);
      
      const result = await tripRepository.updateTrip(tripId, updateData);
      
      expect(Trip.findByIdAndUpdate).toHaveBeenCalledWith(
        tripId,
        expect.objectContaining({
          departureTime: expect.any(Date),
          arrivalTime: expect.any(Date),
          price: updateData.price,
          status: updateData.status,
          availableSeats: updateData.availableSeats
        }),
        { new: true, runValidators: true }
      );
      expect(appLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Modifying trip'),
        expect.anything()
      );
      expect(result).toEqual(updatedTrip);
    });

    it('should return null when trip is not found for update', async () => {
      const tripId = 'nonExistentTripId';
      const updateData = { price: 900 };
      
      Trip.findByIdAndUpdate.mockResolvedValue(null);
      
      const result = await tripRepository.updateTrip(tripId, updateData);
      
      expect(result).toBeNull();
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Trip with ID'));
    });

    it('should handle errors during update', async () => {
      const tripId = 'mockTripId';
      const updateData = { price: 900 };
      const error = new Error('Database error');
      
      Trip.findByIdAndUpdate.mockRejectedValue(error);
      
      await expect(tripRepository.updateTrip(tripId, updateData)).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error modifying trip'));
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip', async () => {
      const tripId = 'mockTripId';
      const deletedTrip = {
        _id: tripId,
        source: 'Bangalore',
        destination: 'Chennai'
      };
      
      Trip.findByIdAndDelete.mockResolvedValue(deletedTrip);
      
      const result = await tripRepository.deleteTrip(tripId);
      
      expect(Trip.findByIdAndDelete).toHaveBeenCalledWith(tripId);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('Deleting trip from DB'));
      expect(result).toEqual(deletedTrip);
    });

    it('should return null when trip is not found for deletion', async () => {
      const tripId = 'nonExistentTripId';
      
      Trip.findByIdAndDelete.mockResolvedValue(null);
      
      const result = await tripRepository.deleteTrip(tripId);
      
      expect(result).toBeNull();
    });
  });
});