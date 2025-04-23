import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import { appLogger } from '../utils/logger.js';

class AuthMiddleware {
    static async authenticate(req, res, next) {
        try {
            const token = req.cookies?.token;
            if (!token) {
                appLogger.warn('Unauthorized access attempt: No token provided');
                return res.status(401).json({ message: 'Authentication required' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userRepository.getUserById(decoded.id);

            if (!user) {
                appLogger.warn(`Unauthorized access attempt: User not found (ID: ${decoded.id})`);
                return res.status(401).json({ message: 'User not found' });
            }

            if (user.isBlocked) {
                appLogger.warn(`Blocked user attempted access: ${user.email}`);
                return res.status(403).json({ message: 'Your account has been blocked by admin' });
            }

            req.user = user;
            appLogger.info(`User authenticated: ${user.email}`);
            next();
        } catch (error) {
            appLogger.error(`Authentication error: ${error.message}`);
            return res.status(401).json({ message: 'Unauthorized access' });
        }
    }

    static authorizeRoles(...roles) {
        return (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role)) {
                appLogger.warn(`Access denied for user ${req.user?.email} with role ${req.user?.role}`);
                return res.status(403).json({ message: 'Access denied' });
            }
            appLogger.info(`User authorized: ${req.user.email} with role ${req.user.role}`);
            next();
        };
    }

    static verifiedOperatorOnly(req, res, next) {
        if (req.user.role !== 'operator') {
            return next();
        }
        if (!req.user.isVerified) {
            appLogger.warn(`Unverified operator ${req.user.email} attempted to access restricted resource`);
            return res.status(403).json({ 
                success: false,
                message: 'Your operator account is pending verification. Please wait for admin approval.',
                data: null
            });
        }
        appLogger.info(`Verified operator access: ${req.user.email}`);
        next();
    }
}

export default AuthMiddleware;