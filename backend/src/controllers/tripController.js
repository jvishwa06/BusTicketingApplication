const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

// Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const trip = new Trip({
      ...req.body,
      operator: req.operator._id,
      availableSeats: req.body.busDetails.totalSeats
    });
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all trips for an operator
exports.getOperatorTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ operator: req.operator._id });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific trip
exports.getTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      operator: req.operator._id
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update trip details
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, operator: req.operator._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel a trip
exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      operator: req.operator._id
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    trip.status = 'cancelled';
    await trip.save();
    
    // Update all bookings for this trip
    await Booking.updateMany(
      { trip: trip._id },
      { status: 'cancelled', paymentStatus: 'refunded' }
    );
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get trip analytics
exports.getTripAnalytics = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      operator: req.operator._id
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const bookings = await Booking.find({ trip: trip._id });
    const analytics = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.amount, 0),
      averageRating: bookings.reduce((sum, booking) => 
        sum + (booking.feedback?.rating || 0), 0) / bookings.length || 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get seat availability for a trip
exports.getSeatAvailability = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      operator: req.operator._id
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const bookings = await Booking.find({
      trip: trip._id,
      status: 'confirmed'
    });
    
    const bookedSeats = bookings.map(booking => booking.seatNumber);
    const availableSeats = Array.from(
      { length: trip.busDetails.totalSeats },
      (_, i) => i + 1
    ).filter(seat => !bookedSeats.includes(seat));

    res.json({
      totalSeats: trip.busDetails.totalSeats,
      availableSeats,
      bookedSeats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 