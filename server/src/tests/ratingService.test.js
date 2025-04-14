import ratingService from '../services/ratingService.js';
import ratingRepository from '../repositories/ratingRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';
import tripRepository from '../repositories/tripRepository.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/ratingRepository.js');
jest.mock('../repositories/bookingRepository.js');
jest.mock('../repositories/tripRepository.js');
jest.mock('../utils/logger.js');

describe('RatingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitRating', () => {
    const userId = 'user123';
    const bookingId = 'booking123';
    const ratingData = {
      rating: 4.5,
      review: 'Great service and comfortable journey!'
    };

    it('should submit a rating successfully', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: { _id: userId },
        tripId: 'trip123',
        paymentStatus: 'success'
      };
      
      const mockTrip = {
        _id: 'trip123',
        busId: 'bus123',
        arrivalTime: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      };
      
      const mockRating = {
        _id: 'rating123',
        bookingId,
        userId,
        busId: mockTrip.busId,
        tripId: mockTrip._id,
        rating: ratingData.rating,
        review: ratingData.review
      };

      bookingRepository.getBookingById.mockResolvedValue(mockBooking);
      tripRepository.getTripById.mockResolvedValue(mockTrip);
      ratingRepository.getRatingByBookingId.mockResolvedValue(null); // No existing rating
      ratingRepository.createRating.mockResolvedValue(mockRating);

      const result = await ratingService.submitRating(userId, bookingId, ratingData);

      expect(bookingRepository.getBookingById).toHaveBeenCalledWith(bookingId);
      expect(tripRepository.getTripById).toHaveBeenCalledWith(mockBooking.tripId);
      expect(ratingRepository.getRatingByBookingId).toHaveBeenCalledWith(bookingId);
      expect(ratingRepository.createRating).toHaveBeenCalledWith({
        bookingId,
        userId,
        busId: mockTrip.busId,
        tripId: mockTrip._id,
        rating: ratingData.rating,
        review: ratingData.review
      });
      expect(appLogger.info).toHaveBeenCalledWith(`User ${userId} successfully rated booking ${bookingId}`);
      expect(result).toEqual(mockRating);
    });

    it('should throw error if booking not found', async () => {
      bookingRepository.getBookingById.mockResolvedValue(null);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('Booking not found');
      expect(appLogger.warn).toHaveBeenCalledWith(`Attempt to rate non-existent booking: ${bookingId}`);
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should throw error if booking belongs to another user', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: 'different-user',
        tripId: 'trip123',
        paymentStatus: 'success'
      };
      
      bookingRepository.getBookingById.mockResolvedValue(mockBooking);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('You can only rate your own bookings');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to rate booking ${bookingId} that doesn't belong to them`
      );
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should throw error if payment is not successful', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: { _id: userId },
        tripId: 'trip123',
        paymentStatus: 'pending'
      };
      
      bookingRepository.getBookingById.mockResolvedValue(mockBooking);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('You can only rate completed bookings with successful payment');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to rate booking ${bookingId} that hasn't been paid for`
      );
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should throw error if trip not found', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: { _id: userId },
        tripId: 'trip123',
        paymentStatus: 'success'
      };
      
      bookingRepository.getBookingById.mockResolvedValue(mockBooking);
      tripRepository.getTripById.mockResolvedValue(null);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('Trip not found');
      expect(appLogger.warn).toHaveBeenCalledWith(`Trip not found for booking: ${bookingId}`);
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should throw error if trip is not completed yet', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: { _id: userId },
        tripId: 'trip123',
        paymentStatus: 'success'
      };
      
      const mockTrip = {
        _id: 'trip123',
        busId: 'bus123',
        arrivalTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day in future
      };
      
      bookingRepository.getBookingById.mockResolvedValue(mockBooking);
      tripRepository.getTripById.mockResolvedValue(mockTrip);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('You can only rate trips that have been completed');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to rate booking ${bookingId} for a trip that hasn't been completed`
      );
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should throw error if booking already rated', async () => {
      const mockBooking = {
        _id: bookingId,
        userId: { _id: userId },
        tripId: 'trip123',
        paymentStatus: 'success'
      };
      
      const mockTrip = {
        _id: 'trip123',
        busId: 'bus123',
        arrivalTime: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      };
      
      const existingRating = {
        _id: 'rating123',
        bookingId,
        userId,
        rating: 5
      };
      
      bookingRepository.getBookingById.mockResolvedValue(mockBooking);
      tripRepository.getTripById.mockResolvedValue(mockTrip);
      ratingRepository.getRatingByBookingId.mockResolvedValue(existingRating);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('You have already rated this booking');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to rate booking ${bookingId} more than once`
      );
      expect(ratingRepository.createRating).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      bookingRepository.getBookingById.mockRejectedValue(error);

      await expect(ratingService.submitRating(userId, bookingId, ratingData))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error submitting rating: ${error.message}`);
    });
  });

  describe('updateRating', () => {
    const userId = 'user123';
    const ratingId = 'rating123';
    const updateData = {
      rating: 3.5,
      review: 'Updated review'
    };

    it('should update rating successfully', async () => {
      const mockRating = {
        _id: ratingId,
        userId: { _id: userId },
        rating: 4.5,
        review: 'Original review'
      };

      const updatedRating = {
        _id: ratingId,
        userId: { _id: userId },
        rating: updateData.rating,
        review: updateData.review
      };
      
      ratingRepository.getRatingById.mockResolvedValue(mockRating);
      ratingRepository.updateRating.mockResolvedValue(updatedRating);

      const result = await ratingService.updateRating(userId, ratingId, updateData);

      expect(ratingRepository.getRatingById).toHaveBeenCalledWith(ratingId);
      expect(ratingRepository.updateRating).toHaveBeenCalledWith(ratingId, {
        rating: updateData.rating,
        review: updateData.review
      });
      expect(appLogger.info).toHaveBeenCalledWith(`User ${userId} successfully updated rating ${ratingId}`);
      expect(result).toEqual(updatedRating);
    });

    it('should throw error if rating not found', async () => {
      ratingRepository.getRatingById.mockResolvedValue(null);

      await expect(ratingService.updateRating(userId, ratingId, updateData))
        .rejects.toThrow('Rating not found');
      expect(appLogger.warn).toHaveBeenCalledWith(`Attempt to update non-existent rating: ${ratingId}`);
      expect(ratingRepository.updateRating).not.toHaveBeenCalled();
    });

    it('should throw error if rating belongs to another user', async () => {
      const mockRating = {
        _id: ratingId,
        userId: { _id: 'different-user' },
        rating: 4.5
      };
      
      ratingRepository.getRatingById.mockResolvedValue(mockRating);

      await expect(ratingService.updateRating(userId, ratingId, updateData))
        .rejects.toThrow('You can only update your own ratings');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to update rating ${ratingId} that doesn't belong to them`
      );
      expect(ratingRepository.updateRating).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getRatingById.mockRejectedValue(error);

      await expect(ratingService.updateRating(userId, ratingId, updateData))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error updating rating: ${error.message}`);
    });
  });

  describe('deleteRating', () => {
    const userId = 'user123';
    const ratingId = 'rating123';

    it('should delete rating successfully', async () => {
      const mockRating = {
        _id: ratingId,
        userId: { _id: userId },
        rating: 4.5
      };
      
      ratingRepository.getRatingById.mockResolvedValue(mockRating);
      ratingRepository.deleteRating.mockResolvedValue({ acknowledged: true });

      const result = await ratingService.deleteRating(userId, ratingId);

      expect(ratingRepository.getRatingById).toHaveBeenCalledWith(ratingId);
      expect(ratingRepository.deleteRating).toHaveBeenCalledWith(ratingId);
      expect(appLogger.info).toHaveBeenCalledWith(`User ${userId} successfully deleted rating ${ratingId}`);
      expect(result).toEqual({ success: true, message: 'Rating deleted successfully' });
    });

    it('should throw error if rating not found', async () => {
      ratingRepository.getRatingById.mockResolvedValue(null);

      await expect(ratingService.deleteRating(userId, ratingId))
        .rejects.toThrow('Rating not found');
      expect(appLogger.warn).toHaveBeenCalledWith(`Attempt to delete non-existent rating: ${ratingId}`);
      expect(ratingRepository.deleteRating).not.toHaveBeenCalled();
    });

    it('should throw error if rating belongs to another user', async () => {
      const mockRating = {
        _id: ratingId,
        userId: { _id: 'different-user' },
        rating: 4.5
      };
      
      ratingRepository.getRatingById.mockResolvedValue(mockRating);

      await expect(ratingService.deleteRating(userId, ratingId))
        .rejects.toThrow('You can only delete your own ratings');
      expect(appLogger.warn).toHaveBeenCalledWith(
        `User ${userId} attempted to delete rating ${ratingId} that doesn't belong to them`
      );
      expect(ratingRepository.deleteRating).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getRatingById.mockRejectedValue(error);

      await expect(ratingService.deleteRating(userId, ratingId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error deleting rating: ${error.message}`);
    });
  });

  describe('getRatingsByUserId', () => {
    const userId = 'user123';
    
    it('should return user ratings successfully', async () => {
      const mockRatings = [
        { _id: 'rating1', userId, rating: 4.5 },
        { _id: 'rating2', userId, rating: 3.0 }
      ];
      
      ratingRepository.getRatingsByUserId.mockResolvedValue(mockRatings);

      const result = await ratingService.getRatingsByUserId(userId);

      expect(ratingRepository.getRatingsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockRatings);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getRatingsByUserId.mockRejectedValue(error);

      await expect(ratingService.getRatingsByUserId(userId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching ratings for user ${userId}: ${error.message}`);
    });
  });

  describe('getRatingsByBusId', () => {
    const busId = 'bus123';
    
    it('should return bus ratings successfully', async () => {
      const mockRatings = [
        { _id: 'rating1', busId, rating: 4.5 },
        { _id: 'rating2', busId, rating: 3.0 }
      ];
      
      ratingRepository.getRatingsByBusId.mockResolvedValue(mockRatings);

      const result = await ratingService.getRatingsByBusId(busId);

      expect(ratingRepository.getRatingsByBusId).toHaveBeenCalledWith(busId);
      expect(result).toEqual(mockRatings);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getRatingsByBusId.mockRejectedValue(error);

      await expect(ratingService.getRatingsByBusId(busId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching ratings for bus ${busId}: ${error.message}`);
    });
  });

  describe('getRatingForBooking', () => {
    const bookingId = 'booking123';
    
    it('should return booking rating successfully', async () => {
      const mockRating = { _id: 'rating1', bookingId, rating: 4.5 };
      
      ratingRepository.getRatingByBookingId.mockResolvedValue(mockRating);

      const result = await ratingService.getRatingForBooking(bookingId);

      expect(ratingRepository.getRatingByBookingId).toHaveBeenCalledWith(bookingId);
      expect(result).toEqual(mockRating);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getRatingByBookingId.mockRejectedValue(error);

      await expect(ratingService.getRatingForBooking(bookingId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching rating for booking ${bookingId}: ${error.message}`);
    });
  });

  describe('getBusAverageRating', () => {
    const busId = 'bus123';
    
    it('should return bus average rating successfully', async () => {
      const mockAvgRating = { average: 4.2, count: 5 };
      
      ratingRepository.getAverageRatingForBus.mockResolvedValue(mockAvgRating);

      const result = await ratingService.getBusAverageRating(busId);

      expect(ratingRepository.getAverageRatingForBus).toHaveBeenCalledWith(busId);
      expect(result).toEqual(mockAvgRating);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      ratingRepository.getAverageRatingForBus.mockRejectedValue(error);

      await expect(ratingService.getBusAverageRating(busId))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error getting average rating for bus ${busId}: ${error.message}`);
    });
  });
});
