import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserService from '../services/userService.js';
import userRepository from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../repositories/userRepository.js');
jest.mock('../utils/logger.js');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      const userData = { ...validUserData };
      const originalPassword = userData.password;
      userRepository.getUserByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        _id: 'user123',
        ...userData,
        password: 'hashedPassword'
      });
      
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const result = await UserService.register(userData);

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 10);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword'
      });
      expect(logger.info).toHaveBeenCalledWith(`User registered successfully: ${userData.email}`);
      expect(result).toEqual({
        _id: 'user123',
        ...userData,
        password: 'hashedPassword'
      });
    });

    it('should throw an error if role is invalid', async () => {
      const invalidUserData = { ...validUserData, role: 'superadmin' };

      await expect(UserService.register(invalidUserData)).rejects.toThrow('Invalid role specified');
      expect(logger.warn).toHaveBeenCalledWith(`Invalid role specified: ${invalidUserData.role}`);
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw an error if user already exists', async () => {
      userRepository.getUserByEmail.mockResolvedValue({ email: validUserData.email });

      await expect(UserService.register({ ...validUserData })).rejects.toThrow('User already exists');
      expect(logger.warn).toHaveBeenCalledWith(`User with email ${validUserData.email} already exists`);
      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      userRepository.getUserByEmail.mockRejectedValue(error);

      await expect(UserService.register({ ...validUserData })).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith(`Error registering user: ${error.message}`);
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      _id: 'user123',
      email: credentials.email,
      password: 'hashedPassword',
      role: 'user',
      name: 'Test User'
    };

    it('should login a user successfully', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test-token');

      process.env.JWT_SECRET = 'test-secret';

      const result = await UserService.login({ ...credentials });

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, role: mockUser.role },
        'test-secret',
        { expiresIn: '1d' }
      );
      expect(logger.info).toHaveBeenCalledWith(`User logged in successfully: ${mockUser.email}`);
      expect(result).toEqual({
        token: 'test-token',
        user: mockUser
      });
    });

    it('should throw an error if user not found', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      await expect(UserService.login({ ...credentials })).rejects.toThrow('Invalid credentials');
      expect(logger.warn).toHaveBeenCalledWith(`Failed login attempt for email: ${credentials.email}`);
    });

    it('should throw an error if password does not match', async () => {
      userRepository.getUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(UserService.login({ ...credentials })).rejects.toThrow('Invalid credentials');
      expect(logger.warn).toHaveBeenCalledWith(`Failed login attempt for email: ${credentials.email}`);
    });

    it('should handle and log login errors', async () => {
      const error = new Error('Authentication error');
      userRepository.getUserByEmail.mockRejectedValue(error);

      await expect(UserService.login({ ...credentials })).rejects.toThrow('Authentication error');
      expect(logger.error).toHaveBeenCalledWith(`Error logging in user with email ${credentials.email}: ${error.message}`);
    });
  });

  describe('getProfile', () => {
    const userId = 'user123';
    const mockUser = {
      _id: userId,
      email: 'test@example.com',
      role: 'user',
      name: 'Test User'
    };

    it('should retrieve a user profile successfully', async () => {
      userRepository.getUserById.mockResolvedValue(mockUser);

      const result = await UserService.getProfile(userId);

      expect(userRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(logger.info).toHaveBeenCalledWith(`User profile retrieved: ${mockUser.email}`);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      userRepository.getUserById.mockResolvedValue(null);

      await expect(UserService.getProfile(userId)).rejects.toThrow('User not found');
      expect(logger.warn).toHaveBeenCalledWith(`Profile not found for user ID: ${userId}`);
    });

    it('should handle and log profile retrieval errors', async () => {
      const error = new Error('Database error');
      userRepository.getUserById.mockRejectedValue(error);

      await expect(UserService.getProfile(userId)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith(`Error fetching profile for user ID ${userId}: ${error.message}`);
    });
  });

  describe('updateProfile', () => {
    const userId = 'user123';
    const updateData = {
      name: 'Updated Name',
      bio: 'New bio information'
    };
    const mockUser = {
      _id: userId,
      email: 'test@example.com',
      role: 'user',
      name: 'Updated Name',
      bio: 'New bio information'
    };

    it('should update a user profile successfully', async () => {
      userRepository.updateUserProfile.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile(userId, updateData);

      expect(userRepository.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
      expect(logger.info).toHaveBeenCalledWith(`User profile updated: ${mockUser.email}`);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found during update', async () => {
      userRepository.updateUserProfile.mockResolvedValue(null);

      await expect(UserService.updateProfile(userId, updateData)).rejects.toThrow('User not found');
      expect(logger.warn).toHaveBeenCalledWith(`Profile update failed, user not found: ${userId}`);
    });

    it('should handle and log profile update errors', async () => {
      const error = new Error('Database error');
      userRepository.updateUserProfile.mockRejectedValue(error);

      await expect(UserService.updateProfile(userId, updateData)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith(`Error updating profile for user ID ${userId}: ${error.message}`);
    });
  });
});