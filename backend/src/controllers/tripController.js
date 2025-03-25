const TripService = require('../services/tripservice.js');
const appLogger = require('../utils/appLogger');

class TripController {
  static async createTrip(req, res) {
    try {
      const trip = await TripService.createTrip(req.body, req.operator._id);
      res.status(201).json(trip);
    } catch (error) {
      appLogger.error({ message: 'Error creating trip', operatorId: req.operator._id, error: error.message });
      res.status(400).json({ message: error.message });
    }
  }

  static async getOperatorTrips(req, res) {
    try {
      const trips = await TripService.getOperatorTrips(req.operator._id);
      res.json(trips);
    } catch (error) {
      appLogger.error({ message: 'Error fetching operator trips', operatorId: req.operator._id, error: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  static async getTrip(req, res) {
    try {
      const trip = await TripService.getTrip(req.params.id, req.operator._id);
      res.json(trip);
    } catch (error) {
      appLogger.error({ message: 'Error fetching trip', tripId: req.params.id, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 500).json({ message: error.message });
    }
  }

  static async updateTrip(req, res) {
    try {
      const trip = await TripService.updateTrip(req.params.id, req.operator._id, req.body);
      res.json(trip);
    } catch (error) {
      appLogger.error({ message: 'Error updating trip', tripId: req.params.id, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 400).json({ message: error.message });
    }
  }

  static async cancelTrip(req, res) {
    try {
      const trip = await TripService.cancelTrip(req.params.id, req.operator._id);
      res.json(trip);
    } catch (error) {
      appLogger.error({ message: 'Error cancelling trip', tripId: req.params.id, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 500).json({ message: error.message });
    }
  }

  static async getTripAnalytics(req, res) {
    try {
      const analytics = await TripService.getTripAnalytics(req.params.id, req.operator._id);
      res.json(analytics);
    } catch (error) {
      appLogger.error({ message: 'Error fetching trip analytics', tripId: req.params.id, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 500).json({ message: error.message });
    }
  }

  static async getSeatAvailability(req, res) {
    try {
      const availability = await TripService.getSeatAvailability(req.params.id, req.operator._id);
      res.json(availability);
    } catch (error) {
      appLogger.error({ message: 'Error fetching seat availability', tripId: req.params.id, error: error.message });
      res.status(error.message === 'Trip not found' ? 404 : 500).json({ message: error.message });
    }
  }
}

module.exports = TripController;