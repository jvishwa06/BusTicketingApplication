import rateLimit from 'express-rate-limit';
import { appLogger } from '../utils/logger.js';

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  handler: (req, res, next, options) => {
    appLogger.warn(`Rate limit exceeded for IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(options.statusCode).json({message: options.message});
  }
});

export default limiter;