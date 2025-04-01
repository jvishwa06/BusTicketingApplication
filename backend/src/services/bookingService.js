import BookingRepository from '../repositories/bookingRepository.js';
import TripRepository from '../repositories/tripRepository.js';
import { logger } from '../utils/logger.js';
class BookingService {
    async createBooking(userId, bookingData) {
        try {
            const { tripId, seats } = bookingData;

            const trip = await TripRepository.getTripById(tripId);
            if (!trip) {
                logger.warn(`Trip with ID ${tripId} not found`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }

            if (!trip.busId) {
                logger.warn(`Bus details not found for trip ${tripId}`);
                throw new Error(`Bus details not found for trip ${tripId}`);
            }

            const totalSeats = trip.busId.totalSeats;
            if (!totalSeats) {
                throw new Error(`Invalid bus data for trip ${tripId}`);
            }

            logger.info(`Trip found: ${JSON.stringify(trip, null, 2)}`);
            logger.info(`Bus found: ${JSON.stringify(trip.busId, null, 2)}`);

            const invalidSeats = seats.filter(seat => seat < 1 || seat > totalSeats);
            if (invalidSeats.length > 0) {
                throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}. Allowed range: 1 - ${totalSeats}`);
            }

            const seatSet = new Set(seats);
            if (seatSet.size !== seats.length) {
                logger.warn(`Duplicate seats detected in the request: ${seats}`);
                throw new Error(`Duplicate seats detected in the request. Please select unique seats.`);
            }

            const existingBookings = await BookingRepository.getBookingsByTripId(tripId);
            const bookedSeats = new Set(existingBookings.flatMap(booking => booking.seats));
            const alreadyBookedSeats = seats.filter(seat => bookedSeats.has(seat));

            if (alreadyBookedSeats.length > 0) {
                throw new Error(`Seats ${alreadyBookedSeats.join(', ')} are already booked.`);
            }

            if (seats.length > trip.availableSeats) {
                throw new Error("Not enough available seats.");
            }

            const totalPrice = seats.length * trip.price;
            trip.availableSeats -= seats.length;
            await trip.save();

            return await BookingRepository.createBooking({ userId, tripId, seats, totalPrice });
        } catch (error) {
            logger.error(`Error creating booking: ${error.message}`);
            throw error;
        }
    }

    async getUserBookings(userId) {
        try {
            const bookings = await BookingRepository.getBookingsByUserId(userId);
            logger.info(`Fetched bookings for user ${userId}`);
            return bookings;
        } catch (error) {
            logger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getAllBookings() {
        try {
            const bookings = await BookingRepository.getAllBookings();
            logger.info("Fetched all bookings successfully");
            return bookings;
        } catch (error) {
            logger.error(`Error fetching all bookings: ${error.message}`);
            throw error;
        }
    }

    async getBookingById(bookingId) {
        try {
            const booking = await BookingRepository.getBookingById(bookingId);
            if (!booking) {
                logger.warn(`Booking not found with ID: ${bookingId}`);
            }
            return booking;
        } catch (error) {
            logger.error(`Error fetching booking by ID ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async updateBooking(bookingId, updateData) {
        try {
            const updatedBooking = await BookingRepository.updateBooking(bookingId, updateData);
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

    async getOperatorBookings(operatorId) {
        try {
            const bookings = await BookingRepository.getBookingsByOperatorId(operatorId);
            logger.info(`Fetched bookings for operator ${operatorId}`);
            return bookings;
        } catch (error) {
            logger.error(`Error fetching bookings for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }
    
    async deleteBooking(bookingId) {
        try {
            const deletedBooking = await BookingRepository.deleteBooking(bookingId);
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
}

export default new BookingService();