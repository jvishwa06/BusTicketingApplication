import User from '../models/user.js';
import Trip from '../models/trip.js';
import Booking from '../models/booking.js';
import { appLogger } from '../utils/logger.js';

class AdminRepository {
    async updateUserStatus(userId, isBlocked) {
        try {
            const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true });
            if (!user) {
                appLogger.warn(`User with ID ${userId} not found`);
                return null;
            }
            appLogger.info(`User ${userId} status updated: ${isBlocked ? 'Blocked' : 'Unblocked'}`);
            return user;
        } catch (error) {
            appLogger.error(`Error updating user status for ID ${userId}: ${error.message}`);
            throw error;
        }
    }

    async getAllUsers(filters = {}) {
        try {
            const query = {};
            if (filters.role) query.role = filters.role;
            if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked === 'true';
            
            appLogger.info('Fetching users with query:', query);
            const users = await User.find(query).select('-password');
            return users;
        } catch (error) {
            appLogger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async verifyOperator(userId, verificationStatus) {
        try {
            const operator = await User.findOneAndUpdate(
                { _id: userId, role: 'operator' },
                { isVerified: verificationStatus },
                { new: true }
            );
            
            if (!operator) {
                appLogger.warn(`Operator with ID ${userId} not found`);
                return null;
            }
            
            appLogger.info(`Operator ${userId} verification status updated to: ${verificationStatus}`);
            return operator;
        } catch (error) {
            appLogger.error(`Error verifying operator: ${error.message}`);
            throw error;
        }
    }

    async getAllTrips(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.from) query.from = new RegExp(filters.from, 'i');
            if (filters.to) query.to = new RegExp(filters.to, 'i');
            if (filters.date) {
                const date = new Date(filters.date);
                query.departureTime = { $gte: date, $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) };
            }
            
            appLogger.info('Fetching trips with query:', query);
            const trips = await Trip.find(query).populate('bus', 'regNumber type operator');
            return trips;
        } catch (error) {
            appLogger.error(`Error fetching trips: ${error.message}`);
            throw error;
        }
    }

    async getAllBookings(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
            if (filters.tripId) query.trip = filters.tripId;
            if (filters.userId) query.user = filters.userId;
            
            appLogger.info('Fetching bookings with query:', query);
            const bookings = await Booking.find(query)
                .populate('user', 'name email phone')
                .populate({
                    path: 'trip',
                    select: 'from to departureTime arrivalTime fare bus',
                    populate: { path: 'bus', select: 'regNumber type operator' }
                });
            
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings: ${error.message}`);
            throw error;
        }
    }

    async modifyTrip(tripId, tripData) {
        try {
            const allowedUpdates = ['departureTime', 'arrivalTime', 'fare', 'status', 'availableSeats'];
            const updates = {};
            
            Object.keys(tripData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = tripData[key];
                }
            });
            
            appLogger.info(`Modifying trip ${tripId} with data:`, updates);
            const trip = await Trip.findByIdAndUpdate(tripId, updates, { new: true });
            
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                return null;
            }
            
            return trip;
        } catch (error) {
            appLogger.error(`Error modifying trip: ${error.message}`);
            throw error;
        }
    }

    async cancelTrip(tripId, reason) {
        try {
            appLogger.info(`Cancelling trip ${tripId} due to: ${reason}`);
            const trip = await Trip.findByIdAndUpdate(
                tripId, 
                { 
                    status: 'cancelled',
                    cancellationReason: reason,
                    adminCancelled: true
                },
                { new: true }
            );
            
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                return null;
            }
            
            await Booking.updateMany(
                { trip: tripId, status: { $ne: 'cancelled' } },
                { status: 'cancelled', cancellationReason: `Trip cancelled by admin: ${reason}` }
            );
            
            return trip;
        } catch (error) {
            appLogger.error(`Error cancelling trip: ${error.message}`);
            throw error;
        }
    }
}

export default new AdminRepository();
