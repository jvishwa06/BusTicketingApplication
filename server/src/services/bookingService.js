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

            const totalSeats = trip.busId.totalSeats;
            if (!totalSeats) {
                throw new Error(`Invalid bus data for trip ${tripId}`);
            }

            appLogger.info(`Trip found: ${JSON.stringify(trip)}`);

            const invalidSeats = seats.filter(seat => seat < 1 || seat > totalSeats);
            if (invalidSeats.length > 0) {
                throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}. Allowed range: 1 - ${totalSeats}`);
            }

            const seatSet = new Set(seats);
            if (seatSet.size !== seats.length) {
                appLogger.warn(`Duplicate seats detected in the request: ${seats}`);
                throw new Error(`Duplicate seats detected in the request. Please select unique seats.`);
            }

            let totalPrice = seats.length * trip.price;

            const bookingToCreate = { userId, totalPrice, paymentStatus: 'pending' };
            
            const booking = await BookingRepository.createBooking(bookingToCreate, tripId, seats);
            
            setTimeout(async () => {
                try {
                    const currentBooking = await BookingRepository.getBookingById(booking._id);
                    if (currentBooking && currentBooking.paymentStatus === 'pending') {
                        await BookingRepository.releaseSeats(booking._id);
                        appLogger.info(`Released seats for expired booking ${booking._id}`);
                    }
                } catch (error) {
                    appLogger.error(`Error in payment timeout handler: ${error.message}`);
                }
            }, 1 * 60 * 1000); // 1 minutes timeout
            
            return booking;
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

    async cancelBooking(bookingId, userId, cancellationReason = '') {
        try {
            const booking = await BookingRepository.getBookingById(bookingId);
            
            if (!booking) {
                appLogger.warn(`Booking with ID ${bookingId} not found for cancellation`);
                throw new Error('Booking not found');
            }
            
            const bookingUserId = booking.userId._id ? booking.userId._id.toString() : booking.userId.toString();
            if (userId && bookingUserId !== userId.toString()) {
                appLogger.warn(`User ${userId} attempted to cancel booking ${bookingId} that doesn't belong to them`);
                throw new Error('You can only cancel your own bookings');
            }
            
            if (booking.status === 'cancelled') {
                appLogger.warn(`Booking ${bookingId} is already cancelled`);
                throw new Error('Booking is already cancelled');
            }
            
            const trip = await TripRepository.getTripById(booking.tripId);
            if (!trip) {
                appLogger.warn(`Trip not found for booking ${bookingId}`);
                throw new Error('Trip not found');
            }
            
            const now = new Date();
            if (new Date(trip.departureTime) < now) {
                appLogger.warn(`Booking ${bookingId} cannot be cancelled after trip departure`);
                throw new Error('Cannot cancel booking after trip departure');
            }
            
            const reason = cancellationReason || 'User requested cancellation';
            
            const cancelledBooking = await BookingRepository.cancelBooking(bookingId, reason);
            
            await TripRepository.updateTrip(trip._id, {
                availableSeats: trip.availableSeats + booking.seats.length
            });
            
            appLogger.info(`Booking ${bookingId} cancelled successfully with reason: ${reason}`);
            
            return cancelledBooking;
        } catch (error) {
            appLogger.error(`Error cancelling booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }
}

export default new BookingService();