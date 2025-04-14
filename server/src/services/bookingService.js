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
            let discountAmount = 0;
            let appliedDiscountId = null;
            
            if (bookingData.discountCode) {
                const discountService = (await import('../services/discountService.js')).default;
                
                const discountValidation = await discountService.validateAndApplyDiscount(
                    bookingData.discountCode,
                    totalPrice,
                    trip.busId.type
                );
                
                if (discountValidation.valid) {
                    discountAmount = discountValidation.discountAmount;
                    totalPrice = discountValidation.finalAmount;
                    appliedDiscountId = discountValidation.discountId;
                    
                    await discountService.incrementUsage(appliedDiscountId);
                    appLogger.info(`Applied discount code ${bookingData.discountCode} with amount ${discountAmount}`);
                } else {
                    appLogger.warn(`Invalid discount code ${bookingData.discountCode}: ${discountValidation.message}`);
                }
            }
            
            await TripRepository.updateTrip(tripId, { 
                availableSeats: trip.availableSeats - seats.length 
            });

            const bookingToCreate = { 
                userId, 
                tripId, 
                seats, 
                totalPrice,
                discount: discountAmount,
                discountId: appliedDiscountId
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

    async getAllBookings() {
        try {
            const bookings = await BookingRepository.getAllBookings();
            appLogger.info("Fetched all bookings successfully");
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching all bookings: ${error.message}`);
            throw error;
        }
    }

    async getBookingById(bookingId) {
        try {
            const booking = await BookingRepository.getBookingById(bookingId);
            if (!booking) {
                appLogger.warn(`Booking not found with ID: ${bookingId}`);
            }
            return booking;
        } catch (error) {
            appLogger.error(`Error fetching booking by ID ${bookingId}: ${error.message}`);
            throw error;
        }
    }

    async updateBooking(bookingId, updateData) {
        try {
            const updatedBooking = await BookingRepository.updateBooking(bookingId, updateData);
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

    async getBookingsByTripId(tripId) {
        try {
            appLogger.info(`Fetching bookings for trip ${tripId}`);
            return await BookingRepository.getBookingsByTripId(tripId);
        } catch (error) {
            appLogger.error(`Error fetching bookings for trip ${tripId}: ${error.message}`);
            throw error;
        }
    }
    
    async getBookingsByTripIds(tripIds) {
        try {
            if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
                appLogger.warn("Invalid trip IDs provided");
                throw new Error("Valid trip IDs are required to fetch bookings");
            }
            
            appLogger.info(`Fetching bookings for trips: ${tripIds.join(', ')}`);
            return await BookingRepository.getBookingsByTripIds(tripIds);
        } catch (error) {
            appLogger.error(`Error fetching bookings for multiple trips: ${error.message}`);
            throw error;
        }
    }
    
    async deleteBooking(bookingId) {
        try {
            const deletedBooking = await BookingRepository.deleteBooking(bookingId);
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
}

export default new BookingService();