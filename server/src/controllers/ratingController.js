import ratingService from '../services/ratingService.js';
import { appLogger } from '../utils/logger.js';

class RatingController {
    static async submitRating(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;
            const ratingData = req.body;

            const rating = await ratingService.submitRating(userId, bookingId, ratingData);

            appLogger.info(`Rating submitted for booking ${bookingId} by user ${userId}`);
            res.status(201).json({success: true,message: 'Rating submitted successfully',data: rating});
        } catch (error) {
            appLogger.error(`Rating submission failed: ${error.message}`);
            return res.status(500).json({success: false,message: 'Rating submission failed',error: error.message});
        }
    }

    static async getUserRatings(req, res) {
        try {
            const userId = req.user.id;

            const ratings = await ratingService.getRatingsByUserId(userId);
            
            appLogger.info(`Ratings retrieved for user ${userId}`);
            res.status(200).json({success: true,message: 'User ratings retrieved successfully',data: ratings});
        } catch (error) {
            appLogger.error(`Retrieving user ratings failed: ${error.message}`);
            return res.status(500).json({success: false, message: 'Failed to retrieve user ratings', error: error.message});
        }
    }

    static async getTripRatings(req, res) {
        try {
            const { tripId } = req.params;

            const ratings = await ratingService.getRatingsByTripId(tripId);

            appLogger.info(`Ratings retrieved for trip ${tripId}`);
            res.status(200).json({success: true,message: 'Trip ratings retrieved successfully',data: {ratings,totalRatings: averageRating.count}});
        } catch (error) {
            appLogger.error(`Retrieving trip ratings failed: ${error.message}`);
            return res.status(500).json({success: false, message: 'Failed to retrieve trip ratings', error: error.message});
        }
    }

    static async updateRating(req, res) {
        try {
            const { ratingId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const updatedRating = await ratingService.updateRating(userId, ratingId, updateData);

            appLogger.info(`Rating ${ratingId} updated by user ${userId}`);
            res.status(200).json({success: true,message: 'Rating updated successfully',data: updatedRating});
        } catch (error) {
            appLogger.error(`Rating update failed: ${error.message}`);
            return res.status(500).json({success: false, message: 'Failed to update rating', error: error.message});
        }
    }

    static async deleteRating(req, res) {
        try {
            const { ratingId } = req.params;
            const userId = req.user.id;

            await ratingService.deleteRating(userId, ratingId);

            appLogger.info(`Rating ${ratingId} deleted by user ${userId}`);
            res.status(200).json({success: true,message: 'Rating deleted successfully',data: {}});
        } catch (error) {
            appLogger.error(`Rating deletion failed: ${error.message}`);
            return res.status(500).json({success: false, message: 'Failed to delete rating', error: error.message});
        }
    }
}

export default RatingController;
