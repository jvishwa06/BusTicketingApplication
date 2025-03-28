import BookingRepository from '../repositories/bookingRepository.js';
import TripRepository from '../repositories/tripRepository.js';
import appLogger from '../utils/appLogger.js';
class BookingService {
  async getTripBookings(tripId, operatorId) {
    const trip = await TripRepository.findByIdAndOperator(tripId, operatorId);
    if (!trip) throw new Error('Trip not found');

    const bookings = await BookingRepository.findByTripId(tripId);
    appLogger.info({ message: 'Fetched trip bookings', tripId, count: bookings.length });
    return bookings;
  }

  async updateBookingStatus(bookingId, operatorId, status) {
    const tripIds = (await TripRepository.findTripIdsByOperator(operatorId)).map(t => t._id);
    const booking = await BookingRepository.findByIdAndTripIds(bookingId, tripIds);
    if (!booking) throw new Error('Booking not found');

    const updatedBooking = await BookingRepository.updateStatus(bookingId, status);
    appLogger.info({ message: 'Updated booking status', bookingId, status });

    if (status === 'confirmed' || status === 'cancelled') {
      const trip = await TripRepository.findByIdAndOperator(booking.trip, operatorId);
      trip.availableSeats = status === 'confirmed' ? trip.availableSeats - 1 : trip.availableSeats + 1;
      await TripRepository.updateSeats(trip._id, trip.availableSeats);
      appLogger.info({ message: 'Updated trip seats', tripId: trip._id, availableSeats: trip.availableSeats });
    }

    return updatedBooking;
  }

  async getBookingAnalytics(operatorId) {
    const tripIds = (await TripRepository.findTripIdsByOperator(operatorId)).map(t => t._id);
    const bookings = await BookingRepository.findByTripId({ $in: tripIds });

    const analytics = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.amount, 0),
      averageRating: Number(
        (bookings.reduce((sum, b) => sum + (b.feedback?.rating || 0), 0) / bookings.length || 0).toFixed(2)
      ),
      bookingsByStatus: {
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
      },
    };

    appLogger.info({ message: 'Generated booking analytics', operatorId, totalBookings: analytics.totalBookings });
    return analytics;
  }

  async getBookingDetails(bookingId, operatorId) {
    const tripIds = (await TripRepository.findTripIdsByOperator(operatorId)).map(t => t._id);
    const booking = await BookingRepository.findByIdAndTripIds(bookingId, tripIds);
    if (!booking) throw new Error('Booking not found');

    appLogger.info({ message: 'Fetched booking details', bookingId });
    return booking;
  }
}

export default new BookingService();