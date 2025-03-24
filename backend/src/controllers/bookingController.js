const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

// Get all bookings for a trip
exports.getTripBookings = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.tripId,
      operator: req.operator._id
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const bookings = await Booking.find({ trip: trip._id });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      trip: { $in: await Trip.find({ operator: req.operator._id }).select('_id') }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    if (status === 'confirmed' || status === 'cancelled') {
      const trip = await Trip.findById(booking.trip);
      if (status === 'confirmed') {
        trip.availableSeats -= 1;
      } else {
        trip.availableSeats += 1;
      }
      await trip.save();
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get booking analytics
exports.getBookingAnalytics = async (req, res) => {
  try {
    const operatorTrips = await Trip.find({ operator: req.operator._id }).select('_id');
    const tripIds = operatorTrips.map(trip => trip._id);

    const bookings = await Booking.find({ trip: { $in: tripIds } });
    
    const analytics = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.amount, 0),
      averageRating: bookings.reduce((sum, booking) => 
        sum + (booking.feedback?.rating || 0), 0) / bookings.length || 0,
      bookingsByStatus: {
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
      }
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      trip: { $in: await Trip.find({ operator: req.operator._id }).select('_id') }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 