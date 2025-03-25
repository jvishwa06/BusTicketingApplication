jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    silent: false,
  };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      colorize: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
    },
    transports: {
      File: jest.fn(),
      Console: jest.fn(),
    },
  };
});

const TripService = require('../services/tripService.js');
const TripRepository = require('../repositories/TripRepository');
const BookingRepository = require('../repositories/bookingRepository');
const appLogger = require('../utils/appLogger');

jest.mock('../repositories/tripRepository');
jest.mock('../repositories/bookingRepository');
jest.mock('../utils/appLogger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('TripService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      const tripData = { busDetails: { totalSeats: 50 } };
      const operatorId = 'op1';
      const trip = { _id: 'trip1', ...tripData, operator: operatorId, availableSeats: 50 };

      TripRepository.create.mockResolvedValue(trip);

      const result = await TripService.createTrip(tripData, operatorId);

      expect(TripRepository.create).toHaveBeenCalledWith({
        ...tripData,
        operator: operatorId,
        availableSeats: 50,
      });
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Trip created', tripId: 'trip1', operatorId });
      expect(result).toEqual(trip);
    });
  });

  describe('getOperatorTrips', () => {
    it('should fetch trips for an operator', async () => {
      const operatorId = 'op1';
      const trips = [{ _id: 'trip1' }, { _id: 'trip2' }];
      TripRepository.findByOperator.mockResolvedValue(trips);

      const result = await TripService.getOperatorTrips(operatorId);

      expect(TripRepository.findByOperator).toHaveBeenCalledWith(operatorId);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Fetched operator trips', operatorId, count: 2 });
      expect(result).toEqual(trips);
    });
  });

  describe('getTrip', () => {
    it('should fetch a trip by ID and operator', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const trip = { _id: tripId };
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);

      const result = await TripService.getTrip(tripId, operatorId);

      expect(TripRepository.findByIdAndOperator).toHaveBeenCalledWith(tripId, operatorId);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Fetched trip', tripId });
      expect(result).toEqual(trip);
    });

    it('should throw an error if trip not found', async () => {
      TripRepository.findByIdAndOperator.mockResolvedValue(null);

      await expect(TripService.getTrip('trip1', 'op1')).rejects.toThrow('Trip not found');
    });
  });

  describe('updateTrip', () => {
    it('should update a trip successfully', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const updates = { status: 'active' };
      const trip = { _id: tripId, ...updates };
      TripRepository.update.mockResolvedValue(trip);

      const result = await TripService.updateTrip(tripId, operatorId, updates);

      expect(TripRepository.update).toHaveBeenCalledWith(tripId, operatorId, updates);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Updated trip', tripId });
      expect(result).toEqual(trip);
    });

    it('should throw an error if trip not found', async () => {
      TripRepository.update.mockResolvedValue(null);

      await expect(TripService.updateTrip('trip1', 'op1', {})).rejects.toThrow('Trip not found');
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a trip and update bookings', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const trip = { _id: tripId, status: 'active' };
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);
      TripRepository.update.mockResolvedValue({ ...trip, status: 'cancelled' });
      BookingRepository.updateManyByTripId.mockResolvedValue();

      const result = await TripService.cancelTrip(tripId, operatorId);

      expect(TripRepository.update).toHaveBeenCalledWith(tripId, operatorId, { status: 'cancelled' });
      expect(BookingRepository.updateManyByTripId).toHaveBeenCalledWith(tripId, { status: 'cancelled', paymentStatus: 'refunded' });
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Trip cancelled', tripId });
      expect(result.status).toBe('cancelled');
    });
  });

  describe('getTripAnalytics', () => {
    it('should generate trip analytics', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const trip = { _id: tripId };
      const bookings = [
        { status: 'confirmed', amount: 100, feedback: { rating: 4 } },
        { status: 'cancelled', amount: 50 },
      ];
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);
      BookingRepository.findByTripId.mockResolvedValue(bookings);

      const result = await TripService.getTripAnalytics(tripId, operatorId);

      expect(result).toEqual({
        totalBookings: 2,
        confirmedBookings: 1,
        cancelledBookings: 1,
        totalRevenue: 150,
        averageRating: 2, // (4 + 0) / 2
      });
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Generated trip analytics', tripId, totalBookings: 2 });
    });
  });

  describe('getSeatAvailability', () => {
    it('should calculate seat availability', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const trip = { _id: tripId, busDetails: { totalSeats: 5 } };
      const bookings = [{ seatNumber: 1 }, { seatNumber: 3 }];
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);
      BookingRepository.findConfirmedByTripId.mockResolvedValue(bookings);

      const result = await TripService.getSeatAvailability(tripId, operatorId);

      expect(result).toEqual({
        totalSeats: 5,
        availableSeats: [2, 4, 5],
        bookedSeats: [1, 3],
      });
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Fetched seat availability', tripId, availableSeats: 3 });
    });
  });
});