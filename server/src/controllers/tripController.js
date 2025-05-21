import TripService from '../services/tripService.js';
import { appLogger } from '../utils/logger.js';

class TripController {
    static async createTrip(req, res) {
        try {
            appLogger.info("Received request to create a new trip");
            const trip = await TripService.createTrip(req.body);
            res.status(201).json({ success: true, message: "Trip created successfully", data: trip });
        } catch (error) {
            appLogger.error(`Trip creation failed: ${error.message}`);
            res.status(500).json({success: false,message: "Failed to create trip.",error: error.message});
        }
    }

    static async getTrip(req, res) {
        try {
            appLogger.info("Received request to fetch operator trips");
            
            const operatorId = req.user._id;
            const trips = await TripService.getTrip(operatorId);
            
            res.status(200).json({ success: true, message: "Operator trips fetched successfully", data: trips });
        } catch (error) {
            appLogger.error(`Failed to fetch operator trips: ${error.message}`);
            return res.status(500).json({ success: false, message: "Failed to fetch operator trips.", error: error.message });
        }
    }

    static async getFilteredTrips(req, res) {
        try {
            const { source, destination, date } = req.query;
            appLogger.info(`Fetching trips with filters: source=${source}, destination=${destination}, date=${date}`);

            const trips = await TripService.getTripsByFilters({ source, destination, date });

            if (trips.length === 0) {
                appLogger.warn("No trips found for the given filters");
                return res.status(404).json({ success: false, message: "No trips found for the given filters.", data: {}});
            }

            res.status(200).json({ success: true, message: "Trips fetched successfully", data: trips });
        } catch (error) {
            appLogger.error(`Failed to fetch filtered trips: ${error.message}`);
            return res.status(500).json({ success: false, message: "Failed to fetch filtered trips", error: error.message });
        }
    }

    static async updateTrip(req, res) {
        try {
            const { tripId } = req.params;
            
            const updatedTrip = await TripService.updateTrip(tripId, req.body, req.user);
            
            appLogger.info(`Trip updated successfully: ${tripId}`);
            res.status(200).json({success: true,message: 'Trip updated successfully',data: updatedTrip});
        } catch (error) {
            appLogger.error(`Failed to update trip: ${error.message}`);
            res.status(500).json({success: false,message: 'Failed to update trip',error: error.message});
        }
    }

    static async deleteTrip(req, res) {
        try {
            const { tripId } = req.params;
            
            const deletedTrip = await TripService.deleteTrip(tripId, req.user);
            
            appLogger.info(`Trip deleted successfully: ${tripId}`);
            res.status(200).json({success: true,message: 'Trip deleted successfully',data: deletedTrip});
        } catch (error) {
            appLogger.error(`Failed to delete trip: ${error.message}`);
            res.status(500).json({success: false,message: 'Failed to delete trip',error: error.message});
        }
    }
}

export default TripController;