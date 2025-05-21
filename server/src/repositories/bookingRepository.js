import Booking from '../models/booking.js';
import { appLogger } from '../utils/logger.js';
import mongoose from 'mongoose';
import Trip from '../models/trip.js';

class BookingRepository {
    async createBooking(bookingData, tripId, seats) {
        const session = await mongoose.startSession();
        let booking = null;
        
        try {
            session.startTransaction();
            
            const existingBookings = await Booking.find({ tripId }).session(session);
            
            const bookedSeats = new Set(
                existingBookings.flatMap(booking => 
                    booking.paymentStatus !== 'failed' ? booking.seats : []
                )
            );
            
            const unavailableSeats = seats.filter(seat => bookedSeats.has(seat));
            
            if (unavailableSeats.length > 0) {
                throw new Error(`Seats already booked: ${unavailableSeats.join(', ')}`);
            }
            
            const trip = await Trip.findById(tripId).session(session);
            
            if (!trip) {
                throw new Error(`Trip with ID ${tripId} not found during transaction`);
            }
            
            if (trip.availableSeats < seats.length) {
                throw new Error('Not enough available seats');
            }
            
            const bookingWithSeats = {...bookingData,seats,tripId};
            
            booking = await Booking.create([bookingWithSeats], { session });
            
            trip.availableSeats -= seats.length;
            await trip.save({ session });
            
            await session.commitTransaction();
            appLogger.info(`Booking created successfully: ${booking[0]._id}`);
            
            return booking[0];
        } catch (error) {
            await session.abortTransaction();
            appLogger.error(`Error creating booking: ${error.message}`);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async releaseSeats(bookingId) {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const booking = await Booking.findById(bookingId).session(session);
            
            if (!booking) {
                throw new Error(`Booking with ID ${bookingId} not found`);
            }
            
            booking.paymentStatus = 'failed';
            await booking.save({ session });
            
            const trip = await Trip.findById(booking.tripId).session(session);
            
            if (trip) {
                trip.availableSeats += booking.seats.length;
                await trip.save({ session });
            }
            
            await session.commitTransaction();
            appLogger.info(`Successfully released seats for booking ${bookingId}`);
            
            return booking;
        } catch (error) {
            await session.abortTransaction();
            appLogger.error(`Error releasing seats for booking ${bookingId}: ${error.message}`);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getBookingsByUserId(userId) {
        try {
            const bookings = await Booking.find({ userId }).populate({
                    path: 'tripId',
                    populate: {
                        path: 'busId',
                        select: 'name type operatorId registrationNumber totalSeats amenities'
                    }
                }).populate('userId', 'name email phone').sort({ createdAt: -1 });
            appLogger.info(`Fetched bookings with complete details for user ${userId}`);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings for user ${userId}: ${error.message}`);
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

    async cancelBooking(bookingId, reason = '') {
        try {
            const cancelledBooking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    status: 'cancelled',
                    cancellationDate: new Date(),
                    cancellationReason: reason
                },
                { new: true }
            );
            
            if (!cancelledBooking) {
                appLogger.warn(`Booking not found for cancellation: ${bookingId}`);
            } else {
                appLogger.info(`Booking cancelled with ID: ${bookingId}`);
            }
            return cancelledBooking;
        } catch (error) {
            appLogger.error(`Error cancelling booking ${bookingId}: ${error.message}`);
            throw error;
        }
    }

}

export default new BookingRepository();