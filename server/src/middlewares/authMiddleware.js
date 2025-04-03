import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

class AuthMiddleware {
    static async authenticate(req, res, next) {
        try {
            const token = req.cookies?.token;
            if (!token) {
                logger.warn('Unauthorized access attempt: No token provided');
                return res.status(401).json({ message: 'Authentication required' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userRepository.getUserById(decoded.id);

            if (!user) {
                logger.warn(`Unauthorized access attempt: User not found (ID: ${decoded.id})`);
                return res.status(401).json({ message: 'User not found' });
            }

            if (user.isBlocked) {
                logger.warn(`Blocked user attempted access: ${user.email}`);
                return res.status(403).json({ message: 'Your account has been blocked by admin' });
            }

            req.user = user;
            logger.info(`User authenticated: ${user.email}`);
            next();
        } catch (error) {
            logger.error(`Authentication error: ${error.message}`);
            return res.status(401).json({ message: 'Unauthorized access' });
        }
    }

    static authorizeRoles(...roles) {
        return (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role)) {
                logger.warn(`Access denied for user ${req.user?.email} with role ${req.user?.role}`);
                return res.status(403).json({ message: 'Access denied' });
            }
            logger.info(`User authorized: ${req.user.email} with role ${req.user.role}`);
            next();
        };
    }
}

export default AuthMiddleware;