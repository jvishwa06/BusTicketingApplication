const AdminService = require('../services/adminService');
const { UserRepo, AdminRepo, OperatorRepo } = require('../repositories/authRepository');
const tripRepository = require('../repositories/tripRepository');

jest.mock('../repositories/authRepository', () => ({
  UserRepo: {
    model: { find: jest.fn() },
    findById: jest.fn()
  },
  AdminRepo: {},
  OperatorRepo: {
    model: { find: jest.fn() },
    findById: jest.fn()
  }
}));

jest.mock('../repositories/tripRepository', () => ({
  findByIdAndOperator: jest.fn(),
  update: jest.fn()
}));

describe('AdminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      UserRepo.model.find.mockResolvedValue(mockUsers);

      const result = await AdminService.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(UserRepo.model.find).toHaveBeenCalled();
    });

    it('should throw error when fetching users fails', async () => {
      UserRepo.model.find.mockRejectedValue(new Error('DB error'));

      await expect(AdminService.getAllUsers()).rejects.toThrow('Error while fetching users');
    });
  });

  describe('toggleUserBlockStatus', () => {
    it('should block an unblocked user', async () => {
      const mockUser = { blocked: false, save: jest.fn().mockResolvedValue() };
      UserRepo.findById.mockResolvedValue(mockUser);

      const result = await AdminService.toggleUserBlockStatus('user123');
      expect(result).toBe('User blocked');
      expect(mockUser.blocked).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should unblock a blocked user', async () => {
      const mockUser = { blocked: true, save: jest.fn().mockResolvedValue() };
      UserRepo.findById.mockResolvedValue(mockUser);

      const result = await AdminService.toggleUserBlockStatus('user123');
      expect(result).toBe('User unblocked');
      expect(mockUser.blocked).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      UserRepo.findById.mockResolvedValue(null);

      await expect(AdminService.toggleUserBlockStatus('user123'))
        .rejects.toThrow('User not found');
    });
  });

  describe('getAllOperators', () => {
    it('should return all operators successfully', async () => {
      const mockOperators = [{ id: 1 }, { id: 2 }];
      OperatorRepo.model.find.mockResolvedValue(mockOperators);

      const result = await AdminService.getAllOperators();
      expect(result).toEqual(mockOperators);
      expect(OperatorRepo.model.find).toHaveBeenCalled();
    });

    it('should throw error when fetching operators fails', async () => {
      OperatorRepo.model.find.mockRejectedValue(new Error('DB error'));

      await expect(AdminService.getAllOperators()).rejects.toThrow('Error while fetching operators');
    });
  });

  describe('toggleOperatorBlockStatus', () => {
    it('should block an unblocked operator', async () => {
      const mockOperator = { blocked: false, save: jest.fn().mockResolvedValue() };
      OperatorRepo.findById.mockResolvedValue(mockOperator);

      const result = await AdminService.toggleOperatorBlockStatus('op123');
      expect(result).toBe('Operator blocked');
      expect(mockOperator.blocked).toBe(true);
      expect(mockOperator.save).toHaveBeenCalled();
    });

    it('should unblock a blocked operator', async () => {
      const mockOperator = { blocked: true, save: jest.fn().mockResolvedValue() };
      OperatorRepo.findById.mockResolvedValue(mockOperator);

      const result = await AdminService.toggleOperatorBlockStatus('op123');
      expect(result).toBe('Operator unblocked');
      expect(mockOperator.blocked).toBe(false);
      expect(mockOperator.save).toHaveBeenCalled();
    });

    it('should throw error when operator not found', async () => {
      OperatorRepo.findById.mockResolvedValue(null);

      await expect(AdminService.toggleOperatorBlockStatus('op123'))
        .rejects.toThrow('Operator not found');
    });
  });

  describe('getTripById', () => {
    it('should return trip successfully', async () => {
      const mockTrip = { id: 'trip123' };
      tripRepository.findByIdAndOperator.mockResolvedValue(mockTrip);

      const result = await AdminService.getTripById('trip123');
      expect(result).toEqual(mockTrip);
      expect(tripRepository.findByIdAndOperator).toHaveBeenCalledWith('trip123');
    });

    it('should throw error when trip not found', async () => {
      tripRepository.findByIdAndOperator.mockResolvedValue(null);

      await expect(AdminService.getTripById('trip123'))
        .rejects.toThrow('Trip not found');
    });
  });

  describe('cancelTrip', () => {
    it('should cancel trip successfully', async () => {
      const mockTrip = { id: 'trip123' };
      tripRepository.findByIdAndOperator.mockResolvedValue(mockTrip);
      tripRepository.update.mockResolvedValue();

      const result = await AdminService.cancelTrip('trip123');
      expect(result).toBe('Trip cancelled successfully');
      expect(tripRepository.update).toHaveBeenCalledWith('trip123', { status: 'cancelled' });
    });

    it('should throw error when trip not found', async () => {
      tripRepository.findByIdAndOperator.mockResolvedValue(null);

      await expect(AdminService.cancelTrip('trip123'))
        .rejects.toThrow('Trip not found');
    });
  });
});