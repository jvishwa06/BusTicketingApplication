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
            next(error); // Pass the error to the error handling middleware
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
            next(error); // Pass the error to the error handling middleware
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
                    data: [] // Empty array to indicate no trips found
                });
            }

            res.status(200).json({ 
                success: true, 
                message: "Trips fetched successfully", 
                data: trips 
            });
        } catch (error) {
            logger.error(`Failed to fetch filtered trips: ${error.message}`);
            next(error); // Pass the error to the error handling middleware
        }
    }
}

export default TripController;