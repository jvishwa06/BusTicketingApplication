import ratingRepository from '../repositories/ratingRepository.js';
import bookingRepository from '../repositories/bookingRepository.js';
import tripRepository from '../repositories/tripRepository.js';
import { appLogger } from '../utils/logger.js';

class RatingService {
    async submitRating(userId, bookingId, ratingData) {
        try {
            const booking = await bookingRepository.getBookingById(bookingId);
            
            if (!booking) {
                appLogger.warn(`Attempt to rate non-existent booking: ${bookingId}`);
                throw new Error('Booking not found');
            }
            
            const bookingUserId = booking.userId._id ? booking.userId._id.toString() : booking.userId.toString();
            if (bookingUserId !== userId.toString()) {
                appLogger.warn(`User ${userId} attempted to rate booking ${bookingId} that doesn't belong to them`);
                throw new Error('You can only rate your own bookings');
            }

            if (booking.paymentStatus !== 'success') {
                appLogger.warn(`User ${userId} attempted to rate booking ${bookingId} that hasn't been paid for`);
                throw new Error('You can only rate completed bookings with successful payment');
            }

            const trip = await tripRepository.getTripById(booking.tripId);
            
            if (!trip) {
                appLogger.warn(`Trip not found for booking: ${bookingId}`);
                throw new Error('Trip not found');
            }

            const now = new Date();
            if (trip.arrivalTime > now) {
                appLogger.warn(`User ${userId} attempted to rate booking ${bookingId} for a trip that hasn't been completed`);
                throw new Error('You can only rate trips that have been completed');
            }

            const existingRating = await ratingRepository.getRatingByBookingId(bookingId);
            if (existingRating) {
                appLogger.warn(`User ${userId} attempted to rate booking ${bookingId} more than once`);
                throw new Error('You have already rated this booking');
            }

            const rating = await ratingRepository.createRating({
                bookingId,
                userId,
                busId: trip.busId,
                tripId: trip._id,
                rating: ratingData.rating,
                review: ratingData.review || ''
            });

            appLogger.info(`User ${userId} successfully rated booking ${bookingId}`);
            return rating;
        } catch (error) {
            appLogger.error(`Error submitting rating: ${error.message}`);
            throw error;
        }
    }

    async getRatingsByUserId(userId) {
        try {
            return await ratingRepository.getRatingsByUserId(userId);
        } catch (error) {
            appLogger.error(`Error fetching ratings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getRatingsByTripId(tripId) {
        try {
            return await ratingRepository.getRatingsByTripId(tripId);
        } catch (error) {
            appLogger.error(`Error fetching ratings for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }
    
    async updateRating(userId, ratingId, updateData) {
        try {
            const rating = await ratingRepository.getRatingById(ratingId);
            
            if (!rating) {
                appLogger.warn(`Attempt to update non-existent rating: ${ratingId}`);
                throw new Error('Rating not found');
            }
            
            const ratingUserId = rating.userId._id ? rating.userId._id.toString() : rating.userId.toString();
            if (ratingUserId !== userId.toString()) {
                appLogger.warn(`User ${userId} attempted to update rating ${ratingId} that doesn't belong to them`);
                throw new Error('You can only update your own ratings');
            }

            const allowedUpdates = {
                rating: updateData.rating,
                review: updateData.review
            };

            const updatedRating = await ratingRepository.updateRating(ratingId, allowedUpdates);
            appLogger.info(`User ${userId} successfully updated rating ${ratingId}`);
            
            return updatedRating;
        } catch (error) {
            appLogger.error(`Error updating rating: ${error.message}`);
            throw error;
        }
    }

    async deleteRating(userId, ratingId) {
        try {
            const rating = await ratingRepository.getRatingById(ratingId);
            
            if (!rating) {
                appLogger.warn(`Attempt to delete non-existent rating: ${ratingId}`);
                throw new Error('Rating not found');
            }
            
            const ratingUserId = rating.userId._id ? rating.userId._id.toString() : rating.userId.toString();
            if (ratingUserId !== userId.toString()) {
                appLogger.warn(`User ${userId} attempted to delete rating ${ratingId} that doesn't belong to them`);
                throw new Error('You can only delete your own ratings');
            }

            await ratingRepository.deleteRating(ratingId);
            appLogger.info(`User ${userId} successfully deleted rating ${ratingId}`);
            
            return { success: true, message: 'Rating deleted successfully' };
        } catch (error) {
            appLogger.error(`Error deleting rating: ${error.message}`);
            throw error;
        }
    }
}

export default new RatingService();
