import AdminRepository from '../repositories/adminRepository.js';
import { appLogger } from '../utils/logger.js';

class AdminService {
    async blockUser(userId) {
        try {
            appLogger.info(`Attempting to block user with ID: ${userId}`);
            const result = await AdminRepository.updateUserStatus(userId, true);
            if (!result) {
                appLogger.warn(`User with ID ${userId} not found`);
                throw new Error(`User with ID ${userId} not found`);
            }
            appLogger.info(`User with ID ${userId} blocked successfully`);
            return { message: 'User blocked successfully', user: result };
        } catch (error) {
            appLogger.error(`Error blocking user with ID ${userId}: ${error.message}`);
            throw new Error(error.message || 'Error blocking user');
        }
    }

    async unblockUser(userId) {
        try {
            appLogger.info(`Attempting to unblock user with ID: ${userId}`);
            const result = await AdminRepository.updateUserStatus(userId, false);
            if (!result) {
                appLogger.warn(`User with ID ${userId} not found`);
                throw new Error(`User with ID ${userId} not found`);
            }
            appLogger.info(`User with ID ${userId} unblocked successfully`);
            return { message: 'User unblocked successfully', user: result };
        } catch (error) {
            appLogger.error(`Error unblocking user with ID ${userId}: ${error.message}`);
            throw new Error(error.message || 'Error unblocking user');
        }
    }

    async getAllUsers(filters = {}) {
        try {
            const userFilters = { ...filters, role: 'user' };
            appLogger.info('Admin retrieving users with filters', userFilters);
            const users = await AdminRepository.getAllUsers(userFilters);
            return users;
        } catch (error) {
            appLogger.error(`Error fetching users: ${error.message}`);
            throw new Error(error.message || 'Error fetching users');
        }
    }

    async verifyOperator(userId, verificationStatus) {
        try {
            appLogger.info(`Admin verifying operator ${userId} with status: ${verificationStatus}`);
            const result = await AdminRepository.verifyOperator(userId, verificationStatus);
            if (!result) {
                appLogger.warn(`Operator with ID ${userId} not found`);
                throw new Error(`Operator with ID ${userId} not found`);
            }
            return result;
        } catch (error) {
            appLogger.error(`Error verifying operator: ${error.message}`);
            throw new Error(error.message || 'Error verifying operator');
        }
    }
    
    async getAllOperators(filters = {}) {
        try {
            appLogger.info('Getting all operators with filters:', filters);
            const operators = await AdminRepository.getAllOperators(filters);
            appLogger.info(`Retrieved ${operators.length} operators`);
            return operators;
        } catch (error) {
            appLogger.error(`Error retrieving operators: ${error.message}`);
            throw new Error('Failed to retrieve operators');
        }
    }

    async getAllTrips(filters = {}) {
        try {
            appLogger.info('Admin monitoring all trips with filters', filters);
            const trips = await AdminRepository.getAllTrips(filters);
            return trips;
        } catch (error) {
            appLogger.error(`Error fetching trips: ${error.message}`);
            throw new Error(error.message || 'Error fetching trips');
        }
    }

    async getAllBookings(filters = {}) {
        try {
            appLogger.info('Admin monitoring all bookings with filters', filters);
            const bookings = await AdminRepository.getAllBookings(filters);
            return bookings;
        } catch (error) {
            appLogger.error(`Error fetching bookings: ${error.message}`);
            throw new Error(error.message || 'Error fetching bookings');
        }
    }

    async modifyTrip(tripId, tripData) {
        try {
            appLogger.info(`Admin modifying trip ${tripId} with data:`, tripData);
            const result = await AdminRepository.modifyTrip(tripId, tripData);
            if (!result) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }
            return result;
        } catch (error) {
            appLogger.error(`Error modifying trip: ${error.message}`);
            throw new Error(error.message || 'Error modifying trip');
        }
    }

    async cancelTrip(tripId, reason) {
        try {
            appLogger.info(`Admin cancelling trip ${tripId} due to: ${reason}`);
            const result = await AdminRepository.cancelTrip(tripId, reason);
            if (!result) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }
            appLogger.info(`Trip ${tripId} cancelled successfully`);
            return result;
        } catch (error) {
            appLogger.error(`Error cancelling trip: ${error.message}`);
            throw new Error(error.message || 'Error cancelling trip');
        }
    }
}

export default new AdminService();