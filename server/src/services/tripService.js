import TripRepository from '../repositories/tripRepository.js';
import BusRepository from '../repositories/busRepository.js';
import { appLogger } from '../utils/logger.js';

class TripService {
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

    async getTrip(operatorId) {
        try {
            appLogger.info(`Fetching trips for operator with ID: ${operatorId}`);
            return await TripRepository.getTrip(operatorId);
        } catch (error) {
            appLogger.error(`Error fetching trips for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

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

    async updateTrip(tripId, updateData, userId = null) {
        try {
            appLogger.info(`Updating trip with ID: ${tripId}`);
            
            if (userId) {
                const trip = await TripRepository.getTripById(tripId);
                
                if (!trip) {
                    appLogger.warn(`Trip with ID ${tripId} not found`);
                    throw new Error(`Trip with ID ${tripId} not found`);
                }
                
                if (userId.role === 'admin') {
                    appLogger.info(`Admin user ${userId} is updating trip ${tripId}`);
                } else if (!trip.operatorId) {
                    appLogger.warn(`Unauthorized attempt to update trip ${tripId} by user ${userId}`);
                    throw new Error('You are not authorized to update this trip');
                } else if (trip.operatorId.toString() !== userId.toString()) {
                    appLogger.warn(`Unauthorized attempt to update trip ${tripId} by user ${userId}`);
                    throw new Error('You are not authorized to update this trip');
                }
            }
            
            const updatedTrip = await TripRepository.updateTrip(tripId, updateData);
            
            if (!updatedTrip) {
                appLogger.warn(`Trip with ID ${tripId} not found during update`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }
            
            appLogger.info(`Trip with ID ${tripId} updated successfully`);
            return updatedTrip;
        } catch (error) {
            appLogger.error(`Error updating trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }

    async deleteTrip(tripId, userId = null) {
        try {
            if (userId) {
                const trip = await TripRepository.getTripById(tripId);
                
                if (!trip) {
                    appLogger.warn(`Trip with ID ${tripId} not found`);
                    throw new Error(`Trip with ID ${tripId} not found`);
                }
                
                if (userId.role === 'admin') {
                    appLogger.info(`Admin user ${userId._id} is deleting trip ${tripId}`);
                } else if (trip.operatorId.toString() !== userId.toString()) {
                    appLogger.warn(`Unauthorized attempt to delete trip ${tripId} by user ${userId}`);
                    throw new Error('You are not authorized to delete this trip');
                }
            }
            
            const deletedTrip = await TripRepository.deleteTrip(tripId);
            
            if (!deletedTrip) {
                appLogger.warn(`Trip with ID ${tripId} not found during deletion`);
                throw new Error(`Trip with ID ${tripId} not found`);
            }
            
            appLogger.info(`Trip with ID ${tripId} deleted successfully`);
            return deletedTrip;
        } catch (error) {
            appLogger.error(`Error deleting trip with ID ${tripId}: ${error.message}`);
            throw error;
        }
    }
}

export default new TripService();