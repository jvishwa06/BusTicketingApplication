import TripRepository from '../repositories/tripRepository.js';
import BusRepository from '../repositories/busRepository.js';
import { logger } from '../utils/logger.js';

class TripService {
    async getTripsByFilters(filters) {
        try {
            let { source, destination, date } = filters;

            if (!source || !destination || !date) {
                logger.warn("Trip search failed: Missing required parameters");
                throw new Error("Source, destination, and date are required to search for trips.");
            }
            source = source.trim();
            destination = destination.trim();

            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);

            const nextDay = new Date(searchDate);
            nextDay.setDate(searchDate.getDate() + 1);
            
            logger.info(`Searching trips from ${source} to ${destination} on ${date}`);
            return await TripRepository.findTripsByFilters(source, destination, searchDate, nextDay);
        } catch (error) {
            logger.error(`Error fetching trips by filters: ${error.message}`);
            throw error;
        }
    }

    async createTrip(tripData) {
        try {
            if (!tripData.busId) {
                logger.warn("Trip creation failed: Missing bus ID");
                throw new Error('Bus ID is required to create a trip');
            }

            const bus = await BusRepository.getBusById(tripData.busId);
            if (!bus) {
                logger.warn(`Trip creation failed: Bus not found with ID ${tripData.busId}`);
                throw new Error(`Bus with ID ${tripData.busId} not found`);
            }

            logger.info(`Creating trip for bus ${tripData.busId}`);
            return await TripRepository.createTrip({ ...tripData, operatorId: bus.operatorId });
        } catch (error) {
            logger.error(`Error creating trip: ${error.message}`);
            throw error;
        }
    }

    async getAllTrips() {
        try {
            logger.info("Fetching all trips");
            return await TripRepository.getAllTrips();
        } catch (error) {
            logger.error(`Error fetching all trips: ${error.message}`);
            throw error;
        }
    }

    async getTripById(tripId) {
        try {
            logger.info(`Fetching trip with ID: ${tripId}`);
            return await TripRepository.getTripById(tripId);
        } catch (error) {
            logger.error(`Error fetching trip by ID ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async updateTrip(tripId, updateData) {
        try {
            logger.info(`Updating trip with ID: ${tripId}`);
            return await TripRepository.updateTrip(tripId, updateData);
        } catch (error) {
            logger.error(`Error updating trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async deleteTrip(tripId) {
        try {
            logger.info(`Deleting trip with ID: ${tripId}`);
            return await TripRepository.deleteTrip(tripId);
        } catch (error) {
            logger.error(`Error deleting trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }
}

export default new TripService();