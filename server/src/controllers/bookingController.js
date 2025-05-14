import BookingService from '../services/bookingService.js';
import { appLogger } from '../utils/logger.js';

class BookingController {
    static async createBooking(req, res) {
        try {
            const userId = req.user.id;
            const booking = await BookingService.createBooking(userId, req.body);
            appLogger.info(`Booking created successfully by user ${userId}`);
            res.status(201).json({
                success: true,
                message: 'Booking created successfully. Please complete payment within 5 minutes to confirm.',
                data: booking
            });
        } catch (error) {
            appLogger.error(`Error creating booking by user ${req.user.id}: ${error.message}`);
            res.status(400).json({success: false,message: error.message,data: {}});
        }
    }

    static async getUserBookings(req, res) {
        try {
            const userId = req.user.id;
            const bookings = await BookingService.getUserBookings(userId);
            if (!bookings.length) {
                appLogger.warn(`No confirmed bookings found for user ${userId}`);
                return res.status(404).json({success: false,message: "No confirmed bookings found for this user.",data: {}});
            }
            appLogger.info(`Confirmed bookings retrieved for user ${userId}`);
            res.status(200).json({success: true,message: "Bookings retrieved successfully",data: bookings});
        } catch (error) {
            appLogger.error(`Error retrieving bookings for user ${req.user.id}: ${error.message}`);
            res.status(500).json({success: false,message: "Internal Server Error",error: error.message});
        }
    }

    static async getOperatorBookings(req, res) {
        try {
            const operatorId = req.user.id;
            const bookings = await BookingService.getOperatorBookings(operatorId);
            appLogger.info(`Confirmed bookings retrieved for operator ${operatorId}`);
            res.status(200).json({success: true,message: "Operator bookings retrieved successfully",data: bookings});
        } catch (error) {
            appLogger.error(`Error fetching operator bookings for ${req.user.id}: ${error.message}`);
            res.status(500).json({success: false,message: "Internal Server Error", error: error.message});
        }
    }

    static async cancelBooking(req, res) {
        try {
            const userId = req.user.id;
            const bookingId = req.params.id;
            
            const cancelledBooking = await BookingService.cancelBooking(bookingId, userId);
            
            appLogger.info(`Booking ${bookingId} cancelled successfully by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully',
                data: cancelledBooking
            });
        } catch (error) {
            appLogger.error(`Error cancelling booking ${req.params.id}: ${error.message}`);
            
            let statusCode = 500;
            if (error.message.includes('not found') || error.message.includes('doesn\'t belong')) {
                statusCode = 404;
            } else if (error.message.includes('already cancelled') || 
                      error.message.includes('after trip departure')) {
                statusCode = 400;
            }
            
            res.status(statusCode).json({success: false,message: error.message,data: {}});
        }
    }
}

export default BookingController;