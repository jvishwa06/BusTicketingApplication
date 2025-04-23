import BookingRepository from '../repositories/bookingRepository.js';
import TripRepository from '../repositories/tripRepository.js';
import { appLogger } from '../utils/logger.js';

class BookingService {
    async createBooking(userId, bookingData) {
        try {
            const { tripId, seats } = bookingData;

            const trip = await TripRepository.getTripById(tripId);
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }

            if (!trip.busId) {
                appLogger.warn(`Bus details not found for trip ${tripId}`);
                throw new Error(`Bus details not found for trip ${tripId}`);
            }

            const totalSeats = trip.busId.totalSeats;
            if (!totalSeats) {
                throw new Error(`Invalid bus data for trip ${tripId}`);
            }

            appLogger.info(`Trip found: ${JSON.stringify(trip, null, 2)}`);
            appLogger.info(`Bus found: ${JSON.stringify(trip.busId, null, 2)}`);

            const invalidSeats = seats.filter(seat => seat < 1 || seat > totalSeats);
            if (invalidSeats.length > 0) {
                throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}. Allowed range: 1 - ${totalSeats}`);
            }

            const seatSet = new Set(seats);
            if (seatSet.size !== seats.length) {
                appLogger.warn(`Duplicate seats detected in the request: ${seats}`);
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

            let totalPrice = seats.length * trip.price;
            
            await TripRepository.updateTrip(tripId, { 
                availableSeats: trip.availableSeats - seats.length 
            });

            const bookingToCreate = { 
                userId, 
                tripId, 
                seats, 
                totalPrice
            };
            
            return await BookingRepository.createBooking(bookingToCreate);
        } catch (error) {
            appLogger.error(`Error creating booking: ${error.message}`);
            throw error;
        }
    }

    async getUserBookings(userId) {
        try {
            const bookings = await BookingRepository.getBookingsByUserId(userId);
            appLogger.info(`Fetched bookings for user ${userId}`);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getOperatorBookings(operatorId) {
        try {
            const bookings = await BookingRepository.getBookingsByOperatorId(operatorId);
            appLogger.info(`Fetched bookings for operator ${operatorId}`);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBooking(bookingId) {
        try {
            const result = await BookingRepository.deleteBooking(bookingId);
            return result;
        } catch (error) {
            appLogger.error(`Error deleting booking ${bookingId}: ${error.message}`);
            throw new Error('Database error');
        }
    }
}

export default new BookingService();