import Rating from '../models/rating.js';
import mongoose from 'mongoose';
import { appLogger } from '../utils/logger.js';

class RatingRepository {
    async createRating(ratingData) {
        try {
            const rating = new Rating(ratingData);
            return await rating.save();
        } catch (error) {
            appLogger.error(`Error creating rating: ${error.message}`);
            throw error;
        }
    }

    async getRatingById(ratingId) {
        try {
            return await Rating.findById(ratingId)
                .populate('userId', 'name');
        } catch (error) {
            appLogger.error(`Error fetching rating by ID ${ratingId}: ${error.message}`);
            throw error;
        }
    }

    async getAverageRatingForBus(busId) {
        try {
            const result = await Rating.aggregate([
                { $match: { busId: new mongoose.Types.ObjectId(busId) } },
                { $group: { _id: '$busId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]);
            return result.length > 0 ? result[0] : { _id: busId, averageRating: 0, count: 0 };
        } catch (error) {
            appLogger.error(`Error calculating average rating for bus ${busId}: ${error.message}`);
            throw error;
        }
    }

    async getAverageRatingForTrip(tripId) {
        try {
            const result = await Rating.aggregate([
                { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
                { $group: { _id: '$tripId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]);
            return result.length > 0 ? result[0] : { _id: tripId, averageRating: 0, count: 0 };
        } catch (error) {
            appLogger.error(`Error calculating average rating for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async getRatingsByTripId(tripId) {
        try {
            return await Rating.find({ tripId })
                .populate('userId', 'name')
                .sort({ createdAt: -1 });
        } catch (error) {
            appLogger.error(`Error fetching ratings for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async getRatingsByUserId(userId) {
        try {
            return await Rating.find({ userId })
                .populate('busId', 'busNumber name')
                .populate('tripId', 'source destination departureTime')
                .sort({ createdAt: -1 });
        } catch (error) {
            appLogger.error(`Error fetching ratings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getRatingByBookingId(bookingId) {
        try {
            return await Rating.findOne({ bookingId })
                .populate('userId', 'name');
        } catch (error) {
            appLogger.error(`Error fetching rating for booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async updateRating(ratingId, updateData) {
        try {
            return await Rating.findByIdAndUpdate(
                ratingId,
                { $set: updateData },
                { new: true }
            );
        } catch (error) {
            appLogger.error(`Error updating rating ${ratingId}: ${error.message}`);
            throw error;
        }
    }

    async deleteRating(ratingId) {
        try {
            return await Rating.findByIdAndDelete(ratingId);
        } catch (error) {
            appLogger.error(`Error deleting rating ${ratingId}: ${error.message}`);
            throw error;
        }
    }
}

export default new RatingRepository();
