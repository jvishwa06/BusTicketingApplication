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

    async getBus(operatorId) {
        try {
            const buses = await BusRepository.getBus(operatorId);
            appLogger.info(`Fetched buses for operator ${operatorId} successfully`);
            return buses;
        } catch (error) {
            appLogger.error(`Error fetching buses for operator ${operatorId}: ${error.message}`);
            throw error;
        }
    }

    async updateBus(busId, busData, operatorId) {
        try {
            const bus = await BusRepository.getBusById(busId);
            if (!bus) {
                appLogger.warn(`Bus with ID ${busId} not found`);
                throw new Error('Bus not found');
            }
            
            if (bus.operatorId.toString() !== operatorId.toString()) {
                appLogger.warn(`Operator ${operatorId} attempted to update bus ${busId} which they don't own`);
                throw new Error('Unauthorized: You can only update your own buses');
            }
            
            const allowedUpdates = ['name', 'totalSeats', 'type', 'amenities'];
            const filteredUpdateData = {};
            
            Object.keys(busData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    filteredUpdateData[key] = busData[key];
                }
            });
            
            const attemptedFields = Object.keys(busData).filter(key => !allowedUpdates.includes(key));
            if (attemptedFields.length > 0) {
                appLogger.warn(`Operator ${operatorId} attempted to update restricted fields: ${attemptedFields.join(', ')}`);
                throw new Error(`Only name, totalSeats, type, and amenities can be updated. Cannot update: ${attemptedFields.join(', ')}`);
            }
            
            const updatedBus = await BusRepository.updateBus(busId, filteredUpdateData);
            appLogger.info(`Bus with ID ${busId} updated successfully by operator ${operatorId}`);
            return updatedBus;
        } catch (error) {
            appLogger.error(`Error updating bus with ID ${busId}: ${error.message}`);
            throw error;
        }
    }

    async deleteBus(busId, operatorId) {
        try {
            const bus = await BusRepository.getBusById(busId);
            if (!bus) {
                appLogger.warn(`Bus with ID ${busId} not found`);
                throw new Error('Bus not found');
            }
            
            if (bus.operatorId.toString() !== operatorId.toString()) {
                appLogger.warn(`Operator ${operatorId} attempted to delete bus ${busId} which they don't own`);
                throw new Error('Unauthorized: You can only delete your own buses');
            }
            
            const deletedBus = await BusRepository.deleteBus(busId);
            appLogger.info(`Bus with ID ${busId} deleted successfully by operator ${operatorId}`);
            return deletedBus;
        } catch (error) {
            appLogger.error(`Error deleting bus with ID ${busId}: ${error.message}`);
            throw error;
        }
    }
}

export default new BusService();