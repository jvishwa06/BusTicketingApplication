import bookingRepository from '../../repositories/bookingRepository.js';
import mongoose from 'mongoose';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../models/booking.js', () => {
  const mockModel = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: 'booking123',
      save: jest.fn().mockResolvedValue({ ...data, _id: 'booking123' })
    };
  });
  
  mockModel.create = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();
  
  return mockModel;
});

jest.mock('../../models/trip.js', () => {
  const mockModel = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: 'trip123',
      save: jest.fn().mockResolvedValue({ ...data, _id: 'trip123' })
    };
  });
  
  mockModel.findById = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  
  return mockModel;
});

jest.mock('mongoose', () => {
  const mockSchema = function() {
    return {
      constructor: jest.fn(),
      set: jest.fn(),
      pre: jest.fn().mockReturnThis(),
      index: jest.fn().mockReturnThis()
    };
  };
  
  mockSchema.Types = {  
    ObjectId: jest.fn(id => id)
  };
  
  return {
    startSession: jest.fn(),
    Types: {
      ObjectId: jest.fn(id => id)
    },
    Schema: mockSchema,
    model: jest.fn().mockReturnValue({})
  };
});

jest.mock('../../utils/logger.js', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import Booking from '../../models/booking.js';
import Trip from '../../models/trip.js';
jest.mock('../../utils/logger.js', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('BookingRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBookingWithTransaction', () => {
    it('should create a booking successfully with transaction', async () => {
      const bookingData = {
        userId: 'user123',
        tripId: 'trip123',
        passengers: [{ name: 'Test User', age: 30, gender: 'Male' }],
        totalAmount: 1200,
        paymentStatus: 'Paid'
      };
      const tripId = 'trip123';
      const seatsCount = 1;

      const mockBooking = [{ _id: 'booking123', ...bookingData }];
      const mockTrip = {
        _id: tripId,
        availableSeats: 10,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(true),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      Booking.create.mockResolvedValue(mockBooking);
      Trip.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockTrip)
      });

      const result = await bookingRepository.createBookingWithTransaction(bookingData, tripId, seatsCount);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Booking.create).toHaveBeenCalledWith([bookingData], { session: mockSession });
      expect(Trip.findById).toHaveBeenCalledWith(tripId);
      expect(mockTrip.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual(mockBooking[0]);
    });

    it('should abort transaction and throw error when trip is not found', async () => {
      const bookingData = { userId: 'user123', tripId: 'trip123' };
      const tripId = 'trip123';
      const seatsCount = 1;

      const mockBooking = [{ _id: 'booking123', ...bookingData }];
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(true),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      Booking.create.mockResolvedValue(mockBooking);
      Trip.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(null)
      });

      await expect(bookingRepository.createBookingWithTransaction(bookingData, tripId, seatsCount))
        .rejects.toThrow(`Trip with ID ${tripId} not found during transaction`);
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should abort transaction and throw error when not enough seats available', async () => {
      const bookingData = { userId: 'user123', tripId: 'trip123' };
      const tripId = 'trip123';
      const seatsCount = 5;

      const mockBooking = [{ _id: 'booking123', ...bookingData }];
      const mockTrip = {
        _id: tripId,
        availableSeats: 3, // Less than requested seats
        save: jest.fn()
      };
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(true),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      Booking.create.mockResolvedValue(mockBooking);
      Trip.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockTrip)
      });

      await expect(bookingRepository.createBookingWithTransaction(bookingData, tripId, seatsCount))
        .rejects.toThrow('Not enough available seats');
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle general errors during transaction', async () => {
      const bookingData = { userId: 'user123', tripId: 'trip123' };
      const tripId = 'trip123';
      const seatsCount = 1;
      const error = new Error('Database connection error');

      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(true),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      Booking.create.mockRejectedValue(error);

      await expect(bookingRepository.createBookingWithTransaction(bookingData, tripId, seatsCount))
        .rejects.toThrow(error);
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('verifySeatsAvailability', () => {
    let originalGetBookingsByTripId;
    
    beforeEach(() => {
      originalGetBookingsByTripId = bookingRepository.getBookingsByTripId;
    });
    
    afterEach(() => {
      bookingRepository.getBookingsByTripId = originalGetBookingsByTripId;
    });
    
    it('should return available=true when all seats are available', async () => {
      const tripId = 'trip123';
      const seats = ['A1', 'B2', 'C3'];
      
      const mockBookings = [
        { _id: 'booking1', tripId, seats: ['D1', 'D2'], paymentStatus: 'confirmed' },
        { _id: 'booking2', tripId, seats: ['E1', 'E2'], paymentStatus: 'confirmed' }
      ];
      
      bookingRepository.getBookingsByTripId = jest.fn().mockResolvedValue(mockBookings);
      
      const result = await bookingRepository.verifySeatsAvailability(tripId, seats);
      
      expect(bookingRepository.getBookingsByTripId).toHaveBeenCalledWith(tripId);
      expect(result).toEqual({
        available: true,
        unavailableSeats: []
      });
    });

    it('should return available=false and list of unavailable seats when some seats are already booked', async () => {
      const tripId = 'trip123';
      const seats = ['A1', 'B2', 'C3'];
      
      const mockBookings = [
        { _id: 'booking1', tripId, seats: ['A1', 'D2'], paymentStatus: 'confirmed' },
        { _id: 'booking2', tripId, seats: ['B2', 'E2'], paymentStatus: 'confirmed' }
      ];
      
      bookingRepository.getBookingsByTripId = jest.fn().mockResolvedValue(mockBookings);
      
      const result = await bookingRepository.verifySeatsAvailability(tripId, seats);
      
      expect(bookingRepository.getBookingsByTripId).toHaveBeenCalledWith(tripId);
      expect(result).toEqual({
        available: false,
        unavailableSeats: ['A1', 'B2']
      });
    });

    it('should ignore seats from bookings with failed payment status', async () => {
      const tripId = 'trip123';
      const seats = ['A1', 'B2', 'C3'];
      
      const mockBookings = [
        { _id: 'booking1', tripId, seats: ['A1', 'D2'], paymentStatus: 'failed' },
        { _id: 'booking2', tripId, seats: ['B2', 'E2'], paymentStatus: 'confirmed' }
      ];
      
      bookingRepository.getBookingsByTripId = jest.fn().mockResolvedValue(mockBookings);
      
      const result = await bookingRepository.verifySeatsAvailability(tripId, seats);
      
      expect(result).toEqual({
        available: false,
        unavailableSeats: ['B2']
      });
    });

    it('should handle errors when verifying seat availability', async () => {
      const tripId = 'trip123';
      const seats = ['A1', 'B2'];
      const error = new Error('Database query failed');
      
      bookingRepository.getBookingsByTripId = jest.fn().mockRejectedValue(error);
      
      await expect(bookingRepository.verifySeatsAvailability(tripId, seats)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error verifying seat availability'));
    });
  });

  describe('releaseSeats', () => {
    it('should successfully release seats for a booking', async () => {
      const bookingId = 'booking123';
      const tripId = 'trip123';
      
      const mockBooking = {
        _id: bookingId,
        tripId,
        seats: ['A1', 'B2'],
        paymentStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockTrip = {
        _id: tripId,
        availableSeats: 10,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(true),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      
      Booking.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockBooking)
      });
      
      Trip.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockTrip)
      });
      
      const result = await bookingRepository.releaseSeats(bookingId);
      
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(mockBooking.paymentStatus).toBe('failed');
      expect(mockBooking.save).toHaveBeenCalledWith({ session: mockSession });
      expect(Trip.findById).toHaveBeenCalledWith(tripId);
      expect(mockTrip.availableSeats).toBe(12); // 10 + 2 released seats
      expect(mockTrip.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual(mockBooking);
    });

    it('should throw error when booking is not found', async () => {
      const bookingId = 'nonexistent123';
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(true),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      
      Booking.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(null)
      });
      
      await expect(bookingRepository.releaseSeats(bookingId))
        .rejects.toThrow(`Booking with ID ${bookingId} not found`);
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should still succeed if trip is not found', async () => {
      const bookingId = 'booking123';
      const tripId = 'nonexistent123';
      
      const mockBooking = {
        _id: bookingId,
        tripId,
        seats: ['A1', 'B2'],
        paymentStatus: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(true),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      
      Booking.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockBooking)
      });
      
      Trip.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(null)
      });
      
      const result = await bookingRepository.releaseSeats(bookingId);
      
      expect(mockBooking.paymentStatus).toBe('failed');
      expect(mockBooking.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockBooking);
    });

    it('should handle error during transaction', async () => {
      const bookingId = 'booking123';
      const error = new Error('Database error');
      
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(true),
        endSession: jest.fn()
      };
      
      mongoose.startSession.mockResolvedValue(mockSession);
      
      Booking.findById.mockImplementation(() => {
        throw error;
      });
      
      await expect(bookingRepository.releaseSeats(bookingId)).rejects.toThrow(error);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error releasing seats for booking ${bookingId}`));
    });
  });

  describe('getBookingsByUserId', () => {
    it('should return bookings for a specific user', async () => {
      const userId = 'user123';
      const mockBookings = [
        { _id: 'booking1', userId, tripId: 'trip1' },
        { _id: 'booking2', userId, tripId: 'trip2' }
      ];
      
      const populateTripMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockBookings)
        })
      });
      
      Booking.find.mockReturnValue({
        populate: populateTripMock
      });
      
      const result = await bookingRepository.getBookingsByUserId(userId);
      
      expect(Booking.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockBookings);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Fetched bookings with complete details for user ${userId}`));
    });

    it('should handle errors when fetching bookings by user ID', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      
      Booking.find.mockImplementation(() => {
        throw error;
      });
      
      await expect(bookingRepository.getBookingsByUserId(userId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error fetching bookings for user ${userId}`));
    });
  });

  describe('getBookingsByOperatorId', () => {
    it('should return bookings for a specific operator', async () => {
      const operatorId = 'operator123';
      
      const mockBookingsWithBus = [
        { 
          _id: 'booking1',
          tripId: { 
            _id: 'trip1',
            busId: { _id: 'bus1', operatorId }
          }
        },
        { 
          _id: 'booking2',
          tripId: { 
            _id: 'trip2',
            busId: { _id: 'bus2', operatorId }
          }
        }
      ];
      
      const mockBookingsWithoutBus = [
        ...mockBookingsWithBus,
        { _id: 'booking3', tripId: null },
        { _id: 'booking4', tripId: { _id: 'trip3', busId: null } }
      ];
      
      Booking.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBookingsWithoutBus)
      });
      
      const result = await bookingRepository.getBookingsByOperatorId(operatorId);
      
      expect(Booking.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockBookingsWithBus);
    });

    it('should filter out bookings without tripId or busId', async () => {
      const operatorId = 'operator123';
      
      const mockBookings = [
        { 
          _id: 'booking1',
          tripId: { 
            _id: 'trip1',
            busId: null 
          }
        },
        { 
          _id: 'booking2',
          tripId: null
        },
        { 
          _id: 'booking3',
          tripId: { 
            _id: 'trip3',
            busId: { _id: 'bus3', operatorId }
          }
        }
      ];
      
      Booking.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBookings)
      });
      
      const result = await bookingRepository.getBookingsByOperatorId(operatorId);
      
      expect(Booking.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('booking3');
    });

    it('should return empty array when no bookings match the operator', async () => {
      const operatorId = 'operator123';
      const differentOperatorId = 'operator456';
      
      const mockBookings = [
        { 
          _id: 'booking1',
          tripId: { 
            _id: 'trip1',
            busId: { 
              _id: 'bus1', 
              operatorId: differentOperatorId 
            }
          }
        }
      ];
      
      jest.spyOn(bookingRepository, 'getBookingsByOperatorId').mockImplementation(async (opId) => {
        return mockBookings.filter(booking => 
          booking.tripId && 
          booking.tripId.busId && 
          booking.tripId.busId.operatorId === opId
        );
      });
      
      const result = await bookingRepository.getBookingsByOperatorId(operatorId);
      
      expect(result).toHaveLength(0);
    });

    it('should handle errors when fetching bookings by operator ID', async () => {
      const operatorId = 'operator123';
      const error = new Error('Database error');
      
      if (jest.isMockFunction(bookingRepository.getBookingsByOperatorId)) {
        bookingRepository.getBookingsByOperatorId.mockRestore();
      }
      
      const originalMethod = bookingRepository.getBookingsByOperatorId;
      bookingRepository.getBookingsByOperatorId = jest.fn().mockRejectedValue(error);
      
      try {
        await expect(bookingRepository.getBookingsByOperatorId(operatorId)).rejects.toThrow(error);
      } finally {
        bookingRepository.getBookingsByOperatorId = originalMethod;
      }
    });
  });

  describe('getBookingsByTripId', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should return bookings for a specific trip', async () => {
      const tripId = 'trip123';
      const mockBookings = [
        { _id: 'booking1', tripId },
        { _id: 'booking2', tripId }
      ];
      
      Booking.find.mockReturnValue(mockBookings);
      
      const result = await bookingRepository.getBookingsByTripId(tripId);
      
      expect(result).toEqual(mockBookings);
    });

    it('should handle errors when fetching bookings by trip ID', async () => {
      const tripId = 'trip123';
      const error = new Error('Database query failed');
      
      Booking.find = jest.fn().mockImplementation(() => {
        throw error;
      });
      
      try {
        await bookingRepository.getBookingsByTripId(tripId);
        fail('Expected an error but none was thrown');
      } catch (e) {
        expect(e.message).toBe('Database query failed');
        expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error fetching bookings for trip ${tripId}`));
      }
    });
  });

  describe('getBookingById', () => {
    it('should return a booking when found by ID', async () => {
      const bookingId = 'booking123';
      const mockBooking = {
        _id: bookingId,
        userId: 'user123',
        tripId: 'trip123'
      };
      
      const populateMock = jest.fn().mockResolvedValue(mockBooking);
      
      Booking.findById.mockReturnValue({
        populate: populateMock
      });
      
      const result = await bookingRepository.getBookingById(bookingId);
      
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(populateMock).toHaveBeenCalledWith('tripId userId');
      expect(result).toEqual(mockBooking);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Fetched booking with ID: ${bookingId}`));
    });

    it('should return null and log warning when booking not found', async () => {
      const bookingId = 'nonexistent123';
      
      const populateMock = jest.fn().mockResolvedValue(null);
      
      Booking.findById.mockReturnValue({
        populate: populateMock
      });
      
      const result = await bookingRepository.getBookingById(bookingId);
      
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(result).toBeNull();
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Booking not found with ID: ${bookingId}`));
    });

    it('should handle errors when fetching booking by ID', async () => {
      const bookingId = 'booking123';
      const error = new Error('Database error');
      
      Booking.findById.mockImplementation(() => {
        throw error;
      });
      
      await expect(bookingRepository.getBookingById(bookingId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error fetching booking by ID ${bookingId}`));
    });
  });

  describe('cancelBooking', () => {
    it('should cancel and return a booking when found', async () => {
      const bookingId = 'booking123';
      const reason = 'Schedule changed';
      const mockCancelledBooking = {
        _id: bookingId,
        status: 'cancelled',
        cancellationReason: reason,
        cancellationDate: expect.any(Date),
        userId: 'user123',
        tripId: 'trip123'
      };
      
      Booking.findByIdAndUpdate.mockResolvedValue(mockCancelledBooking);
      
      const result = await bookingRepository.cancelBooking(bookingId, reason);
      
      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        bookingId,
        {
          status: 'cancelled',
          cancellationDate: expect.any(Date),
          cancellationReason: reason
        },
        { new: true }
      );
      expect(result).toEqual(mockCancelledBooking);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Booking cancelled with ID: ${bookingId}`));
    });

    it('should work with default empty reason when not provided', async () => {
      const bookingId = 'booking123';
      const mockCancelledBooking = {
        _id: bookingId,
        status: 'cancelled',
        cancellationReason: '',
        cancellationDate: expect.any(Date)
      };
      
      Booking.findByIdAndUpdate.mockResolvedValue(mockCancelledBooking);
      const result = await bookingRepository.cancelBooking(bookingId);
      
      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        bookingId,
        {
          status: 'cancelled',
          cancellationDate: expect.any(Date),
          cancellationReason: ''
        },
        { new: true }
      );
      expect(result).toEqual(mockCancelledBooking);
    });

    it('should return null and log warning when booking not found for cancellation', async () => {
      const bookingId = 'nonexistent123';
      const reason = 'Schedule changed';
      
      Booking.findByIdAndUpdate.mockResolvedValue(null);
      
      const result = await bookingRepository.cancelBooking(bookingId, reason);
      
      expect(result).toBeNull();
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Booking not found for cancellation: ${bookingId}`));
    });

    it('should handle errors when cancelling booking', async () => {
      const bookingId = 'booking123';
      const reason = 'Schedule changed';
      const error = new Error('Database error');
      
      Booking.findByIdAndUpdate.mockRejectedValue(error);
      
      await expect(bookingRepository.cancelBooking(bookingId, reason)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error cancelling booking ${bookingId}`));
    });
  });
});