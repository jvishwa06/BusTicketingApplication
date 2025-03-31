import User from '../models/User.js';
import { logger } from '../utils/logger.js';

class AdminRepository {
    async updateUserStatus(userId, isBlocked) {
        try {
            const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true });
            if (!user) {
                logger.warn(`User with ID ${userId} not found`);
                return null;
            }
            logger.info(`User ${userId} status updated: ${isBlocked ? 'Blocked' : 'Unblocked'}`);
            return user;
        } catch (error) {
            logger.error(`Error updating user status for ID ${userId}: ${error.message}`);
            throw error;
        }
    }
}

export default new AdminRepository();
