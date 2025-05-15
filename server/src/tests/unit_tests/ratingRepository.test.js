import mongoose from 'mongoose';
import RatingRepository from '../../repositories/ratingRepository.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../models/rating.js', () => {
  const mockModel = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      _id: 'rating123', 
      save: jest.fn().mockResolvedValue({ 
        ...data,
        _id: 'rating123'
      })
    };
  });
  
  mockModel.findById = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();
  mockModel.aggregate = jest.fn();
  
  return mockModel;
});

jest.mock('../../utils/logger.js', () => ({
  appLogger: {
    error: jest.fn()
  }
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({
      toString: () => id
    }))
  }
}));

import Rating from '../../models/rating.js';

describe('RatingRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('createRating', () => {
    it('should create a new rating successfully', async () => {
      const mockRatingData = {
        userId: 'user123',
        busId: 'bus123',
        tripId: 'trip123',
        rating: 4,
        comment: 'Great service'
      };
      
      const mockSave = jest.fn().mockResolvedValue({
        ...mockRatingData,
        _id: 'rating123'
      });
      
      const mockSavedRating = {
        ...mockRatingData,
        _id: 'rating123',
        save: mockSave
      };
      
      Rating.mockImplementationOnce(() => mockSavedRating);
      
      const result = await RatingRepository.createRating(mockRatingData);
      
      expect(result).toEqual({
        ...mockRatingData,
        _id: 'rating123'
      });
      expect(mockSavedRating.save).toHaveBeenCalled();
    });

    it('should throw an error when rating creation fails', async () => {
      const mockRatingData = {
        userId: 'user123',
        busId: 'bus123',
        rating: 4
      };
      
      const error = new Error('Database connection error');
      
      Rating.mockImplementationOnce(() => ({
        ...mockRatingData,
        save: jest.fn().mockRejectedValue(error)
      }));
      
      await expect(RatingRepository.createRating(mockRatingData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error creating rating: ${error.message}`);
    });
  });

  describe('getRatingById', () => {
    it('should get a rating by id successfully', async () => {
      const mockRatingId = 'rating123';
      const mockRating = {
        _id: mockRatingId,
        userId: 'user123',
        busId: 'bus123',
        rating: 4
      };
      
      const populateMock = jest.fn().mockResolvedValue(mockRating);
      Rating.findById.mockReturnValue({
        populate: populateMock
      });

      const result = await RatingRepository.getRatingById(mockRatingId);

      expect(Rating.findById).toHaveBeenCalledWith(mockRatingId);
      expect(populateMock).toHaveBeenCalledWith('userId', 'name');
      expect(result).toEqual(mockRating);
    });

    it('should throw an error when finding rating by id fails', async () => {
      const mockRatingId = 'rating123';
      const error = new Error('Rating not found');
      
      Rating.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await expect(RatingRepository.getRatingById(mockRatingId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching rating by ID ${mockRatingId}: ${error.message}`);
    });
  });

  describe('getRatingsByTripId', () => {
    it('should get all ratings for a trip successfully', async () => {
      const mockTripId = 'trip123';
      const mockRatings = [
        { _id: 'rating1', userId: 'user1', rating: 4 },
        { _id: 'rating2', userId: 'user2', rating: 5 }
      ];
      
      const sortMock = jest.fn().mockResolvedValue(mockRatings);
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
      
      Rating.find.mockReturnValue({
        populate: populateMock
      });

      const result = await RatingRepository.getRatingsByTripId(mockTripId);

      expect(Rating.find).toHaveBeenCalledWith({ tripId: mockTripId });
      expect(populateMock).toHaveBeenCalledWith('userId', 'name');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockRatings);
    });

    it('should throw an error when fetching ratings by trip id fails', async () => {
      const mockTripId = 'trip123';
      const error = new Error('Trip not found');
      
      Rating.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(error)
        })
      });

      await expect(RatingRepository.getRatingsByTripId(mockTripId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching ratings for trip ${mockTripId}: ${error.message}`);
    });
  });

  describe('getRatingsByUserId', () => {
    it('should get all ratings by a user successfully', async () => {
      const mockUserId = 'user123';
      const mockRatings = [
        { _id: 'rating1', busId: 'bus1', tripId: 'trip1', rating: 4 },
        { _id: 'rating2', busId: 'bus2', tripId: 'trip2', rating: 5 }
      ];
      
      const sortMock = jest.fn().mockResolvedValue(mockRatings);
      const populateTripMock = jest.fn().mockReturnValue({ sort: sortMock });
      const populateBusMock = jest.fn().mockReturnValue({ 
        populate: populateTripMock 
      });
      
      Rating.find.mockReturnValue({
        populate: populateBusMock
      });

      const result = await RatingRepository.getRatingsByUserId(mockUserId);

      expect(Rating.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(populateBusMock).toHaveBeenCalledWith('busId', 'busNumber name');
      expect(populateTripMock).toHaveBeenCalledWith('tripId', 'source destination departureTime');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockRatings);
    });

    it('should throw an error when fetching ratings by user id fails', async () => {
      const mockUserId = 'user123';
      const error = new Error('User not found');
      
      Rating.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(error)
          })
        })
      });

      await expect(RatingRepository.getRatingsByUserId(mockUserId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching ratings for user ${mockUserId}: ${error.message}`);
    });
  });

  describe('getRatingByBookingId', () => {
    it('should get a rating by booking id successfully', async () => {
      const mockBookingId = 'booking123';
      const mockRating = {
        _id: 'rating123',
        userId: 'user123',
        bookingId: mockBookingId,
        rating: 4
      };
      
      const populateMock = jest.fn().mockResolvedValue(mockRating);
      
      Rating.findOne.mockReturnValue({
        populate: populateMock
      });

      const result = await RatingRepository.getRatingByBookingId(mockBookingId);

      expect(Rating.findOne).toHaveBeenCalledWith({ bookingId: mockBookingId });
      expect(populateMock).toHaveBeenCalledWith('userId', 'name');
      expect(result).toEqual(mockRating);
    });

    it('should throw an error when fetching rating by booking id fails', async () => {
      const mockBookingId = 'booking123';
      const error = new Error('Booking not found');
      
      Rating.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await expect(RatingRepository.getRatingByBookingId(mockBookingId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching rating for booking ${mockBookingId}: ${error.message}`);
    });
  });

  describe('updateRating', () => {
    it('should update a rating successfully', async () => {
      const mockRatingId = 'rating123';
      const mockUpdateData = {
        rating: 5,
        comment: 'Updated comment'
      };
      const mockUpdatedRating = {
        _id: mockRatingId,
        userId: 'user123',
        rating: 5,
        comment: 'Updated comment'
      };
      
      Rating.findByIdAndUpdate.mockResolvedValue(mockUpdatedRating);

      const result = await RatingRepository.updateRating(mockRatingId, mockUpdateData);

      expect(Rating.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRatingId,
        { $set: mockUpdateData },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedRating);
    });

    it('should throw an error when updating rating fails', async () => {
      const mockRatingId = 'rating123';
      const mockUpdateData = { rating: 5 };
      const error = new Error('Rating not found');
      
      Rating.findByIdAndUpdate.mockRejectedValue(error);

      await expect(RatingRepository.updateRating(mockRatingId, mockUpdateData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error updating rating ${mockRatingId}: ${error.message}`);
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating successfully', async () => {
      const mockRatingId = 'rating123';
      const mockDeletedRating = {
        _id: mockRatingId,
        userId: 'user123',
        rating: 4
      };
      
      Rating.findByIdAndDelete.mockResolvedValue(mockDeletedRating);

      const result = await RatingRepository.deleteRating(mockRatingId);

      expect(Rating.findByIdAndDelete).toHaveBeenCalledWith(mockRatingId);
      expect(result).toEqual(mockDeletedRating);
    });

    it('should throw an error when deleting rating fails', async () => {
      const mockRatingId = 'rating123';
      const error = new Error('Rating not found');
      
      Rating.findByIdAndDelete.mockRejectedValue(error);

      await expect(RatingRepository.deleteRating(mockRatingId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error deleting rating ${mockRatingId}: ${error.message}`);
    });
  });
});