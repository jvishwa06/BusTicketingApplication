const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;
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

// User Registration with email verification
exports.registerUser = async (req, res) => {
  const { email, phone, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();  

    const newUser = new User({
      email,
      phone,
      passwordHash,
      name,
      verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'User registered successfully! Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error during registration', error: err.message });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.verified = true;
    user.verificationToken = undefined;  
    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ message: 'Error during email verification', error: err.message });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpRecord = new OTP({
      userId: user._id,
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otpRecord = await OTP.findOne({ userId: user._id, otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.passwordHash = hashedPassword;
    await user.save();

    await OTP.deleteOne({ userId: user._id });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Error during password reset', error: err.message });
  }
};
