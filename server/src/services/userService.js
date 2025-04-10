import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

class UserService {
    constructor() {
        this.validRoles = ['user', 'admin', 'operator'];
    }

    async register(userData) {
        try {
            if (!this.validRoles.includes(userData.role)) {
                logger.warn(`Invalid role specified: ${userData.role}`);
                throw new Error('Invalid role specified');
            }

            const existingUser = await userRepository.getUserByEmail(userData.email);
            if (existingUser) {
                logger.warn(`User with email ${userData.email} already exists`);
                throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const user = await userRepository.createUser(userData);
            logger.info(`User registered successfully: ${user.email}`);

            return user;
        } catch (error) {
            logger.error(`Error registering user: ${error.message}`);
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            const user = await userRepository.getUserByEmail(email);
            if (!user || !(await bcrypt.compare(password, user.password))) {
                logger.warn(`Failed login attempt for email: ${email}`);
                throw new Error('Invalid credentials');
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            logger.info(`User logged in successfully: ${user.email}`);
            return { token, user };
        } catch (error) {
            logger.error(`Error logging in user with email ${email}: ${error.message}`);
            throw error;
        }
    }

    async getProfile(userId) {
        try {
            const user = await userRepository.getUserById(userId);
            if (!user) {
                logger.warn(`Profile not found for user ID: ${userId}`);
                throw new Error('User not found');
            }
            logger.info(`User profile retrieved: ${user.email}`);
            return user;
        } catch (error) {
            logger.error(`Error fetching profile for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(userId, updateData) {
        try {
            // Check if password update is requested
            if (updateData.currentPassword && updateData.newPassword) {
                // For password verification, we need to get the user with password included
                const currentUser = await userRepository.getUserByEmail(
                    (await userRepository.getUserById(userId)).email
                );
                
                if (!currentUser) {
                    logger.warn(`User not found: ${userId}`);
                    throw new Error('User not found');
                }
                
                // Check if password exists in user record
                if (!currentUser.password) {
                    logger.warn(`Password field missing for user ID: ${userId}`);
                    throw new Error('Password reset required. Please use forgot password feature.');
                }
                
                const isPasswordValid = await bcrypt.compare(updateData.currentPassword, currentUser.password);
                if (!isPasswordValid) {
                    logger.warn(`Invalid current password for user ID: ${userId}`);
                    throw new Error('Current password is incorrect');
                }
                
                // Hash the new password
                updateData.password = await bcrypt.hash(updateData.newPassword, 10);
                
                // Remove the password fields that shouldn't be stored
                delete updateData.currentPassword;
                delete updateData.newPassword;
            }
            
            const user = await userRepository.updateUserProfile(userId, updateData);
            if (!user) {
                logger.warn(`Profile update failed, user not found: ${userId}`);
                throw new Error('User not found');
            }
            logger.info(`User profile updated: ${user.email}`);
            return user;
        } catch (error) {
            logger.error(`Error updating profile for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }
}

export default new UserService();