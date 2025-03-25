const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const connectDB = require('./config/db'); 
const requestLogger = require('./utils/requestLogger'); 

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

module.exports = app;