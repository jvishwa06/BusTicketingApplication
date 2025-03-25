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

const BookingService = require('../services/bookingService');
const BookingRepository = require('../repositories/bookingRepository');
const TripRepository = require('../repositories/TripRepository');
const appLogger = require('../utils/appLogger');

jest.mock('../repositories/bookingRepository');
jest.mock('../repositories/tripRepository');
jest.mock('../utils/appLogger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Suppress console logs
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
});
describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTripBookings', () => {
    it('should fetch bookings for a trip', async () => {
      const tripId = 'trip1';
      const operatorId = 'op1';
      const trip = { _id: tripId };
      const bookings = [{ _id: 'b1' }, { _id: 'b2' }];
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);
      BookingRepository.findByTripId.mockResolvedValue(bookings);

      const result = await BookingService.getTripBookings(tripId, operatorId);

      expect(TripRepository.findByIdAndOperator).toHaveBeenCalledWith(tripId, operatorId);
      expect(BookingRepository.findByTripId).toHaveBeenCalledWith(tripId);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Fetched trip bookings', tripId, count: 2 });
      expect(result).toEqual(bookings);
    });

    it('should throw an error if trip not found', async () => {
      TripRepository.findByIdAndOperator.mockResolvedValue(null);

      await expect(BookingService.getTripBookings('trip1', 'op1')).rejects.toThrow('Trip not found');
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status and trip seats for confirmed', async () => {
      const bookingId = 'b1';
      const operatorId = 'op1';
      const tripId = 'trip1';
      const trip = { _id: tripId, availableSeats: 10 };
      const booking = { _id: bookingId, trip: tripId };
      TripRepository.findTripIdsByOperator.mockResolvedValue([{ _id: tripId }]);
      BookingRepository.findByIdAndTripIds.mockResolvedValue(booking);
      BookingRepository.updateStatus.mockResolvedValue({ ...booking, status: 'confirmed' });
      TripRepository.findByIdAndOperator.mockResolvedValue(trip);
      TripRepository.updateSeats.mockResolvedValue();

      const result = await BookingService.updateBookingStatus(bookingId, operatorId, 'confirmed');

      expect(BookingRepository.updateStatus).toHaveBeenCalledWith(bookingId, 'confirmed');
      expect(TripRepository.updateSeats).toHaveBeenCalledWith(tripId, 9);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Updated trip seats', tripId, availableSeats: 9 });
      expect(result.status).toBe('confirmed');
    });

    it('should throw an error if booking not found', async () => {
      TripRepository.findTripIdsByOperator.mockResolvedValue([{ _id: 'trip1' }]);
      BookingRepository.findByIdAndTripIds.mockResolvedValue(null);

      await expect(BookingService.updateBookingStatus('b1', 'op1', 'confirmed')).rejects.toThrow('Booking not found');
    });
  });

  describe('getBookingAnalytics', () => {
    it('should generate booking analytics', async () => {
      const operatorId = 'op1';
      const tripIds = [{ _id: 'trip1' }];
      const bookings = [
        { status: 'confirmed', amount: 100, feedback: { rating: 4 } },
        { status: 'cancelled', amount: 50 },
        { status: 'pending', amount: 25 },
      ];
      TripRepository.findTripIdsByOperator.mockResolvedValue(tripIds);
      BookingRepository.findByTripId.mockResolvedValue(bookings);

      const result = await BookingService.getBookingAnalytics(operatorId);

      expect(result.totalBookings).toBe(3);
      expect(result.confirmedBookings).toBe(1);
      expect(result.cancelledBookings).toBe(1);
      expect(result.totalRevenue).toBe(175);
      expect(result.averageRating).toBeCloseTo(1.33, 2); 
      expect(result.bookingsByStatus).toEqual({ pending: 1, confirmed: 1, cancelled: 1 });
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Generated booking analytics', operatorId, totalBookings: 3 });
    });
  });

  describe('getBookingDetails', () => {
    it('should fetch booking details', async () => {
      const bookingId = 'b1';
      const operatorId = 'op1';
      const tripIds = [{ _id: 'trip1' }];
      const booking = { _id: bookingId };
      TripRepository.findTripIdsByOperator.mockResolvedValue(tripIds);
      BookingRepository.findByIdAndTripIds.mockResolvedValue(booking);

      const result = await BookingService.getBookingDetails(bookingId, operatorId);

      expect(BookingRepository.findByIdAndTripIds).toHaveBeenCalledWith(bookingId, ['trip1']);
      expect(appLogger.info).toHaveBeenCalledWith({ message: 'Fetched booking details', bookingId });
      expect(result).toEqual(booking);
    });

    it('should throw an error if booking not found', async () => {
      TripRepository.findTripIdsByOperator.mockResolvedValue([{ _id: 'trip1' }]);
      BookingRepository.findByIdAndTripIds.mockResolvedValue(null);

      await expect(BookingService.getBookingDetails('b1', 'op1')).rejects.toThrow('Booking not found');
    });
  });
});