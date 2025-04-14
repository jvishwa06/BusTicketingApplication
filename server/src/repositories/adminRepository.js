import User from '../models/user.js';
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
}

export default new AdminRepository();
