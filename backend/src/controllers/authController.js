import AuthService from '../services/authService.js';
import appLogger from '../utils/appLogger.js';

class AuthController {
  // User Registration
  static async registerUser(req, res) {
    try {
      const { email, password, name } = req.body;
      const user = await AuthService.registerUser(email, password, name);
      
      appLogger.info({message: 'User registration request processed successfully',email,userId: user._id,action: 'register_user',requestId: req.id, });
      res.status(201).json({ message: 'User registered successfully! Please check your email to verify your account.' });

    } catch (err) {
      appLogger.error({
        message: 'User registration request failed',
        email: req.body.email,
        error: err.message,
        stack: err.stack,
        action: 'register_user',requestId: req.id,});
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }

  // User Login
  static async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const token = await AuthService.loginUser(email, password);
      
      appLogger.info({message: 'User login request processed successfully',email,action: 'login_user',requestId: req.id,});
      
      res.json({ token });
    } catch (err) {
      appLogger.error({message: 'User login request failed',email: req.body.email,error: err.message,stack: err.stack,action: 'login_user',requestId: req.id,});
      res.status(400).json({ message: 'Login failed', error: err.message });
    }
  }

  // Admin Registration
  static async registerAdmin(req, res) {
    try {
      const { email, password, name } = req.body;
      const admin = await AuthService.registerAdmin(email, password, name);
      
      appLogger.info({message: 'Admin registration request processed successfully',
        email,
        adminId: admin._id,
        action: 'register_admin',
        requestId: req.id,});
      
      res.status(201).json({ message: 'Admin registered successfully! Please check your email to verify your account.' });
    } catch (err) {
      appLogger.error({message: 'Admin registration request failed',email: req.body.email,error: err.message,stack: err.stack,action: 'register_admin',requestId: req.id,});
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }

  // Admin Login
  static async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      const token = await AuthService.loginAdmin(email, password);
      
      appLogger.info({
        message: 'Admin login request processed successfully',email,action: 'login_admin',requestId: req.id,});
      
      res.json({ token });
    } catch (err) {
      appLogger.error({message: 'Admin login request failed',email: req.body.email,error: err.message,stack: err.stack,action: 'login_admin',requestId: req.id,});
      res.status(400).json({ message: 'Login failed', error: err.message });
    }
  }

  // Operator Registration
  static async registerOperator(req, res) {
    try {
      const { email, contactPhone, password, companyName } = req.body;
      const operator = await AuthService.registerOperator(email, contactPhone, password, companyName);
      
      appLogger.info({
        message: 'Operator registration request processed successfully',email,operatorId: operator._id,companyName,action: 'register_operator',requestId: req.id,});
      
      res.status(201).json({ 
        message: 'Operator registered successfully! Please check your email to verify your account.' 
      });
    } catch (err) {
      appLogger.error({
        message: 'Operator registration request failed',email: req.body.email,companyName: req.body.companyName,error: err.message,stack: err.stack,action: 'register_operator',requestId: req.id,});
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }

  // Operator Login
  static async loginOperator(req, res) {
    try {
      const { email, password } = req.body;
      const token = await AuthService.loginOperator(email, password);
      
      appLogger.info({
        message: 'Operator login request processed successfully',email,action: 'login_operator',requestId: req.id,});
      
      res.json({ token });
    } catch (err) {
      appLogger.error({message: 'Operator login request failed',email: req.body.email,error: err.message,stack: err.stack,action: 'login_operator',requestId: req.id,});
      res.status(400).json({ message: 'Login failed', error: err.message });
    }
  }

  // Admin Approve Operator
  static async approveOperator(req, res) {
    try {
      const { operatorId } = req.query;
      const operator = await AuthService.approveOperator(operatorId);
      
      appLogger.info({message: 'Operator approval request processed successfully',operatorId,email: operator.email,action: 'approve_operator',requestId: req.id,});
      
      res.json({ message: 'Operator approved successfully' });
    } catch (err) {
      appLogger.error({message: 'Operator approval request failed',operatorId: req.query.operatorId,error: err.message,stack: err.stack,action: 'approve_operator',requestId: req.id,});
      res.status(400).json({ message: 'Approval failed', error: err.message });
    }
  }

  // Admin Reject Operator
  static async rejectOperator(req, res) {
    try {
      const { operatorId } = req.query;
      const operator = await AuthService.rejectOperator(operatorId);
      
      appLogger.info({message: 'Operator rejection request processed successfully',operatorId,email: operator.email,action: 'reject_operator',requestId: req.id,});      
      res.json({ message: 'Operator rejected successfully' });
    } catch (err) {
      appLogger.error({message: 'Operator rejection request failed',operatorId: req.query.operatorId,error: err.message,stack: err.stack,action: 'reject_operator',requestId: req.id});
      res.status(400).json({ message: 'Rejection failed', error: err.message });
    }
  }

  // Forgot Password (for User, Admin, Operator)
  static async forgotPassword(req, res) {
    try {
      const { email, type } = req.body;
      await AuthService.forgotPassword(email, type);
      
      appLogger.info({message: 'Forgot password request processed successfully',email,type,action: 'forgot_password',requestId: req.id,});
      
      res.json({ message: 'Password reset OTP sent to your email.' });
    } catch (err) {
      appLogger.error({message: 'Forgot password request failed',email: req.body.email,type: req.body.type,error: err.message,stack: err.stack,action: 'forgot_password',requestId: req.id,});
      res.status(400).json({ message: 'Forgot password failed', error: err.message });
    }
  }

  // Reset Password (for User, Admin, Operator)
  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword, type } = req.body;
      await AuthService.resetPassword(email, otp, newPassword, type);
      
      appLogger.info({message: 'Reset password request processed successfully',email,type,action: 'reset_password',requestId: req.id,});
      
      res.json({ message: 'Password reset successful' });
    } catch (err) {
      appLogger.error({message: 'Reset password request failed',email: req.body.email,type: req.body.type,error: err.message,stack: err.stack,action: 'reset_password',requestId: req.id,});
      res.status(400).json({ message: 'Reset password failed', error: err.message });
    }
  }

  // Verify Email
  static async verifyEmail(req, res) {
    try {
      const { email, otp, type } = req.query;
      const result = await AuthService.verifyEmail(email, otp, type);
      appLogger.info({message: 'Email verification request processed successfully',email,type,action: 'verify_email',requestId: req.id,});
      res.json(result);
  
    } catch (err) {
      appLogger.error({message: 'Email verification request failed',email: req.query.email,type: req.query.type,error: err.message,stack: err.stack,action: 'verify_email',requestId: req.id,});
      res.status(400).json({ message: 'Email verification failed', error: err.message });
    }
  }
}

export default AuthController;