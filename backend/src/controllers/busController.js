import BusService from '../services/busService.js';
import { logger } from '../utils/logger.js';

class BusController {
    static async createBus(req, res) {
        try {
            const bus = await BusService.createBus(req.user.id, req.body);
            logger.info(`Bus created by user ${req.user.id}`);
            res.status(201).json({
                success: true,
                message: 'Bus created successfully',
                data: bus
            });
        } catch (error) {
            logger.error(`Error creating bus by user ${req.user.id}: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }

    static async getBuses(req, res) {
        try {
            const buses = await BusService.getBuses();
            logger.info("Fetched buses successfully");
            res.status(200).json({
                success: true,
                message: 'Buses retrieved successfully',
                data: buses
            });
        } catch (error) {
            logger.error(`Error fetching buses: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }
}

export default BusController;