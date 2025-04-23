import rateLimit from 'express-rate-limit';
import { appLogger } from '../utils/logger.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: (req, res, next, options) => {
    appLogger.warn(`Rate limit exceeded for IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
      data: null
    });
  }
});

export default limiter;
