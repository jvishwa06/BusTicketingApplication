import TripService from '../services/tripService.js';
import { logger } from '../utils/logger.js';

class TripController {
    static async createTrip(req, res, next) {
        try {
            logger.info("Received request to create a new trip");
            const trip = await TripService.createTrip(req.body);
            res.status(201).json({ 
                success: true, 
                message: "Trip created successfully", 
                data: trip 
            });
        } catch (error) {
            logger.error(`Trip creation failed: ${error.message}`);
            next(error); 
        }
    }

    static async getAllTrips(req, res, next) {
        try {
            logger.info("Received request to fetch all trips");
            const trips = await TripService.getAllTrips(req.query);
            res.status(200).json({ 
                success: true, 
                message: "Trips fetched successfully", 
                data: trips 
            });
        } catch (error) {
            logger.error(`Failed to fetch trips: ${error.message}`);
            next(error); 
        }
    }

    static async getFilteredTrips(req, res, next) {
        try {
            const { source, destination, date } = req.query;
            logger.info(`Fetching trips with filters: source=${source}, destination=${destination}, date=${date}`);

            const trips = await TripService.getTripsByFilters({ source, destination, date });

            if (trips.length === 0) {
                logger.warn("No trips found for the given filters");
                return res.status(404).json({ 
                    success: false, 
                    message: "No trips found for the given filters.", 
                    data: [] 
                });
            }

            res.status(200).json({ 
                success: true, 
                message: "Trips fetched successfully", 
                data: trips 
            });
        } catch (error) {
            logger.error(`Failed to fetch filtered trips: ${error.message}`);
            next(error); 
        }
    }

    static async updateTrip(req, res) {
        try {
            const updatedTrip = await TripService.updateTrip(req.params.tripId, req.body);
            if (!updatedTrip) {
                return res.status(404).json({ success: false, message: "Trip not found" });
            }
            res.status(200).json({ success: true, message: "Trip updated successfully", data: updatedTrip });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteTrip(req, res) {
        try {
            const deletedTrip = await TripService.deleteTrip(req.params.tripId);
            if (!deletedTrip) {
                return res.status(404).json({ success: false, message: "Trip not found" });
            }
            res.status(200).json({ success: true, message: "Trip deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default TripController;