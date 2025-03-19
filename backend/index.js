const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Operator = require('./models/Operator');
const Bus = require('./models/Bus');
const Trip = require('./models/Trip');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Refund = require('./models/Refund');
const Feedback = require('./models/Feedback');
const Admin = require('./models/Admin');

const app = express();
const port = 5000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.log("Error connecting to MongoDB", err));

// Create new user (POST /api/users)
app.post('/api/users', async (req, res) => {
  try {
    const { userId, email, phone, password_hash, name, address } = req.body;

    const newUser = new User({
      userId,
      email,
      phone,
      password_hash,
      name,
      address,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser); 
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Create new operator (POST /api/operators)
app.post('/api/operators', async (req, res) => {
  try {
    const { companyName, contactEmail, contactPhone, password_hash } = req.body;

    const newOperator = new Operator({
      companyName,
      contactEmail,
      contactPhone,
      password_hash,
    });

    const savedOperator = await newOperator.save();
    res.status(201).json(savedOperator);
  } catch (error) {
    console.error('Error creating operator', error);
    res.status(500).json({ error: 'Error creating operator' });
  }
});

// Create new bus (POST /api/buses)
app.post('/api/buses', async (req, res) => {
  try {
    const { operatorId, busType, seatLayout, amenities } = req.body;

    const newBus = new Bus({
      operatorId,
      busType,
      seatLayout,
      amenities,
    });

    const savedBus = await newBus.save();
    res.status(201).json(savedBus);
  } catch (error) {
    console.error('Error creating bus', error);
    res.status(500).json({ error: 'Error creating bus' });
  }
});

// Create new trip (POST /api/trips)
app.post('/api/trips', async (req, res) => {
  try {
    const { busId, source, destination, departureTime, arrivalTime, pricing, status } = req.body;

    const newTrip = new Trip({
      busId,
      source,
      destination,
      departureTime,
      arrivalTime,
      pricing,
      status,
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error('Error creating trip', error);
    res.status(500).json({ error: 'Error creating trip' });
  }
});

// Create new booking (POST /api/bookings)
app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, tripId, seatNumber, passengerName, bookingStatus, paymentStatus } = req.body;

    const newBooking = new Booking({
      userId,
      tripId,
      seatNumber,
      passengerName,
      bookingStatus,
      paymentStatus,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking', error);
    res.status(500).json({ error: 'Error creating booking' });
  }
});

// Create new payment (POST /api/payments)
app.post('/api/payments', async (req, res) => {
  try {
    const { userId, bookingId, amount, paymentMethod, paymentStatus } = req.body;

    const newPayment = new Payment({
      userId,
      bookingId,
      amount,
      paymentMethod,
      paymentStatus,
    });

    const savedPayment = await newPayment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error('Error creating payment', error);
    res.status(500).json({ error: 'Error creating payment' });
  }
});

// Create new refund (POST /api/refunds)
app.post('/api/refunds', async (req, res) => {
  try {
    const { userId, bookingId, amount, refundMethod, refundStatus } = req.body;

    const newRefund = new Refund({
      userId,
      bookingId,
      amount,
      refundMethod,
      refundStatus,
    });

    const savedRefund = await newRefund.save();
    res.status(201).json(savedRefund);
  } catch (error) {
    console.error('Error creating refund', error);
    res.status(500).json({ error: 'Error creating refund' });
  }
});

// Create new feedback (POST /api/feedback)
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, tripId, rating, comment } = req.body;

    const newFeedback = new Feedback({
      userId,
      tripId,
      rating,
      comment,
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error('Error creating feedback', error);
    res.status(500).json({ error: 'Error creating feedback' });
  }
});

// Create new admin (POST /api/admins)
app.post('/api/admins', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    const newAdmin = new Admin({
      email,
      password_hash,
    });

    const savedAdmin = await newAdmin.save();
    res.status(201).json(savedAdmin);
  } catch (error) {
    console.error('Error creating admin', error);
    res.status(500).json({ error: 'Error creating admin' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
