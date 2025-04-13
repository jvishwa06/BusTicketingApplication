import Booking from '../models/booking.js';
import { appLogger } from '../utils/logger.js';

class BookingRepository {
    async createBooking(bookingData) {
        try {
            const booking = await Booking.create(bookingData);
            appLogger.info(`Booking created with ID: ${booking._id}`);
            return booking;
        } catch (error) {
            appLogger.error(`Error creating booking: ${error.message}`);
            throw error;
        }
    }

    async getBookingsByUserId(userId) {
        try {
            const bookings = await Booking.find({ userId })
                .populate({
                    path: 'tripId',
                    populate: {
                        path: 'busId',
                        select: 'name type operatorId registrationNumber totalSeats amenities'
                    }
                })
                .populate('userId', 'name email phone')
                .sort({ createdAt: -1 });
            appLogger.info(`Fetched bookings with complete details for user ${userId}`);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getAllBookings() {
        try {
            const bookings = await Booking.find().populate('tripId userId');
            appLogger.info("Fetched all bookings successfully");
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching all bookings: ${error.message}`);
            throw error;
        }
    }

    async getBookingsByTripId(tripId) {  
        try {
            const bookings = await Booking.find({ tripId });
            appLogger.info(`Fetched bookings for trip ${tripId}`);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async getBookingById(bookingId) {
        try {
            const booking = await Booking.findById(bookingId).populate('tripId userId');
            if (!booking) {
                appLogger.warn(`Booking not found with ID: ${bookingId}`);
            } else {
                appLogger.info(`Fetched booking with ID: ${bookingId}`);
            }
            return booking;
        } catch (error) {
            appLogger.error(`Error fetching booking by ID ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async updateBooking(bookingId, updateData) {
        try {
            const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
            if (!updatedBooking) {
                appLogger.warn(`Booking not found for update: ${bookingId}`);
            } else {
                appLogger.info(`Booking updated with ID: ${bookingId}`);
            }
            return updatedBooking;
        } catch (error) {
            appLogger.error(`Error updating booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBooking(bookingId) {
        try {
            const deletedBooking = await Booking.findByIdAndDelete(bookingId);
            if (!deletedBooking) {
                appLogger.warn(`Booking not found for deletion: ${bookingId}`);
            } else {
                appLogger.info(`Booking deleted with ID: ${bookingId}`);
            }
            return deletedBooking;
        } catch (error) {
            appLogger.error(`Error deleting booking ${bookingId}: ${error.message}`);
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
