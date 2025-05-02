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

            appLogger.info(`Trip found: ${JSON.stringify(trip)}`);
            appLogger.info(`Bus found: ${JSON.stringify(trip.busId)}`);

            const invalidSeats = seats.filter(seat => seat < 1 || seat > totalSeats);
            if (invalidSeats.length > 0) {
                throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}. Allowed range: 1 - ${totalSeats}`);
            }

            const seatSet = new Set(seats);
            if (seatSet.size !== seats.length) {
                appLogger.warn(`Duplicate seats detected in the request: ${seats}`);
                throw new Error(`Duplicate seats detected in the request. Please select unique seats.`);
            }

            const seatAvailability = await BookingRepository.verifySeatsAvailability(tripId, seats);
            if (!seatAvailability.available) {
                throw new Error(`Seats ${seatAvailability.unavailableSeats.join(', ')} are already booked.`);
            }

            if (seats.length > trip.availableSeats) {
                throw new Error("Not enough available seats.");
            }

            let totalPrice = seats.length * trip.price;

            const bookingToCreate = { 
                userId, 
                tripId, 
                seats, 
                totalPrice,
                paymentStatus: 'pending'
            };
            
            const booking = await BookingRepository.createBookingWithTransaction(
                bookingToCreate, 
                tripId, 
                seats.length
            );
            
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

    async cancelBooking(bookingId, userId) {
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
            
            const cancellationData = {
                status: 'cancelled',
                cancellationDate: new Date(),
                cancellationReason: 'User requested cancellation'
            };
            
            const cancelledBooking = await BookingRepository.updateBooking(bookingId, cancellationData);
            
            await TripRepository.updateTrip(trip._id, {
                availableSeats: trip.availableSeats + booking.seats.length
            });
            
            appLogger.info(`Booking ${bookingId} cancelled successfully`);
            
            return cancelledBooking;
        } catch (error) {
            appLogger.error(`Error cancelling booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }
}

export default new BookingService();