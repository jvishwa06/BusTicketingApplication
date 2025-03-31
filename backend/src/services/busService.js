import BusRepository from '../repositories/busRepository.js';
import { logger } from '../utils/logger.js';

class BusService {
    async createBus(operatorId, busData) {
        try {
            const bus = await BusRepository.createBus({ ...busData, operatorId });
            logger.info(`Bus created successfully for operator ${operatorId}`);
            return bus;
        } catch (error) {
            logger.error(`Error creating bus for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

    async getBuses() {
        try {
            const buses = await BusRepository.getAllBuses();
            logger.info("Fetched all buses successfully");
            return buses;
        } catch (error) {
            logger.error(`Error fetching buses: ${error.message}`);
            throw error;
        }
    }
}

export default new BusService();