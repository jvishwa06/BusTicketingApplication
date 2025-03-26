const Trip = require('../models/trip');
const appLogger = require('../utils/appLogger');

class TripRepository {
  async create(tripData) {
    try {
      const trip = new Trip(tripData);
      return await trip.save();
    } catch (error) {
      appLogger.error({ message: 'Failed to create trip', error: error.message });
      throw error;
    }
  }

  async findAll() {
    try {
      return await Trip.find();  
    } catch (error) {
      throw new Error('Error while fetching trips');
    }
  }


  async findById(tripId) {
    try {
      return await Trip.findById(tripId);  
    } catch (error) {
      throw new Error('Error while fetching trip');
    }
  }

  async findByOperator(operatorId) {
    try {
      return await Trip.find({ operator: operatorId });
    } catch (error) {
      appLogger.error({ message: 'Failed to fetch trips by operator', operatorId, error: error.message });
      throw error;
    }
  }

  async findByIdAndOperator(tripId, operatorId) {
    try {
      return await Trip.findOne({ _id: tripId, operator: operatorId });
    } catch (error) {
      appLogger.error({ message: 'Failed to fetch trip by ID', tripId, operatorId, error: error.message });
      throw error;
    }
  }

  async findTripIdsByOperator(operatorId) {
    try {
      return await Trip.find({ operator: operatorId }).select('_id');
    } catch (error) {
      appLogger.error({ message: 'Failed to fetch trip IDs by operator', operatorId, error: error.message });
      throw error;
    }
  }

  async update(tripId, operatorId, updates) {
    try {
      return await Trip.findOneAndUpdate(
        { _id: tripId, operator: operatorId },
        updates,
        { new: true, runValidators: true }
      );
    } catch (error) {
      appLogger.error({ message: 'Failed to update trip', tripId, operatorId, error: error.message });
      throw error;
    }
  }

  async updateSeats(tripId, availableSeats) {
    try {
      return await Trip.findByIdAndUpdate(tripId, { availableSeats }, { new: true });
    } catch (error) {
      appLogger.error({ message: 'Failed to update trip seats', tripId, error: error.message });
      throw error;
    }
  }
}

module.exports = new TripRepository();