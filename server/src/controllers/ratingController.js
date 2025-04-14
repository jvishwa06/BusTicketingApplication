import ratingService from '../services/ratingService.js';
import { appLogger } from '../utils/logger.js';

class RatingController {
    static async submitRating(req, res, next) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;
            const ratingData = req.body;

            const rating = await ratingService.submitRating(userId, bookingId, ratingData);

            appLogger.info(`Rating submitted for booking ${bookingId} by user ${userId}`);
            res.status(201).json({
                success: true,
                message: 'Rating submitted successfully',
                data: rating
            });
        } catch (error) {
            appLogger.error(`Rating submission failed: ${error.message}`);
            next(error);
        }
    }

    static async updateRating(req, res, next) {
        try {
            const { ratingId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const updatedRating = await ratingService.updateRating(userId, ratingId, updateData);

            appLogger.info(`Rating ${ratingId} updated by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Rating updated successfully',
                data: updatedRating
            });
        } catch (error) {
            appLogger.error(`Rating update failed: ${error.message}`);
            next(error);
        }
    }

    static async deleteRating(req, res, next) {
        try {
            const { ratingId } = req.params;
            const userId = req.user.id;

            await ratingService.deleteRating(userId, ratingId);

            appLogger.info(`Rating ${ratingId} deleted by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Rating deleted successfully'
            });
        } catch (error) {
            appLogger.error(`Rating deletion failed: ${error.message}`);
            next(error);
        }
    }

    static async getUserRatings(req, res, next) {
        try {
            const userId = req.user.id;

            const ratings = await ratingService.getRatingsByUserId(userId);

            appLogger.info(`Ratings retrieved for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'User ratings retrieved successfully',
                data: ratings
            });
        } catch (error) {
            appLogger.error(`Retrieving user ratings failed: ${error.message}`);
            next(error);
        }
    }

    static async getBusRatings(req, res, next) {
        try {
            const { busId } = req.params;

            const ratings = await ratingService.getRatingsByBusId(busId);
            const averageRating = await ratingService.getBusAverageRating(busId);

            appLogger.info(`Ratings retrieved for bus ${busId}`);
            res.status(200).json({
                success: true,
                message: 'Bus ratings retrieved successfully',
                data: {
                    ratings,
                    averageRating: averageRating.averageRating,
                    totalRatings: averageRating.count
                }
            });
        } catch (error) {
            appLogger.error(`Retrieving bus ratings failed: ${error.message}`);
            next(error);
        }
    }

    static async getBookingRating(req, res, next) {
        try {
            const { bookingId } = req.params;

            const rating = await ratingService.getRatingForBooking(bookingId);

            appLogger.info(`Rating retrieved for booking ${bookingId}`);
            res.status(200).json({
                success: true,
                message: 'Booking rating retrieved successfully',
                data: rating
            });
        } catch (error) {
            appLogger.error(`Retrieving booking rating failed: ${error.message}`);
            next(error);
        }
    }
}

export default RatingController;
