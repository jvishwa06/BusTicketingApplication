import BusService from '../services/busService.js';
import { appLogger } from '../utils/logger.js';

class BusController {
    static async createBus(req, res) {
        try {
            const bus = await BusService.createBus(req.user.id, req.body);
            appLogger.info(`Bus created by user ${req.user.id}`);
            res.status(201).json({
                success: true,
                message: 'Bus created successfully',
                data: bus
            });
        } catch (error) {
            appLogger.error(`Error creating bus by user ${req.user.id}: ${error.message}`);
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
            appLogger.info("Fetched buses successfully");
            res.status(200).json({
                success: true,
                message: 'Buses retrieved successfully',
                data: buses
            });
        } catch (error) {
            appLogger.error(`Error fetching buses: ${error.message}`);
            res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }
    }

    static async getOperatorBuses(req, res) {
        try {
            const operatorId = req.user.id;
            const buses = await BusService.getBusesByOperator(operatorId);
            appLogger.info(`Fetched buses for operator ${operatorId}`);
            res.status(200).json({
                success: true,
                message: 'Operator buses retrieved successfully',
                data: buses
            });
        } catch (error) {
            appLogger.error(`Error fetching buses for operator ${req.user.id}: ${error.message}`);
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
            appLogger.info("bus updated successfully");
            res.status(200).json({ success: true, message: 'Bus updated successfully', data: updatedBus });
        } catch (error) {
            appLogger.error(`Error updating buses: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteBus(req, res) {
        try {
            const { busId } = req.params;
            await BusService.deleteBus(busId);
            appLogger.info("bus deleted successfully");
            res.status(200).json({ success: true, message: 'Bus deleted successfully' });
        } catch (error) {
            appLogger.error(`Error deleting buses: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default BusController;