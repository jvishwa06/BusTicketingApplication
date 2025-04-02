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

    static async updateBus(req, res) {
        try {
            const { busId } = req.params;
            const updatedBus = await BusService.updateBus(busId, req.body);
            logger.info("bus updated successfully");
            res.status(200).json({ success: true, message: 'Bus updated successfully', data: updatedBus });
        } catch (error) {
            logger.error(`Error updating buses: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteBus(req, res) {
        try {
            const { busId } = req.params;
            await BusService.deleteBus(busId);
            logger.info("bus deleted successfully");
            res.status(200).json({ success: true, message: 'Bus deleted successfully' });
        } catch (error) {
            logger.error(`Error deleting buses: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }

}

export default BusController;