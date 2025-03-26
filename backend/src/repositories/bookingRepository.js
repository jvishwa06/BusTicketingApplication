const Booking = require('../models/booking');
const applogger = require('../utils/appLogger');

class BookingRepository {
  async findByTripId(tripId) {
    try {
      return await Booking.find({ trip: tripId });
    } catch (error) {
      applogger.error({ message: 'Failed to fetch bookings by trip', tripId, error: error.message });
      throw error;
    }
  }

  async findByIdAndTripIds(bookingId, tripIds) {
    try {
      return await Booking.findOne({ _id: bookingId, trip: { $in: tripIds } });
    } catch (error) {
      applogger.error({ message: 'Failed to fetch booking by ID', bookingId, error: error.message });
      throw error;
    }
  }

  async findConfirmedByTripId(tripId) {
    try {
      return await Booking.find({ trip: tripId, status: 'confirmed' });
    } catch (error) {
      applogger.error({ message: 'Failed to fetch confirmed bookings', tripId, error: error.message });
      throw error;
    }
  }

  async updateStatus(bookingId, status) {
    try {
      return await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
    } catch (error) {
      applogger.error({ message: 'Failed to update booking status', bookingId, status, error: error.message });
      throw error;
    }
  }

  async updateManyByTripId(tripId, updates) {
    try {
      return await Booking.updateMany({ trip: tripId }, updates);
    } catch (error) {
      applogger.error({ message: 'Failed to update multiple bookings', tripId, error: error.message });
      throw error;
    }
  }
}

module.exports = new BookingRepository();