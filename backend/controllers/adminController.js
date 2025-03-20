const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://localhost:5000/api/admin/verify-email?token=${token}`;
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
    subject: 'Please verify your email address',
    html: `<p>Click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Admin Registration with email verification
exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4(); 

    const newAdmin = new Admin({
      email,
      passwordHash,
      verificationToken,
    });

    await newAdmin.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Admin registered successfully! Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const admin = await Admin.findOne({ verificationToken: token });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    admin.verified = true;
    admin.verificationToken = undefined; 
    await admin.save();

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

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpRecord = new OTP({
      userId: admin._id,
      otp: otp,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    await otpRecord.save();
    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Error during forgot password', error: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    const otpRecord = await OTP.findOne({ userId: admin._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    admin.passwordHash = hashedPassword;
    await admin.save();

    await OTP.deleteOne({ userId: admin._id });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Error during password reset', error: err.message });
  }
};
