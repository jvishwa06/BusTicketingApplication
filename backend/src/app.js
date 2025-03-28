import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';

import requestLogger from './utils/requestLogger.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB();

const app = express();

app.use(express.json()); 
app.use(cors()); 
app.use(requestLogger); 

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/operator', operatorRoutes);

export default app;
