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
import errorMiddleware from './middlewares/errorMiddleware.js';
import { requestLogger } from './utils/logger.js';

dotenv.config();
connectDB();

const app = express();
app.use(requestLogger); 
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));