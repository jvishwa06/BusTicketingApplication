const TripRepository = require('../repositories/TripRepository');
const BookingRepository = require('../repositories/bookingRepository');
const appLogger = require('../utils/appLogger');

class TripService {
  async createTrip(tripData, operatorId) {
    const trip = await TripRepository.create({
      ...tripData,
      operator: operatorId,
      availableSeats: tripData.busDetails.totalSeats,
    });
    appLogger.info({ message: 'Trip created', tripId: trip._id, operatorId });
    return trip;
  }

  async getOperatorTrips(operatorId) {
    const trips = await TripRepository.findByOperator(operatorId);
    appLogger.info({ message: 'Fetched operator trips', operatorId, count: trips.length });
    return trips;
  }

  async getTrip(tripId, operatorId) {
    const trip = await TripRepository.findByIdAndOperator(tripId, operatorId);
    if (!trip) throw new Error('Trip not found');
    appLogger.info({ message: 'Fetched trip', tripId });
    return trip;
  }

  async updateTrip(tripId, operatorId, updates) {
    const trip = await TripRepository.update(tripId, operatorId, updates);
    if (!trip) throw new Error('Trip not found');
    appLogger.info({ message: 'Updated trip', tripId });
    return trip;
  }

  async cancelTrip(tripId, operatorId) {
    const trip = await TripRepository.findByIdAndOperator(tripId, operatorId);
    if (!trip) throw new Error('Trip not found');

    trip.status = 'cancelled';
    await TripRepository.update(tripId, operatorId, { status: 'cancelled' });
    await BookingRepository.updateManyByTripId(tripId, { status: 'cancelled', paymentStatus: 'refunded' });

    appLogger.info({ message: 'Trip cancelled', tripId });
    return trip;
  }

  async getTripAnalytics(tripId, operatorId) {
    const trip = await TripRepository.findByIdAndOperator(tripId, operatorId);
    if (!trip) throw new Error('Trip not found');

    const bookings = await BookingRepository.findByTripId(tripId);
    const analytics = {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.amount, 0),
      averageRating: bookings.reduce((sum, b) => sum + (b.feedback?.rating || 0), 0) / bookings.length || 0,
    };

    appLogger.info({ message: 'Generated trip analytics', tripId, totalBookings: analytics.totalBookings });
    return analytics;
  }

  async getSeatAvailability(tripId, operatorId) {
    const trip = await TripRepository.findByIdAndOperator(tripId, operatorId);
    if (!trip) throw new Error('Trip not found');

    const bookings = await BookingRepository.findConfirmedByTripId(tripId);
    const bookedSeats = bookings.map(b => b.seatNumber);
    const availableSeats = Array.from(
      { length: trip.busDetails.totalSeats },
      (_, i) => i + 1
    ).filter(seat => !bookedSeats.includes(seat));

    appLogger.info({ message: 'Fetched seat availability', tripId, availableSeats: availableSeats.length });
    return { totalSeats: trip.busDetails.totalSeats, availableSeats, bookedSeats };
  }
}

module.exports = new TripService();