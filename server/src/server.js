import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import busRoutes from './routes/busRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import discountRoutes from './routes/discountRoutes.js'; 
import { requestLogger } from './utils/logger.js';
import cors from 'cors';
import rateLimiter from './middlewares/rateLimiterMiddleware.js';

dotenv.config();
connectDB();

const app = express();
app.use(requestLogger); 

app.use(rateLimiter.globalRateLimiter);

app.use(express.json());
app.use(cookieParser());

app.use(cors({ 
    origin: 'http://localhost:5173',
    credentials: true 
}));

app.use('/users', rateLimiter.authRateLimiter, userRoutes);
app.use('/buses', rateLimiter.apiRateLimiter, busRoutes);
app.use('/trips', rateLimiter.apiRateLimiter, tripRoutes);
app.use('/bookings', rateLimiter.bookingRateLimiter, bookingRoutes);
app.use('/payments', rateLimiter.paymentRateLimiter, paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/ratings', rateLimiter.apiRateLimiter, ratingRoutes);
app.use('/analytics', analyticsRoutes); 
app.use('/discounts', rateLimiter.apiRateLimiter, discountRoutes); 

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));