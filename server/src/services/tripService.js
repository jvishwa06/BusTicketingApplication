import TripRepository from '../repositories/tripRepository.js';
import BusRepository from '../repositories/busRepository.js';
import { appLogger } from '../utils/logger.js';

class TripService {
    async getTripsByFilters(filters) {
        try {
            let { source, destination, date } = filters;

            if (!source || !destination || !date) {
                appLogger.warn("Trip search failed: Missing required parameters");
                throw new Error("Source, destination, and date are required to search for trips.");
            }
            source = source.trim();
            destination = destination.trim();

            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(searchDate);
            nextDay.setDate(searchDate.getDate() + 1);
            
            appLogger.info(`Searching trips from ${source} to ${destination} on ${date}`);
            return await TripRepository.findTripsByFilters(source, destination, searchDate, nextDay);
        } catch (error) {
            appLogger.error(`Error fetching trips by filters: ${error.message}`);
            throw error;
        }
    }

    async createTrip(tripData) {
        try {
            if (!tripData.busId) {
                appLogger.warn("Trip creation failed: Missing bus ID");
                throw new Error('Bus ID is required to create a trip');
            }

            const bus = await BusRepository.getBusById(tripData.busId);
            if (!bus) {
                appLogger.warn(`Trip creation failed: Bus not found with ID ${tripData.busId}`);
                throw new Error(`Bus with ID ${tripData.busId} not found`);
            }

            appLogger.info(`Creating trip for bus ${tripData.busId}`);
            return await TripRepository.createTrip({ ...tripData, operatorId: bus.operatorId });
        } catch (error) {
            appLogger.error(`Error creating trip: ${error.message}`);
            throw error;
        }
    }

    async getAllTrips() {
        try {
            appLogger.info("Fetching all trips");
            return await TripRepository.getAllTrips();
        } catch (error) {
            appLogger.error(`Error fetching all trips: ${error.message}`);
            throw error;
        }
    }

    async getTripById(tripId) {
        try {
            appLogger.info(`Fetching trip with ID: ${tripId}`);
            return await TripRepository.getTripById(tripId);
        } catch (error) {
            appLogger.error(`Error fetching trip by ID ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async updateTrip(tripId, updateData) {
        try {
            appLogger.info(`Updating trip with ID: ${tripId}`);
            return await TripRepository.updateTrip(tripId, updateData);
        } catch (error) {
            appLogger.error(`Error updating trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async deleteTrip(tripId) {
        try {
            appLogger.info(`Deleting trip with ID: ${tripId}`);
            return await TripRepository.deleteTrip(tripId);
        } catch (error) {
            appLogger.error(`Error deleting trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }
}

export default new TripService();