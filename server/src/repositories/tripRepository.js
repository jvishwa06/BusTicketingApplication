import Trip from '../models/Trip.js';
import { appLogger } from '../utils/logger.js';

class TripRepository {
    async findTripsByFilters(source, destination, searchDate, nextDay) {
        appLogger.info(`Querying trips from DB with source: ${source}, destination: ${destination}, date range: ${searchDate} - ${nextDay}`);
        return await Trip.find({
            source: { $regex: new RegExp(`^${source}$`, "i") },
            destination: { $regex: new RegExp(`^${destination}$`, "i") },
            departureTime: { $gte: searchDate, $lt: nextDay }
        }).populate('busId');
    }
    
    async createTrip(tripData) {
        appLogger.info(`Saving new trip to DB for bus ID: ${tripData.busId}`);
        return await Trip.create(tripData);
    }

    async getAllTrips(query = {}) {
        appLogger.info("Fetching all trips from DB");
        return await Trip.find(query);
    }

    async getTripById(tripId) {
        appLogger.info(`Fetching trip from DB with ID: ${tripId}`);
        return await Trip.findById(tripId).populate('busId').exec();
    }

    async getTripsByOperator(operatorId) {
        appLogger.info(`Fetching trips from DB for operator ID: ${operatorId}`);
        return await Trip.find({ operatorId });
    }

    async updateTrip(tripId, updateData) {
        appLogger.info(`Updating trip in DB with ID: ${tripId}`);
        return await Trip.findByIdAndUpdate(tripId, updateData, { new: true });
    }

    async deleteTrip(tripId) {
        appLogger.info(`Deleting trip from DB with ID: ${tripId}`);
        return await Trip.findByIdAndDelete(tripId);
    }
}

export default new TripRepository();