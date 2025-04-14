import Bus from '../models/bus.js';
import { appLogger } from '../utils/logger.js';

class BusRepository {
    async createBus(busData) {
        try {
            const bus = await Bus.create(busData);
            appLogger.info(`Bus created in DB: ${bus._id}`);
            return bus;
        } catch (error) {
            appLogger.error(`Error creating bus in DB: ${error.message}`);
            throw error;
        }
    }

    async getAllBuses() {
        try {
            const buses = await Bus.find();
            appLogger.info("Retrieved all buses from DB");
            return buses;
        } catch (error) {
            appLogger.error(`Error retrieving buses from DB: ${error.message}`);
            throw error;
        }
    }

    async getBusById(busId) {
        try {
            const bus = await Bus.findById(busId);
            if (!bus) {
                appLogger.warn(`Bus not found with ID: ${busId}`);
            } else {
                appLogger.info(`Bus retrieved from DB: ${busId}`);
            }
            return bus;
        } catch (error) {
            appLogger.error(`Error retrieving bus by ID ${busId}: ${error.message}`);
            throw error;
        }
    }

    async updateBus(busId, updateData) {
        try {
            const bus = await Bus.findByIdAndUpdate(busId, updateData, { new: true });
            if (!bus) {
                appLogger.warn(`Bus not found for update: ${busId}`);
            } else {
                appLogger.info(`Bus updated in DB: ${busId}`);
            }
            return bus;
        } catch (error) {
            appLogger.error(`Error updating bus ${busId}: ${error.message}`);
            throw error;
        }
    }

    async getBusesByOperator(operatorId) {
        try {
            const buses = await Bus.find({ operatorId });
            appLogger.info(`Retrieved buses for operator: ${operatorId}`);
            return buses;
        } catch (error) {
            appLogger.error(`Error retrieving buses for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBus(busId) {
        try {
            const bus = await Bus.findByIdAndDelete(busId);
            if (!bus) {
                appLogger.warn(`Bus not found for deletion: ${busId}`);
            } else {
                appLogger.info(`Bus deleted from DB: ${busId}`);
            }
            return bus;
        } catch (error) {
            appLogger.error(`Error deleting bus ${busId}: ${error.message}`);
            throw error;
        }
    }
}

export default new BusRepository();