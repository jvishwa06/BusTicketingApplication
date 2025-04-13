import BusRepository from '../repositories/busRepository.js';
import { appLogger } from '../utils/logger.js';

class BusService {
    async createBus(operatorId, busData) {
        try {
            const bus = await BusRepository.createBus({ ...busData, operatorId });
            appLogger.info(`Bus created successfully for operator ${operatorId}`);
            return bus;
        } catch (error) {
            appLogger.error(`Error creating bus for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

    async getBuses() {
        try {
            const buses = await BusRepository.getAllBuses();
            appLogger.info("Fetched all buses successfully");
            return buses;
        } catch (error) {
            appLogger.error(`Error fetching buses: ${error.message}`);
            throw error;
        }
    }

    async updateBus(busId, busData) {
        try {
            const updatedBus = await BusRepository.updateBus(busId, busData);
            if (!updatedBus) {
                appLogger.warn(`Bus with ID ${busId} not found`);
                throw new Error('Bus not found');
            }
            appLogger.info(`Bus with ID ${busId} updated successfully`);
            return updatedBus;
        } catch (error) {
            appLogger.error(`Error updating bus with ID ${busId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBus(busId) {
        try {
            const deletedBus = await BusRepository.deleteBus(busId);
            if (!deletedBus) {
                appLogger.warn(`Bus with ID ${busId} not found`);
                throw new Error('Bus not found');
            }
            appLogger.info(`Bus with ID ${busId} deleted successfully`);
            return deletedBus;
        } catch (error) {
            appLogger.error(`Error deleting bus with ID ${busId}: ${error.message}`);
            throw error;
        }
    }
}

export default new BusService();