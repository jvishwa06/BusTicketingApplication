import Booking from '../models/Booking.js';
import { logger } from '../utils/logger.js';

class BookingRepository {
    async createBooking(bookingData) {
        try {
            const booking = await Booking.create(bookingData);
            logger.info(`Booking created with ID: ${booking._id}`);
            return booking;
        } catch (error) {
            logger.error(`Error creating booking: ${error.message}`);
            throw error;
        }
    }

    async getBookingsByUserId(userId) {
        try {
            const bookings = await Booking.find({ userId }).populate('tripId');
            logger.info(`Fetched bookings for user ${userId}`);
            return bookings;
        } catch (error) {
            logger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getAllBookings() {
        try {
            const bookings = await Booking.find().populate('tripId userId');
            logger.info("Fetched all bookings successfully");
            return bookings;
        } catch (error) {
            logger.error(`Error fetching all bookings: ${error.message}`);
            throw error;
        }
    }

    async getBookingsByTripId(tripId) {  
        try {
            const bookings = await Booking.find({ tripId });
            logger.info(`Fetched bookings for trip ${tripId}`);
            return bookings;
        } catch (error) {
            logger.error(`Error fetching bookings for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async getBookingById(bookingId) {
        try {
            const booking = await Booking.findById(bookingId).populate('tripId userId');
            if (!booking) {
                logger.warn(`Booking not found with ID: ${bookingId}`);
            } else {
                logger.info(`Fetched booking with ID: ${bookingId}`);
            }
            return booking;
        } catch (error) {
            logger.error(`Error fetching booking by ID ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async updateBooking(bookingId, updateData) {
        try {
            const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
            if (!updatedBooking) {
                logger.warn(`Booking not found for update: ${bookingId}`);
            } else {
                logger.info(`Booking updated with ID: ${bookingId}`);
            }
            return updatedBooking;
        } catch (error) {
            logger.error(`Error updating booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBooking(bookingId) {
        try {
            const deletedBooking = await Booking.findByIdAndDelete(bookingId);
            if (!deletedBooking) {
                logger.warn(`Booking not found for deletion: ${bookingId}`);
            } else {
                logger.info(`Booking deleted with ID: ${bookingId}`);
            }
            return deletedBooking;
        } catch (error) {
            logger.error(`Error deleting booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async getBookingsByOperatorId(operatorId) {
        const bookings = await Booking.find()
            .populate({
                path: "tripId",
                populate: {
                    path: "busId",
                    match: { operatorId }, 
                },
            });
    
        return bookings.filter(booking => booking.tripId && booking.tripId.busId);
    }
    
    
}

export default new BookingRepository();
