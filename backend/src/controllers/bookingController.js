import BookingService from '../services/bookingService.js';
import { logger } from '../utils/logger.js';

class BookingController {
    static async createBooking(req, res) {
        try {
            const userId = req.user.id;
            const booking = await BookingService.createBooking(userId, req.body);
            logger.info(`Booking created successfully by user ${userId}`);
            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: booking
            });
        } catch (error) {
            logger.error(`Error creating booking by user ${req.user.id}: ${error.message}`);
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
                logger.warn(`No bookings found for user ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: "No bookings found for this user.",
                    data: null
                });
            }
            logger.info(`Bookings retrieved for user ${userId}`);
            res.status(200).json({
                success: true,
                message: "Bookings retrieved successfully",
                data: bookings
            });
        } catch (error) {
            logger.error(`Error retrieving bookings for user ${req.user.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }

    static async getAllBookings(req, res) {
        try {
            const bookings = await BookingService.getAllBookings();
            logger.info("Fetched all bookings successfully");
            res.status(200).json({
                success: true,
                message: "All bookings fetched successfully",
                data: bookings
            });
        } catch (error) {
            logger.error(`Error fetching all bookings: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }

    static async getBookingById(req, res) {
        try {
            const booking = await BookingService.getBookingById(req.params.id);
            if (!booking) {
                logger.warn(`Booking not found with ID: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                    data: null
                });
            }
            logger.info(`Booking retrieved with ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: "Booking retrieved successfully",
                data: booking
            });
        } catch (error) {
            logger.error(`Error retrieving booking by ID ${req.params.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }

    static async updateBooking(req, res) {
        try {
            const updatedBooking = await BookingService.updateBooking(req.params.id, req.body);
            if (!updatedBooking) {
                logger.warn(`Booking not found for update: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                    data: null
                });
            }
            logger.info(`Booking updated with ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: "Booking updated successfully",
                data: updatedBooking
            });
        } catch (error) {
            logger.error(`Error updating booking ${req.params.id}: ${error.message}`);
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
                logger.warn(`Booking not found for deletion: ${req.params.id}`);
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                    data: null
                });
            }
            logger.info(`Booking deleted with ID: ${req.params.id}`);
            res.status(200).json({
                success: true,
                message: "Booking deleted successfully",
                data: null
            });
        } catch (error) {
            logger.error(`Error deleting booking ${req.params.id}: ${error.message}`);
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
            logger.info(`Bookings retrieved for operator ${operatorId}`);
            res.status(200).json({
                success: true,
                message: "Operator bookings retrieved successfully",
                data: bookings
            });
        } catch (error) {
            logger.error(`Error fetching operator bookings for ${req.user.id}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: null
            });
        }
    }
}

export default BookingController;