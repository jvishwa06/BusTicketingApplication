import busRepository from '../../repositories/busRepository.js';
import Bus from '../../models/bus.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../models/bus.js');
jest.mock('../../utils/logger.js', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('BusRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBus', () => {
    it('should create a bus successfully', async () => {
      const busData = {
        regNumber: 'KA01AB1234',
        type: 'Sleeper',
        capacity: 40,
        operatorId: 'operatorId123'
      };
      
      const mockBus = { ...busData, _id: 'mockBusId' };
      Bus.create.mockResolvedValue(mockBus);
      
      const result = await busRepository.createBus(busData);
      
      expect(Bus.create).toHaveBeenCalledWith(busData);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Bus created in DB`));
      expect(result).toEqual(mockBus);
    });

    it('should throw and log error when createBus fails', async () => {
      const busData = {
        regNumber: 'KA01AB1234',
        type: 'Sleeper'
      };
      
      const error = new Error('Database error');
      Bus.create.mockRejectedValue(error);
      
      await expect(busRepository.createBus(busData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating bus in DB'));
    });
  });

  describe('getBusById', () => {
    it('should return a bus when found by ID', async () => {
      const busId = 'mockBusId';
      const mockBus = {
        _id: busId,
        regNumber: 'KA01AB1234',
        type: 'Sleeper'
      };
      
      Bus.findById.mockResolvedValue(mockBus);
      
      const result = await busRepository.getBusById(busId);
      
      expect(Bus.findById).toHaveBeenCalledWith(busId);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Bus retrieved from DB`));
      expect(result).toEqual(mockBus);
    });

    it('should return null and log warning when bus not found by ID', async () => {
      const busId = 'nonExistentId';
      
      Bus.findById.mockResolvedValue(null);
      
      const result = await busRepository.getBusById(busId);
      
      expect(Bus.findById).toHaveBeenCalledWith(busId);
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Bus not found with ID`));
      expect(result).toBeNull();
    });

    it('should throw and log error when getBusById fails', async () => {
      const busId = 'mockBusId';
      const error = new Error('Database error');
      Bus.findById.mockRejectedValue(error);
      
      await expect(busRepository.getBusById(busId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error retrieving bus by ID ${busId}`));
    });
  });

  describe('getBus', () => {
    it('should return buses for a specific operator', async () => {
      const operatorId = 'operatorId123';
      const mockBuses = [
        { _id: 'bus1', regNumber: 'KA01AB1234', operatorId },
        { _id: 'bus2', regNumber: 'KA01AB5678', operatorId }
      ];
      
      Bus.find.mockResolvedValue(mockBuses);
      
      const result = await busRepository.getBus(operatorId);
      
      expect(Bus.find).toHaveBeenCalledWith({ operatorId });
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Retrieved buses for operator`));
      expect(result).toEqual(mockBuses);
    });

    it('should throw and log error when getBus fails', async () => {
      const operatorId = 'operatorId123';
      const error = new Error('Database error');
      Bus.find.mockRejectedValue(error);
      
      await expect(busRepository.getBus(operatorId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error retrieving buses for operator ${operatorId}`));
    });
  });

  describe('updateBus', () => {
    it('should update a bus successfully', async () => {
      const busId = 'mockBusId';
      const updateData = {
        type: 'Semi-Sleeper',
        capacity: 45
      };
      
      const mockBus = { 
        _id: busId,
        regNumber: 'KA01AB1234',
        ...updateData
      };
      
      Bus.findByIdAndUpdate.mockResolvedValue(mockBus);
      
      const result = await busRepository.updateBus(busId, updateData);
      
      expect(Bus.findByIdAndUpdate).toHaveBeenCalledWith(busId, updateData, { new: true });
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Bus updated in DB`));
      expect(result).toEqual(mockBus);
    });

    it('should return null and log warning when bus not found for update', async () => {
      const busId = 'nonExistentId';
      const updateData = { type: 'Deluxe' };
      
      Bus.findByIdAndUpdate.mockResolvedValue(null);
      
      const result = await busRepository.updateBus(busId, updateData);
      
      expect(Bus.findByIdAndUpdate).toHaveBeenCalledWith(busId, updateData, { new: true });
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Bus not found for update`));
      expect(result).toBeNull();
    });

    it('should throw and log error when updateBus fails', async () => {
      const busId = 'mockBusId';
      const updateData = { type: 'Deluxe' };
      const error = new Error('Database error');
      
      Bus.findByIdAndUpdate.mockRejectedValue(error);
      
      await expect(busRepository.updateBus(busId, updateData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error updating bus ${busId}`));
    });
  });

  describe('deleteBus', () => {
    it('should delete a bus successfully', async () => {
      const busId = 'mockBusId';
      const mockBus = { 
        _id: busId,
        regNumber: 'KA01AB1234',
        type: 'Sleeper'
      };
      
      Bus.findByIdAndDelete.mockResolvedValue(mockBus);
      
      const result = await busRepository.deleteBus(busId);
      
      expect(Bus.findByIdAndDelete).toHaveBeenCalledWith(busId);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Bus deleted from DB`));
      expect(result).toEqual(mockBus);
    });

    it('should return null and log warning when bus not found for deletion', async () => {
      const busId = 'nonExistentId';
      
      Bus.findByIdAndDelete.mockResolvedValue(null);
      
      const result = await busRepository.deleteBus(busId);
      
      expect(Bus.findByIdAndDelete).toHaveBeenCalledWith(busId);
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Bus not found for deletion`));
      expect(result).toBeNull();
    });

    it('should throw and log error when deleteBus fails', async () => {
      const busId = 'mockBusId';
      const error = new Error('Database error');
      
      Bus.findByIdAndDelete.mockRejectedValue(error);
      
      await expect(busRepository.deleteBus(busId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining(`Error deleting bus ${busId}`));
    });
  });
});
