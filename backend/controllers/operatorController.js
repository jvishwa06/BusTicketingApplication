const Operator = require('../models/Operator');
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAndSendOtp } = require('../utils/sendOTP');
const nodemailer = require('nodemailer');

// Operator Registration
exports.registerOperator = async (req, res) => {
  const { email, contactPhone, password, companyName } = req.body;
  try {
    const existingOperator = await Operator.findOne({ email });
    if (existingOperator) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newOperator = new Operator({
      email,
      contactPhone,
      passwordHash,
      companyName,
      isEmailVerified: false,
    });

    await newOperator.save();

    await generateAndSendOtp(newOperator._id, email, 'verification');

    await sendAdminApprovalEmail(newOperator._id, companyName);

    res.status(201).json({ message: 'Operator registered successfully! Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  const { otp, email } = req.query;
  try {
    const operator = await Operator.findOne({ email });
    if (!operator) {
      return res.status(400).json({ message: 'Operator not found' });
    }

    const otpRecord = await OTP.findOne({ userId: operator._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    operator.isEmailVerified = true;
    await operator.save();

    await OTP.deleteOne({ userId: operator._id });

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ message: 'Error during email verification', error: err.message });
  }
};

// Send admin approval email
const sendAdminApprovalEmail = async (operatorId, operatorName) => {
  const admin = await Admin.findOne();
  const approvalLink = `http://localhost:5000/api/operator/admin-approve?operatorId=${operatorId}&action=accept`;
  const rejectionLink = `http://localhost:5000/api/operator/admin-approve?operatorId=${operatorId}&action=reject`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: admin.email, 
    subject: 'New Operator Registration Approval Required',
    html: `<p>New operator <strong>${operatorName}</strong> has registered. Click the links below to approve or reject:</p>
           <p><a href="${approvalLink}">Approve</a></p>
           <p><a href="${rejectionLink}">Reject</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Admin Approval or Rejection
exports.adminApprove = async (req, res) => {
  const { operatorId, action } = req.query;
  try {
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    if (action === 'accept') {
      operator.status = 'approved';
    } else if (action === 'reject') {
      operator.status = 'rejected';
    }

    await operator.save();
    res.json({ message: `Operator has been ${action === 'accept' ? 'approved' : 'rejected'}` });
  } catch (err) {
    console.error('Approval Error:', err);
    res.status(500).json({ message: 'Error during admin approval', error: err.message });
  }
};

// Operator Login
exports.loginOperator = async (req, res) => {
  const { email, password } = req.body;
  try {
    const operator = await Operator.findOne({ email });
    if (!operator) return res.status(400).json({ message: 'Operator not found' });

    if (!operator.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    if (operator.status !== 'approved') {
      return res.status(400).json({ message: 'Your account has not been approved by the admin yet' });
    }

    const isMatch = await bcrypt.compare(password, operator.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ operatorId: operator._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Error during login', error: err.message });
  }
};

// Forgot Password 
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const operator = await Operator.findOne({ email });
    if (!operator) return res.status(400).json({ message: 'Operator not found' });

    if (!operator.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email before resetting your password' });
    }

    await generateAndSendOtp(operator._id, email, 'reset'); 

    res.json({ message: 'Password reset OTP sent to email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Error during forgot password', error: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const operator = await Operator.findOne({ email });
    if (!operator) return res.status(400).json({ message: 'Operator not found' });

    const otpRecord = await OTP.findOne({ userId: operator._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    operator.passwordHash = hashedPassword;
    await operator.save();

    await OTP.deleteOne({ userId: operator._id });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Error during password reset', error: err.message });
  }
};
