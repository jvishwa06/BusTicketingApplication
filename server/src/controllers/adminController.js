import AdminService from '../services/adminService.js';
import { appLogger } from '../utils/logger.js';

class AdminController {
    static async blockUser(req, res) {
        try {
            const { userId } = req.params;
            
            if (userId === req.user._id.toString()) {
                appLogger.warn(`Admin ${req.user.email} attempted to block themselves`);
                return res.status(400).json({
                    success: false,
                    message: 'Administrators cannot block themselves',
                    data: null
                });
            }
            
            const user = await AdminService.blockUser(userId);

            if (!user) {
                appLogger.warn(`Attempted to block non-existent user ID: ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }

            appLogger.info(`User blocked successfully: ${userId}`);
            res.status(200).json({
                success: true,
                message: 'User blocked successfully',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isBlocked: user.isBlocked
                }
            });
        } catch (error) {
            appLogger.error(`Error blocking user ${req.params.userId}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async unblockUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await AdminService.unblockUser(userId);

            if (!user) {
                appLogger.warn(`Attempted to unblock non-existent user ID: ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }

            appLogger.info(`User unblocked successfully: ${userId}`);
            res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isBlocked: user.isBlocked
                }
            });
        } catch (error) {
            appLogger.error(`Error unblocking user ${req.params.userId}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const filters = req.query;
            const users = await AdminService.getAllUsers(filters);
            
            appLogger.info(`Admin retrieved ${users.length} users`);
            res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: users
            });
        } catch (error) {
            appLogger.error(`Error retrieving users: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async verifyOperator(req, res) {
        try {
            const { userId } = req.params;
            
            const operator = await AdminService.verifyOperator(userId, true);
            
            if (!operator) {
                appLogger.warn(`Operator with ID ${userId} not found`);
                return res.status(404).json({
                    success: false,
                    message: 'Operator not found',
                    data: null
                });
            }
            
            appLogger.info(`Operator ${userId} has been verified successfully`);
            res.status(200).json({
                success: true,
                message: 'Operator verified successfully',
                data: operator
            });
        } catch (error) {
            appLogger.error(`Error verifying operator ${req.params.userId}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async getAllTrips(req, res) {
        try {
            const filters = req.query;
            const trips = await AdminService.getAllTrips(filters);
            
            appLogger.info(`Admin retrieved ${trips.length} trips`);
            res.status(200).json({
                success: true,
                message: 'Trips retrieved successfully',
                data: trips
            });
        } catch (error) {
            appLogger.error(`Error retrieving trips: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async getAllBookings(req, res) {
        try {
            const filters = req.query;
            const bookings = await AdminService.getAllBookings(filters);
            
            appLogger.info(`Admin retrieved ${bookings.length} bookings`);
            res.status(200).json({
                success: true,
                message: 'Bookings retrieved successfully',
                data: bookings
            });
        } catch (error) {
            appLogger.error(`Error retrieving bookings: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async modifyTrip(req, res) {
        try {
            const { tripId } = req.params;
            const tripData = req.body;
            
            const trip = await AdminService.modifyTrip(tripId, tripData);
            
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                return res.status(404).json({
                    success: false,
                    message: 'Trip not found',
                    data: null
                });
            }
            
            appLogger.info(`Trip ${tripId} modified successfully by admin`);
            res.status(200).json({
                success: true,
                message: 'Trip modified successfully',
                data: trip
            });
        } catch (error) {
            appLogger.error(`Error modifying trip ${req.params.tripId}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async cancelTrip(req, res) {
        try {
            const { tripId } = req.params;
            const { reason } = req.body;
            
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Cancellation reason is required',
                    data: null
                });
            }
            
            const trip = await AdminService.cancelTrip(tripId, reason);
            
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                return res.status(404).json({
                    success: false,
                    message: 'Trip not found',
                    data: null
                });
            }
            
            appLogger.info(`Trip ${tripId} cancelled by admin for reason: ${reason}`);
            res.status(200).json({
                success: true,
                message: 'Trip cancelled successfully',
                data: trip
            });
        } catch (error) {
            appLogger.error(`Error cancelling trip ${req.params.tripId}: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                data: null
            });
        }
    }

    static async getAllOperators(req, res) {
        try {
            const filters = req.query;
            appLogger.info('Request to get all operators with filters:', filters);
            
            const operators = await AdminService.getAllOperators(filters);
            
            appLogger.info(`Successfully retrieved ${operators.length} operators`);
            res.status(200).json({
                success: true,
                message: 'Operators retrieved successfully',
                count: operators.length,
                data: operators
            });
        } catch (error) {
            appLogger.error(`Error in getAllOperators: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve operators',
                data: null
            });
        }
    }
}

export default AdminController;
