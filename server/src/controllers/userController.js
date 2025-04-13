import UserService from '../services/userService.js';
import { appLogger } from '../utils/logger.js';

class UserController {
    static async register(req, res, next) {
        try {
            const user = await UserService.register(req.body);
            appLogger.info(`New user registered: ${user.email}`);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {}
            });
        } catch (error) {
            appLogger.error(`Registration failed: ${error.message}`);
            next(error); 
        }
    }

    static async login(req, res, next) {
        try {
            const { token, user } = await UserService.login(req.body);
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            appLogger.info(`User login successful: ${user.email}`);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {token: token}
            });
        } catch (error) {
            appLogger.error(`Login failed for ${req.body.email}: ${error.message}`);
            res.status(401).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    }

    static async logout(req, res, next) {
        try {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
            });

            appLogger.info(`User logged out: ${req.user?.email || 'Unknown user'}`);
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            appLogger.error(`Logout failed: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }

    static async getProfile(req, res, next) {
        try {
            const user = await UserService.getProfile(req.user.id);
            appLogger.info(`Profile retrieved: ${user.email}`);
            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    companyName: user.companyName,
                    companyAddress: user.companyAddress
                }
            });
        } catch (error) {
            appLogger.error(`Profile retrieval failed for user ID ${req.user.id}: ${error.message}`);
            res.status(404).json({
                success: false,
                message: 'Profile retrieval failed',
                error: error.message
            });
        }
    }

    static async updateProfile(req, res, next) {
        try {
            const updatedUser = await UserService.updateProfile(req.user.id, req.body);
            appLogger.info(`Profile updated: ${updatedUser.email}`);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    role: updatedUser.role,
                    companyName: updatedUser.companyName,
                    companyAddress: updatedUser.companyAddress
                }
            });
        } catch (error) {
            appLogger.error(`Profile update failed for user ID ${req.user.id}: ${error.message}`);
            res.status(404).json({
                success: false,
                message: 'Profile update failed',
                error: error.message
            });
        }
    }
}

export default UserController;