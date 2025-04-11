import TripService from '../services/tripService.js';
import BookingService from '../services/bookingService.js';
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
            logger.info("Trip updated successfully");
            res.status(200).json({ success: true, message: "Trip updated successfully", data: updatedTrip });
        } catch (error) {
            logger.error(`Failed to update trip: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteTrip(req, res) {
        try {
            const deletedTrip = await TripService.deleteTrip(req.params.tripId);
            if (!deletedTrip) {
                return res.status(404).json({ success: false, message: "Trip not found" });
            }
            logger.info("Trip deleted successfully");
            res.status(200).json({ success: true, message: "Trip deleted successfully" });
        } catch (error) {
            logger.error(`Failed to delete trip: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    
    static async getTripById(req, res, next) {
        try {
            const { tripId } = req.params;
            logger.info(`Fetching trip with ID: ${tripId}`);
            
            const trip = await TripService.getTripById(tripId);
            
            if (!trip) {
                return res.status(404).json({
                    success: false,
                    message: "Trip not found"
                });
            }
            
            const bookings = await BookingService.getBookingsByTripId(tripId);
            
            const bookedSeats = [];
            const pendingSeats = [];
            
            bookings.forEach(booking => {
                if (booking.paymentStatus === 'success') {
                    bookedSeats.push(...booking.seats);
                } else if (booking.paymentStatus === 'pending') {
                    pendingSeats.push(...booking.seats);
                }
            });
            
            const tripWithBookings = trip.toObject();
            tripWithBookings.bookedSeats = bookedSeats;
            tripWithBookings.pendingSeats = pendingSeats;
            
            const totalSeats = trip.busId ? trip.busId.totalSeats : 0;
            
            const bookedCount = bookedSeats.length;
            const pendingCount = pendingSeats.length;
            const availableSeats = totalSeats - (bookedCount + pendingCount);
            
            tripWithBookings.availableSeats = availableSeats;
            
            tripWithBookings.availableSeats = Math.max(0, parseInt(availableSeats));
            
            logger.info(`Trip ${tripId} seat calculation:
                Total seats: ${totalSeats}
                Booked seats: ${bookedCount} (${bookedSeats.join(',')})
                Pending seats: ${pendingCount} (${pendingSeats.join(',')})
                available seats: ${tripWithBookings.availableSeats}
            `);
            
            res.status(200).json({
                success: true,
                message: "Trip fetched successfully",
                data: tripWithBookings
            });
        } catch (error) {
            logger.error(`Failed to fetch trip: ${error.message}`);
            next(error);
        }
    }
}

export default TripController;