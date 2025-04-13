import User from '../models/User.js';
import { appLogger } from '../utils/logger.js';
class UserRepository {
    async createUser(userData) {
        try {
            const user = await User.create(userData);
            appLogger.info(`User created in database: ${user.email}`);
            return user;
        } catch (error) {
            appLogger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) appLogger.warn(`User not found in database (ID: ${userId})`);
            return user;
        } catch (error) {
            appLogger.error(`Error fetching user by ID: ${error.message}`);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) appLogger.warn(`User not found in database (Email: ${email})`);
            return user;
        } catch (error) {
            appLogger.error(`Error fetching user by email: ${error.message}`);
            throw error;
        }
    }

    async updateUserProfile(userId, updateData) {
        try {
            const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
            if (!user) appLogger.warn(`User profile update failed: User not found (ID: ${userId})`);
            else appLogger.info(`User profile updated in database: ${user.email}`);
            return user;
        } catch (error) {
            appLogger.error(`Error updating user profile: ${error.message}`);
            throw error;
        }
    }
}

export default new UserRepository();
