import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import busRoutes from './routes/busRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import { requestLogger } from './utils/logger.js';
import rateLimiter from './middlewares/rateLimiterMiddleware.js';

dotenv.config();
connectDB();

const app = express();
app.use(requestLogger);

app.use(rateLimiter);

app.use(express.json());
app.use(cookieParser());

app.use(cors({ 
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/buses', busRoutes);
app.use('/trips', tripRoutes);
app.use('/bookings', bookingRoutes);
app.use('/ratings', ratingRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));