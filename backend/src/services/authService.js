const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/admin');
const Operator = require('../models/operator');
const OTP = require('../models/otp');
const appLogger = require('../utils/appLogger');
const { UserRepo, AdminRepo, OperatorRepo } = require('../repositories/authRepository');
const { generateAndSendOtp } = require('../utils/otpService');
const { sendAdminApprovalEmail } = require('../utils/approvalService');

class AuthService {
  // User Registration
  static async registerUser(email, password, name) {
    try {
      const existingUser = await UserRepo.findByEmail(email);
      if (existingUser) {
        appLogger.warn({ message: 'Registration attempt with existing email', email });
        throw new Error('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = new User({
        email,
        passwordHash,
        name,
        verified: false,
      });
      
      const savedUser = await UserRepo.save(user);
      await generateAndSendOtp(savedUser._id, email, 'verification');
      appLogger.info({
        message: 'User successfully registered',
        email,
        userId: savedUser._id,
        action: 'register_user',
      });
      return savedUser;
      
    } catch (error) {
      appLogger.error({
        message: 'User registration failed',
        email,
        error: error.message,
        stack: error.stack,
        action: 'register_user',
      });
      throw error;
    }
  }

  // User Login
  static async loginUser(email, password) {
    try {
      const user = await UserRepo.findByEmail(email);
      if (!user) {
        appLogger.warn({ message: 'Login attempt with non-existent email', email });
        throw new Error('Invalid credentials or email not verified');
      }
      if (!user.verified) {
        appLogger.warn({ message: 'Login attempt with unverified email', email });
        throw new Error('Invalid credentials or email not verified');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        appLogger.warn({ message: 'Login failed: incorrect password', email });
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      appLogger.info({
        message: 'User login successful',
        email,
        userId: user._id,
        action: 'login_user',
      });
      
      return token;
    } catch (error) {
      appLogger.error({
        message: 'User login failed',
        email,
        error: error.message,
        stack: error.stack,
        action: 'login_user',
      });
      throw error;
    }
  }

  // Admin Registration
  static async registerAdmin(email, password, name) {
    try {
      const existingAdmin = await AdminRepo.findByEmail(email);
      if (existingAdmin) {
        appLogger.warn({ message: 'Admin registration attempt with existing email', email });
        throw new Error('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const admin = new Admin({
        email,
        passwordHash,
        name,
        verified: false,
      });

      await AdminRepo.save(admin);
      await generateAndSendOtp(admin._id, email, 'verification');
      
      appLogger.info({
        message: 'Admin successfully registered',
        email,
        adminId: admin._id,
        action: 'register_admin',
      });
      
      return admin;
    } catch (error) {
      appLogger.error({
        message: 'Admin registration failed',
        email,
        error: error.message,
        stack: error.stack,
        action: 'register_admin',
      });
      throw error;
    }
  }

  // Admin Login
  static async loginAdmin(email, password) {
    try {
      const admin = await AdminRepo.findByEmail(email);
      if (!admin || !admin.verified) {
        appLogger.warn({ 
          message: 'Admin login attempt failed', 
          email, 
          reason: !admin ? 'admin not found' : 'email not verified' 
        });
        throw new Error('Invalid credentials or email not verified');
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        appLogger.warn({ message: 'Admin login failed: incorrect password', email });
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      appLogger.info({
        message: 'Admin login successful',
        email,
        adminId: admin._id,
        action: 'login_admin',
      });
      
      return token;
    } catch (error) {
      appLogger.error({
        message: 'Admin login failed',
        email,
        error: error.message,
        stack: error.stack,
        action: 'login_admin',
      });
      throw error;
    }
  }

  // Operator Registration
  static async registerOperator(email, contactPhone, password, companyName) {
    try {
      const existingOperator = await OperatorRepo.findByEmail(email);
      if (existingOperator) {
        appLogger.warn({ message: 'Operator registration attempt with existing email', email });
        throw new Error('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const operator = new Operator({
        email,
        contactPhone,
        passwordHash,
        companyName,
        isEmailVerified: false,
        status: 'pending',
      });
      
      const savedOperator = await OperatorRepo.save(operator);
      await generateAndSendOtp(savedOperator._id, email, 'verification');
      await sendAdminApprovalEmail(savedOperator._id, companyName);
      appLogger.info({
        message: 'Operator successfully registered',
        email,
        operatorId: savedOperator._id,
        companyName,
        action: 'register_operator',
      });
      return savedOperator;      
    } catch (error) {
      appLogger.error({
        message: 'Operator registration failed',
        email,
        companyName,
        error: error.message,
        stack: error.stack,
        action: 'register_operator',
      });
      throw error;
    }
  }

  // Operator Login
  static async loginOperator(email, password) {
    try {
      const operator = await OperatorRepo.findByEmail(email);
      if (!operator) {
        appLogger.warn({ message: 'Operator login attempt with non-existent email', email });
        throw new Error('Operator not found');
      }

      if (!operator.isEmailVerified) {
        appLogger.warn({ message: 'Operator login failed: email not verified', email });
        throw new Error('Please verify your email before logging in.');
      }

      if (operator.status !== 'approved') {
        appLogger.warn({ 
          message: 'Operator login failed: account not approved', 
          email, 
          status: operator.status 
        });
        throw new Error('Your account has not been approved by the admin yet.');
      }

      const isMatch = await bcrypt.compare(password, operator.passwordHash);
      if (!isMatch) {
        appLogger.warn({ message: 'Operator login failed: incorrect password', email });
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign({ operatorId: operator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      appLogger.info({
        message: 'Operator login successful',
        email,
        operatorId: operator._id,
        action: 'login_operator',
      });
      
      return token;
    } catch (error) {
      appLogger.error({
        message: 'Operator login failed',
        email,
        error: error.message,
        stack: error.stack,
        action: 'login_operator',
      });
      throw error;
    }
  }

  // Admin Approval for Operator
  static async approveOperator(operatorId) {
    try {
      const operator = await OperatorRepo.findById(operatorId);
      if (!operator) {
        appLogger.warn({ message: 'Operator approval failed: operator not found', operatorId });
        throw new Error('Operator not found');
      }

      operator.status = 'approved';
      await OperatorRepo.save(operator);
      
      appLogger.info({
        message: 'Operator approved successfully',
        operatorId,
        email: operator.email,
        action: 'approve_operator',
      });
      
      return operator;
    } catch (error) {
      appLogger.error({
        message: 'Operator approval failed',
        operatorId,
        error: error.message,
        stack: error.stack,
        action: 'approve_operator',
      });
      throw error;
    }
  }

  // Admin Rejection for Operator
  static async rejectOperator(operatorId) {
    try {
      const operator = await OperatorRepo.findById(operatorId);
      if (!operator) {
        appLogger.warn({ message: 'Operator rejection failed: operator not found', operatorId });
        throw new Error('Operator not found');
      }

      operator.status = 'rejected';
      await OperatorRepo.save(operator);
      
      appLogger.info({
        message: 'Operator rejected successfully',
        operatorId,
        email: operator.email,
        action: 'reject_operator',
      });
      
      return operator;
    } catch (error) {
      appLogger.error({
        message: 'Operator rejection failed',
        operatorId,
        error: error.message,
        stack: error.stack,
        action: 'reject_operator',
      });
      throw error;
    }
  }

  // Forgot Password
  static async forgotPassword(email, type = 'user') {
    try {
      let entity;
      if (type === 'user') entity = await UserRepo.findByEmail(email);
      else if (type === 'admin') entity = await AdminRepo.findByEmail(email);
      else if (type === 'operator') entity = await OperatorRepo.findByEmail(email);

      if (!entity) {
        appLogger.warn({ 
          message: `${type} password reset attempt failed: not found`, 
          email, 
          type 
        });
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
      }

      await generateAndSendOtp(entity._id, email, 'reset');
      
      appLogger.info({
        message: `${type} password reset OTP sent`,
        email,
        entityId: entity._id,
        type,
        action: 'forgot_password',
      });
    } catch (error) {
      appLogger.error({
        message: `${type} password reset failed`,
        email,
        type,
        error: error.message,
        stack: error.stack,
        action: 'forgot_password',
      });
      throw error;
    }
  }

  // Reset Password
  static async resetPassword(email, otp, newPassword, type = 'user') {
    try {
      let entity;
      if (type === 'user') entity = await UserRepo.findByEmail(email);
      else if (type === 'admin') entity = await AdminRepo.findByEmail(email);
      else if (type === 'operator') entity = await OperatorRepo.findByEmail(email);

      if (!entity) {
        appLogger.warn({ 
          message: `${type} password reset failed: not found`, 
          email, 
          type 
        });
        throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} not found`);
      }

      const otpRecord = await OTP.findOne({ userId: entity._id, otp });
      if (!otpRecord || otpRecord.expiresAt < Date.now()) {
        appLogger.warn({ 
          message: `${type} password reset failed: invalid/expired OTP`, 
          email, 
          type 
        });
        throw new Error('Invalid or expired OTP');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      entity.passwordHash = hashedPassword;
      await entity.save();
      await OTP.deleteOne({ userId: entity._id });
      
      appLogger.info({
        message: `${type} password reset successful`,
        email,
        entityId: entity._id,
        type,
        action: 'reset_password',
      });
    } catch (error) {
      appLogger.error({
        message: `${type} password reset failed`,
        email,
        type,
        error: error.message,
        stack: error.stack,
        action: 'reset_password',
      });
      throw error;
    }
  }

  // Email Verification
  static async verifyEmail(email, otp, type = 'user') {
    try {
      let entity;
      if (type === 'user') entity = await UserRepo.findByEmail(email);
      else if (type === 'admin') entity = await AdminRepo.findByEmail(email);
      else if (type === 'operator') entity = await OperatorRepo.findByEmail(email);

      if (!entity) {
        appLogger.warn({ 
          message: `${type} email verification failed: not found`, 
          email, 
          type 
        });
        throw new Error(`${type} not found`);
      }

      const otpRecord = await OTP.findOne({ userId: entity._id, otp });
      if (!otpRecord || otpRecord.expiresAt < Date.now()) {
        appLogger.warn({ 
          message: `${type} email verification failed: invalid/expired OTP`, 
          email, 
          type 
        });
        throw new Error('Invalid or expired OTP');
      }

      if (type === 'operator') entity.isEmailVerified = true;
      else entity.verified = true;

      await entity.save();
      await OTP.deleteOne({ userId: entity._id });
      
      appLogger.info({
        message: `${type} email verified successfully`,
        email,
        entityId: entity._id,
        type,
        action: 'verify_email',
      });
      
      return { message: `${type} email verified successfully` };
    } catch (error) {
      appLogger.error({
        message: `${type} email verification failed`,
        email,
        type,
        error: error.message,
        stack: error.stack,
        action: 'verify_email',
      });
      throw error;
    }
  }
}

module.exports = AuthService;