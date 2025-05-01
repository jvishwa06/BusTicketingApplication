import Trip from '../models/trip.js';
import { appLogger } from '../utils/logger.js';

class TripRepository {
    async createTrip(tripData) {
        appLogger.info(`Saving new trip to DB for bus ID: ${tripData.busId}`);
        return await Trip.create(tripData);
    }

    async findTripsByFilters(source, destination, searchDate, nextDay) {
        appLogger.info(`Querying trips from DB with source: ${source}, destination: ${destination}, date range: ${searchDate} - ${nextDay}`);
        return await Trip.find({
            source: { $regex: new RegExp(`^${source}$`, "i") },
            destination: { $regex: new RegExp(`^${destination}$`, "i") },
            departureTime: { $gte: searchDate, $lt: nextDay }
        }).populate('busId');
    }

    async getAllTrips(query = {}) {
        appLogger.info("Fetching all trips from DB");
        return await Trip.find(query);
    }

    async getTripById(tripId) {
        appLogger.info(`Fetching trip from DB with ID: ${tripId}`);
        return await Trip.findById(tripId).populate('busId').exec();
    }

    async getTrip(operatorId) {
        appLogger.info(`Fetching trips from DB for operator ID: ${operatorId}`);
        return await Trip.find({ operatorId }).populate('busId').exec();
    }

    async getTripsByBusIds(busIds) {
        try {
            appLogger.info(`Fetching trips from DB for bus IDs: ${busIds}`);
            return await Trip.find({ busId: { $in: busIds } }).populate('busId');
        } catch (error) {
            appLogger.error(`Error fetching trips for bus IDs: ${error.message}`);
            throw error;
        }
    }

    async updateTrip(tripId, updateData) {
        try {
            const allowedUpdates = ['departureTime', 'arrivalTime', 'price', 'status', 'availableSeats', 'source', 'destination', 'distance'];
            const updates = {};
            
            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = updateData[key];
                }
            });
            
            if (updateData.fare && !updates.price) {
                updates.price = updateData.fare;
            }
            
            if (updates.departureTime) {
                updates.departureTime = new Date(updates.departureTime);
            }
            if (updates.arrivalTime) {
                updates.arrivalTime = new Date(updates.arrivalTime);
            }
            
            appLogger.info(`Modifying trip ${tripId} with data:`, updates);
            const trip = await Trip.findByIdAndUpdate(
                tripId, 
                updates, 
                { new: true, runValidators: true }
            );
            
            if (!trip) {
                appLogger.warn(`Trip with ID ${tripId} not found`);
                return null;
            }
            
            return trip;
        } catch (error) {
            appLogger.error(`Error modifying trip: ${error.message}`);
            throw error;
        }
    }
    async deleteTrip(tripId) {
        appLogger.info(`Deleting trip from DB with ID: ${tripId}`);
        return await Trip.findByIdAndDelete(tripId);
    }
}

export default new TripRepository();