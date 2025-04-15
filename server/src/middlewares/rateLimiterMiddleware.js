import rateLimit from 'express-rate-limit';
import { appLogger } from '../utils/logger.js';

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
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
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

export const globalRateLimiter = createRateLimiter();

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 10, 
  message: 'Too many login attempts, please try again after 15 minutes',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, 
  message: 'Too many API requests, please try again after some time'
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, 
  message: 'Too many booking attempts, please try again after some time'
});

export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, 
  message: 'Too many payment attempts, please try again after some time'
});

export default {
  globalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  bookingRateLimiter,
  paymentRateLimiter
};
