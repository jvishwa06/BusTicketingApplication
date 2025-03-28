import BookingService from '../services/bookingService.js';
import appLogger from '../utils/appLogger.js';

class BookingController {
  static async getTripBookings(req, res) {
    try {
      const bookings = await BookingService.getTripBookings(req.params.tripId, req.operator._id);
      res.json(bookings);
    } catch (error) {
      appLogger.error({ message: 'Error fetching trip bookings', tripId: req.params.tripId, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 500).json({ message: error.message });
    }
  }

  static async updateBookingStatus(req, res) {
    try {
      const { status } = req.body;
      const booking = await BookingService.updateBookingStatus(req.params.id, req.operator._id, status);
      res.json(booking);
    } catch (error) {
      appLogger.error({ message: 'Error updating booking status', bookingId: req.params.id, error: error.message });
      res.status(error.message === 'Booking not found' ? 404 : 400).json({ message: error.message });
    }
  }

  static async getBookingAnalytics(req, res) {
    try {
      const analytics = await BookingService.getBookingAnalytics(req.operator._id);
      res.json(analytics);
    } catch (error) {
      appLogger.error({ message: 'Error fetching booking analytics', operatorId: req.operator._id, error: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  static async getBookingDetails(req, res) {
    try {
      const booking = await BookingService.getBookingDetails(req.params.id, req.operator._id);
      res.json(booking);
    } catch (error) {
      appLogger.error({ message: 'Error fetching booking details', bookingId: req.params.id, error: error.message });
      res.status(error.message === 'Booking not found' ? 404 : 500).json({ message: error.message });
    }
  }
}

export default BookingController;