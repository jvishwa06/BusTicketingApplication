import userRepository from '../../repositories/userRepository.js';
import User from '../../models/user.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../models/user.js');
jest.mock('../../utils/logger.js', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
      };
      
      const mockUser = { ...userData, _id: 'mockUserId' };
      User.create.mockResolvedValue(mockUser);
      
      // Act
      const result = await userRepository.createUser(userData);
      
      // Assert
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining(`User created in database`));
      expect(result).toEqual(mockUser);
    });

    it('should throw and log error when createUser fails', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const error = new Error('Database error');
      User.create.mockRejectedValue(error);
      
      // Act & Assert
      await expect(userRepository.createUser(userData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating user'));
    });
  });

  describe('getUserById', () => {
    it('should return a user when found by ID', async () => {
      // Arrange
      const userId = 'mockUserId';
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ select: selectMock });
      
      // Act
      const result = await userRepository.getUserById(userId);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null and log warning when user not found by ID', async () => {
      // Arrange
      const userId = 'nonExistentId';
      
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ select: selectMock });
      
      // Act
      const result = await userRepository.getUserById(userId);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`User not found in database`));
      expect(result).toBeNull();
    });

    it('should throw and log error when getUserById fails', async () => {
      const userId = 'mockUserId';
      const error = new Error('Database error');
      
      User.findById.mockImplementation(() => {
        throw error;
      });
      
      await expect(userRepository.getUserById(userId)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching user by ID'));
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user when found by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        _id: 'mockUserId',
        name: 'Test User',
        email
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      const result = await userRepository.getUserByEmail(email);
      
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null and log warning when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      User.findOne.mockResolvedValue(null);
      
      const result = await userRepository.getUserByEmail(email);
      
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`User not found in database`));
      expect(result).toBeNull();
    });

    it('should throw and log error when getUserByEmail fails', async () => {
      const email = 'test@example.com';
      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);
      
      await expect(userRepository.getUserByEmail(email)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching user by email'));
    });
  });

  describe('getUserByPhone', () => {
    it('should return a user when found by phone', async () => {
      const phone = '1234567890';
      const mockUser = {
        _id: 'mockUserId',
        name: 'Test User',
        email: 'test@example.com',
        phone
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      const result = await userRepository.getUserByPhone(phone);
      
      expect(User.findOne).toHaveBeenCalledWith({ phone });
      expect(result).toEqual(mockUser);
    });

    it('should return null and log warning when user not found by phone', async () => {
      const phone = '9999999999';
      User.findOne.mockResolvedValue(null);
      
      const result = await userRepository.getUserByPhone(phone);
      
      expect(User.findOne).toHaveBeenCalledWith({ phone });
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`User not found in database`));
      expect(result).toBeNull();
    });

    it('should throw and log error when getUserByPhone fails', async () => {
      const phone = '1234567890';
      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);
      
      await expect(userRepository.getUserByPhone(phone)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching user by phone'));
    });
  });

  describe('updateUserProfile', () => {
    it('should update and return a user when found by ID', async () => {
      const userId = 'mockUserId';
      const updateData = {
        name: 'Updated Name',
        phone: '9876543210'
      };
      const mockUpdatedUser = {
        _id: userId,
        name: 'Updated Name',
        email: 'test@example.com',
        phone: '9876543210'
      };
      
      const selectMock = jest.fn().mockResolvedValue(mockUpdatedUser);
      User.findByIdAndUpdate.mockReturnValue({ select: selectMock });
      
      const result = await userRepository.updateUserProfile(userId, updateData);
      
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(appLogger.info).toHaveBeenCalledWith(expect.stringContaining('User profile updated in database'));
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should return null and log warning when user not found for update', async () => {
      const userId = 'nonExistentId';
      const updateData = {
        name: 'Updated Name'
      };
      
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findByIdAndUpdate.mockReturnValue({ select: selectMock });
      
      const result = await userRepository.updateUserProfile(userId, updateData);
      
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, { new: true });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(appLogger.warn).toHaveBeenCalledWith(expect.stringContaining('User profile update failed'));
      expect(result).toBeNull();
    });

    it('should throw and log error when updateUserProfile fails', async () => {
      const userId = 'mockUserId';
      const updateData = {
        name: 'Updated Name'
      };
      const error = new Error('Database error');
      
      User.findByIdAndUpdate.mockImplementation(() => {
        throw error;
      });
      
      await expect(userRepository.updateUserProfile(userId, updateData)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error updating user profile'));
    });
  });
});
