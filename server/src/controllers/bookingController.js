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
                message: 'Booking created successfully',
                data: booking
            });
        } catch (error) {
            appLogger.error(`Error creating booking by user ${req.user.id}: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }

    static async getUserBookings(req, res) {
        try {
            const userId = req.user.id;
            const bookings = await BookingService.getUserBookings(userId);
            if (!bookings.length) {
                appLogger.warn(`No bookings found for user ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: "No bookings found for this user.",
                    data: null
                });
            }
            appLogger.info(`Bookings retrieved for user ${userId}`);
            res.status(200).json({
                success: true,
                message: "Bookings retrieved successfully",
                data: bookings
            });
        } catch (error) {
            appLogger.error(`Error retrieving bookings for user ${req.user.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }

    static async getOperatorBookings(req, res) {
        try {
            const operatorId = req.user.id;
            const bookings = await BookingService.getOperatorBookings(operatorId);
            appLogger.info(`Bookings retrieved for operator ${operatorId}`);
            res.status(200).json({
                success: true,
                message: "Operator bookings retrieved successfully",
                data: bookings
            });
        } catch (error) {
            appLogger.error(`Error fetching operator bookings for ${req.user.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }

    static async deleteBooking(req, res) {
        try {
            const deletedBooking = await BookingService.deleteBooking(req.params.id);
            if (!deletedBooking) {
                appLogger.warn(`Booking not found for deletion: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                    data: null
                });
            }
            appLogger.info(`Booking deleted with ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: "Booking deleted successfully",
                data: null
            });
        } catch (error) {
            appLogger.error(`Error deleting booking ${req.params.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }
}

export default BookingController;