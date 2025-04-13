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
}

export default new AdminService();