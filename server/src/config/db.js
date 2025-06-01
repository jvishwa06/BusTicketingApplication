import mongoose from 'mongoose';
import { appLogger } from '../utils/logger.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        appLogger.info('MongoDB Connected Successfully');
        console.log("Connected to MongoDB");
    } catch (error) {
        appLogger.error(`MongoDB Connection Failed: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;
