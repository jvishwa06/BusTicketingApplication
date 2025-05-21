import BusService from '../services/busService.js';
import { appLogger } from '../utils/logger.js';

class BusController {
    static async createBus(req, res) {
        try {
            const bus = await BusService.createBus(req.user.id, req.body);
            appLogger.info(`Bus created by user ${req.user.id}`);
            res.status(201).json({success: true,message: 'Bus created successfully',data: bus});
        } catch (error) {
            appLogger.error(`Error creating bus by user ${req.user.id}: ${error.message}`);
            res.status(500).json({success: false,message: "Failed to create bus",error: error.message});
        }
    }

    static async getBus(req, res) {
        try {
            const operatorId = req.user.id;
            const buses = await BusService.getBus(operatorId);
            appLogger.info(`Fetched buses for operator ${operatorId}`);
            res.status(200).json({ success: true, message: 'Operator buses retrieved successfully', data: buses });
        } catch (error) {
            appLogger.error(`Error fetching buses for operator ${req.user.id}: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to fetch bus", error: error.message });
        }
    }

    static async updateBus(req, res) {
        try {
            const { busId } = req.params;
            const operatorId = req.user.id;
            
            const updatedBus = await BusService.updateBus(busId, req.body, operatorId);
            appLogger.info(`Bus updated successfully by operator ${operatorId}`);
            res.status(200).json({ success: true, message: 'Bus updated successfully', data: updatedBus });
        } catch (error) {
            appLogger.error(`Error updating bus: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to update bus", error: error.message });
        }
    }

    static async deleteBus(req, res) {
        try {
            const { busId } = req.params;
            const operatorId = req.user.id;
            
            await BusService.deleteBus(busId, operatorId);
            appLogger.info(`Bus deleted successfully by operator ${operatorId}`);
            res.status(200).json({ success: true, message: 'Bus deleted successfully',data: {} });
        } catch (error) {
            appLogger.error(`Error deleting bus: ${error.message}`);
            res.status(500).json({ success: false, message: "Failed to delete bus", error: error.message });
        }
    }
}

export default BusController;