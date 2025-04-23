import TripService from '../services/tripService.js';
import { appLogger } from '../utils/logger.js';

class TripController {
    static async createTrip(req, res, next) {
        try {
            appLogger.info("Received request to create a new trip");
            const trip = await TripService.createTrip(req.body);
            res.status(201).json({ 
                success: true, 
                message: "Trip created successfully", 
                data: trip 
            });
        } catch (error) {
            appLogger.error(`Trip creation failed: ${error.message}`);
            
            if (error.name === 'ValidationError') {
                const validationErrors = {};
                
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        validationErrors[field] = error.errors[field].message;
                    });
                }
                
                return res.status(400).json({
                    success: false,
                    message: "Trip validation failed. Please check your input.",
                    errors: validationErrors
                });
            }
            
            res.status(500).json({
                success: false,
                message: "Failed to create trip. Please try again.",
                error: error.message
            });
        }
    }

    static async getTrip(req, res, next) {
        try {
            appLogger.info("Received request to fetch operator trips");
            
            const operatorId = req.user._id;
            const trips = await TripService.getTrip(operatorId);
            
            res.status(200).json({ 
                success: true, 
                message: "Operator trips fetched successfully", 
                data: trips 
            });
        } catch (error) {
            appLogger.error(`Failed to fetch operator trips: ${error.message}`);
            next(error); 
        }
    }

    static async getFilteredTrips(req, res, next) {
        try {
            const { source, destination, date } = req.query;
            appLogger.info(`Fetching trips with filters: source=${source}, destination=${destination}, date=${date}`);

            const trips = await TripService.getTripsByFilters({ source, destination, date });

            if (trips.length === 0) {
                appLogger.warn("No trips found for the given filters");
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
            appLogger.error(`Failed to fetch filtered trips: ${error.message}`);
            next(error); 
        }
    }

    static async updateTrip(req, res) {
        try {
            const tripId = req.params.tripId;
            const operatorId = req.user._id;
            
            const updatedTrip = await TripService.updateTrip(tripId, req.body, operatorId);
            
            if (!updatedTrip) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Trip not found" 
                });
            }
            
            appLogger.info("Trip updated successfully");
            res.status(200).json({ 
                success: true, 
                message: "Trip updated successfully", 
                data: updatedTrip 
            });
        } catch (error) {
            appLogger.error(`Failed to update trip: ${error.message}`);
            
            if (error.message.includes('not authorized')) {
                return res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    static async deleteTrip(req, res) {
        try {
            const tripId = req.params.tripId;
            const operatorId = req.user._id;
            
            const deletedTrip = await TripService.deleteTrip(tripId, operatorId);
            
            if (!deletedTrip) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Trip not found" 
                });
            }
            
            appLogger.info("Trip deleted successfully");
            res.status(200).json({ 
                success: true, 
                message: "Trip deleted successfully" 
            });
        } catch (error) {
            appLogger.error(`Failed to delete trip: ${error.message}`);
            
            if (error.message.includes('not authorized')) {
                return res.status(403).json({ 
                    success: false, 
                    message: error.message 
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
}

export default TripController;