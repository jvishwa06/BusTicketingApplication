jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    silent: false,
  };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      colorize: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
    },
    transports: {
      File: jest.fn(),
      Console: jest.fn(),
    },
  };
});

const AuthService = require('../services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepo = require('../repositories/authRepository').UserRepo;
const AdminRepo = require('../repositories/authRepository').AdminRepo;
const OperatorRepo = require('../repositories/authRepository').OperatorRepo;
const OTP = require('../models/otp');
const appLogger = require('../utils/appLogger');
const { generateAndSendOtp } = require('../utils/otpService');
const { sendAdminApprovalEmail } = require('../utils/approvalService');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../repositories/authRepository', () => ({
  UserRepo: { findByEmail: jest.fn(), save: jest.fn() },
  AdminRepo: { findByEmail: jest.fn(), save: jest.fn() },
  OperatorRepo: { findByEmail: jest.fn(), save: jest.fn(), findById: jest.fn() },
}));
jest.mock('../models/otp');
jest.mock('../utils/appLogger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../utils/otpService');
jest.mock('../utils/approvalService');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      const email = 'user@example.com';
      UserRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPw');
      UserRepo.save.mockResolvedValue({ _id: 'u1', email, verified: false }); // Fixed _id to 'u1'
      generateAndSendOtp.mockResolvedValue();

      const result = await AuthService.registerUser(email, 'password', 'User');

      expect(UserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ email, verified: false }));
      expect(generateAndSendOtp).toHaveBeenCalledWith('u1', email, 'verification');
      expect(appLogger.info).toHaveBeenCalledWith(expect.objectContaining({ message: 'User successfully registered' }));
      expect(result._id).toBe('u1');
    });

    it('should throw error if email already registered', async () => {
      UserRepo.findByEmail.mockResolvedValue({ _id: 'u1' });

      await expect(AuthService.registerUser('user@example.com', 'password', 'User')).rejects.toThrow('Email already registered');
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      const email = 'user@example.com';
      UserRepo.findByEmail.mockResolvedValue({ _id: 'u1', passwordHash: 'hashedPw', verified: true });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');

      const result = await AuthService.loginUser(email, 'password');

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPw');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'u1' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(appLogger.info).toHaveBeenCalledWith(expect.objectContaining({ message: 'User login successful' }));
      expect(result).toBe('token');
    });

    it('should throw error if credentials invalid', async () => {
      UserRepo.findByEmail.mockResolvedValue({ _id: 'u1', passwordHash: 'hashedPw', verified: true });
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.loginUser('user@example.com', 'password')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('registerOperator', () => {
    it('should register an operator successfully', async () => {
      const email = 'op@example.com';
      OperatorRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPw');
      OperatorRepo.save.mockResolvedValue({ _id: 'op1', email, status: 'pending' }); // Fixed _id to 'op1'
      generateAndSendOtp.mockResolvedValue();
      sendAdminApprovalEmail.mockResolvedValue();

      const result = await AuthService.registerOperator(email, '1234567890', 'password', 'Company');

      expect(OperatorRepo.save).toHaveBeenCalledWith(expect.objectContaining({ email, status: 'pending' }));
      expect(generateAndSendOtp).toHaveBeenCalledWith('op1', email, 'verification');
      expect(sendAdminApprovalEmail).toHaveBeenCalledWith('op1', 'Company');
      expect(result._id).toBe('op1');
    });
  });

  describe('approveOperator', () => {
    it('should approve an operator', async () => {
      const operatorId = 'op1';
      OperatorRepo.findById.mockResolvedValue({ _id: operatorId, status: 'pending', save: jest.fn() });
      OperatorRepo.save.mockResolvedValue({ _id: operatorId, status: 'approved' });

      const result = await AuthService.approveOperator(operatorId);

      expect(OperatorRepo.save).toHaveBeenCalled();
      expect(appLogger.info).toHaveBeenCalledWith(expect.objectContaining({ message: 'Operator approved successfully' }));
      expect(result.status).toBe('approved');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const email = 'user@example.com';
      UserRepo.findByEmail.mockResolvedValue({ _id: 'u1', verified: false, save: jest.fn() });
      OTP.findOne.mockResolvedValue({ userId: 'u1', otp: '123456', expiresAt: Date.now() + 1000 });
      OTP.deleteOne.mockResolvedValue();

      const result = await AuthService.verifyEmail(email, '123456', 'user');

      expect(UserRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(OTP.deleteOne).toHaveBeenCalledWith({ userId: 'u1' });
      expect(appLogger.info).toHaveBeenCalledWith(expect.objectContaining({ message: 'user email verified successfully' }));
      expect(result.message).toBe('user email verified successfully');
    });

    it('should throw error for invalid OTP', async () => {
      UserRepo.findByEmail.mockResolvedValue({ _id: 'u1' });
      OTP.findOne.mockResolvedValue(null);

      await expect(AuthService.verifyEmail('user@example.com', '123456', 'user')).rejects.toThrow('Invalid or expired OTP');
    });
  });
});