import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import busRoutes from './routes/busRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import { requestLogger } from './utils/logger.js';
import rateLimiter from './middlewares/rateLimiterMiddleware.js';

dotenv.config();
connectDB();

const app = express();

app.set('trust proxy', 1);

app.use(requestLogger);
app.use(rateLimiter);
app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: ['https://hyperbus.local'],credentials: true}));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'HyperBus Server is running!', status: 'online', version: '1.0.0' });
});

app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/buses', busRoutes);
app.use('/trips', tripRoutes);
app.use('/bookings', bookingRoutes);
app.use('/ratings', ratingRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));