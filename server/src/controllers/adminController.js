import AdminService from '../services/adminService.js';
import { appLogger } from '../utils/logger.js';

class AdminController {
    static async blockUser(req, res) {
        try {
            const { userId } = req.params;
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

    // New methods for admin functionality
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
            const { verificationStatus } = req.body;
            
            if (verificationStatus === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification status is required',
                    data: null
                });
            }
            
            const operator = await AdminService.verifyOperator(userId, verificationStatus);
            
            if (!operator) {
                appLogger.warn(`Operator with ID ${userId} not found`);
                return res.status(404).json({
                    success: false,
                    message: 'Operator not found',
                    data: null
                });
            }
            
            appLogger.info(`Operator ${userId} verification status updated to: ${verificationStatus}`);
            res.status(200).json({
                success: true,
                message: 'Operator verification status updated successfully',
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
}

export default AdminController;
