import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import { appLogger } from '../utils/logger.js';

class UserService {
    constructor() {
        this.validRoles = ['user', 'admin', 'operator'];
    }

    async register(userData) {
        try {
            if (!this.validRoles.includes(userData.role)) {
                appLogger.warn(`Invalid role specified: ${userData.role}`);
                throw new Error('Invalid role specified');
            }

            const existingUser = await userRepository.getUserByEmail(userData.email);
            if (existingUser) {
                appLogger.warn(`User with email ${userData.email} already exists`);
                throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            const user = await userRepository.createUser(userData);
            appLogger.info(`User registered successfully: ${user.email}`);

            return user;
        } catch (error) {
            appLogger.error(`Error registering user: ${error.message}`);
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            const user = await userRepository.getUserByEmail(email);
            if (!user || !(await bcrypt.compare(password, user.password))) {
                appLogger.warn(`Failed login attempt for email: ${email}`);
                throw new Error('Invalid credentials');
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            appLogger.info(`User logged in successfully: ${user.email}`);
            return { token, user };
        } catch (error) {
            appLogger.error(`Error logging in user with email ${email}: ${error.message}`);
            throw error;
        }
    }

    async getProfile(userId) {
        try {
            const user = await userRepository.getUserById(userId);
            if (!user) {
                appLogger.warn(`Profile not found for user ID: ${userId}`);
                throw new Error('User not found');
            }
            appLogger.info(`User profile retrieved: ${user.email}`);
            return user;
        } catch (error) {
            appLogger.error(`Error fetching profile for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(userId, updateData) {
        try {
            if (updateData.role !== undefined) {
                appLogger.warn(`Attempt to change role for user ID: ${userId} prevented`);
                throw new Error('Role modification is not allowed through profile update');
            }
            
            const allowedFields = ['name', 'email', 'phone'];
            const filteredUpdateData = {};
            
            const nonAllowedFields = Object.keys(updateData).filter(key => 
                !allowedFields.includes(key) && 
                key !== 'currentPassword' && 
                key !== 'newPassword'
            );
            
            if (nonAllowedFields.length > 0) {
                appLogger.warn(`Attempt to update non-allowed fields for user ID: ${userId}: ${nonAllowedFields.join(', ')}`);
                throw new Error(`Only name, email, and phone can be updated. Cannot update: ${nonAllowedFields.join(', ')}`);
            }
            
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredUpdateData[key] = updateData[key];
                }
            });
            
            if (updateData.currentPassword && updateData.newPassword) {
                const currentUser = await userRepository.getUserByEmail(
                    (await userRepository.getUserById(userId)).email
                );
                
                if (!currentUser) {
                    appLogger.warn(`User not found: ${userId}`);
                    throw new Error('User not found');
                }
                
                if (!currentUser.password) {
                    appLogger.warn(`Password field missing for user ID: ${userId}`);
                    throw new Error('Password reset required. Please use forgot password feature.');
                }
                
                const isPasswordValid = await bcrypt.compare(updateData.currentPassword, currentUser.password);
                if (!isPasswordValid) {
                    appLogger.warn(`Invalid current password for user ID: ${userId}`);
                    throw new Error('Current password is incorrect');
                }
                
                filteredUpdateData.password = await bcrypt.hash(updateData.newPassword, 10);
            }
            
            delete updateData.currentPassword;
            delete updateData.newPassword;
            
            const user = await userRepository.updateUserProfile(userId, filteredUpdateData);
            if (!user) {
                appLogger.warn(`Profile update failed, user not found: ${userId}`);
                throw new Error('User not found');
            }
            appLogger.info(`User profile updated: ${user.email}`);
            return user;
        } catch (error) {
            appLogger.error(`Error updating profile for user ID ${userId}: ${error.message}`);
            throw error;
        }
    }
}

export default new UserService();