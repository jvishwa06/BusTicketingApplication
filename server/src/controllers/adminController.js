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
}

export default AdminController;
