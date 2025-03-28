import mongoose from 'mongoose';
import dotenv from 'dotenv';
import applogger from '../utils/appLogger.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    applogger.info(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (err) {
    applogger.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  applogger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  applogger.warn('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

export default connectDB;
