const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Send verification email with OTP
const sendVerificationEmail = async (email, otp) => {
  const verificationLink = `http://localhost:5000/api/admin/verify-email?otp=${otp}&email=${email}`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP',
    html: `<p>Use the following OTP to verify your email: <b>${otp}</b></p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Admin Registration with email verification
exports.registerAdmin = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationOtp = Math.floor(100000 + Math.random() * 900000);  // Generate OTP

    const newAdmin = new Admin({
      email,
      passwordHash,
      name,    // Include name field in the schema
      verified: false,
    });

    await newAdmin.save();

    // Save OTP in database with expiration time
    const otpRecord = new OTP({
      userId: newAdmin._id,
      otp: verificationOtp,
      expiresAt: Date.now() + 15 * 60 * 1000,  // 15 minutes expiration time
    });

    await otpRecord.save();

    // Send OTP to email for verification
    await sendVerificationEmail(email, verificationOtp);

    res.status(201).json({ message: 'Admin registered successfully! Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
};

// Verify Email using OTP
exports.verifyEmail = async (req, res) => {
  const { otp, email } = req.query;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const otpRecord = await OTP.findOne({ userId: admin._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark admin as verified
    admin.verified = true;
    await admin.save();

    // Delete OTP record after verification
    await OTP.deleteOne({ userId: admin._id });

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ message: 'Error during email verification', error: err.message });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    if (!admin.verified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Error during login', error: err.message });
  }
};

// Forgot Password - Send reset link with OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    // Check if the admin is verified before resetting password
    if (!admin.verified) {
      return res.status(400).json({ message: 'Please verify your email before resetting your password' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);  // Generate OTP for password reset

    const otpRecord = new OTP({
      userId: admin._id,
      otp: otp,
      expiresAt: Date.now() + 15 * 60 * 1000,  // 15 minutes expiration time
    });

    await otpRecord.save();

    // Send OTP to email for reset password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      html: `<p>Use the following OTP to reset your password: <b>${otp}</b></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset OTP sent to email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Error during forgot password', error: err.message });
  }
};

// Reset Password - Only if authenticated (with OTP)
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const otpRecord = await OTP.findOne({ userId: admin._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    admin.passwordHash = hashedPassword;
    await admin.save();

    // Delete OTP record after password reset
    await OTP.deleteOne({ userId: admin._id });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Error during password reset', error: err.message });
  }
};
