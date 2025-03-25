const OTP = require('../models/otp');
const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp, type) => {
  const subject = type === 'verification' ? 'Email Verification OTP' : 'Password Reset OTP';
  const message = type === 'verification'
    ? `<p>Use the following OTP to verify your email: <b>${otp}</b></p>`
    : `<p>Use the following OTP to reset your password: <b>${otp}</b></p>`;

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
    subject: subject,
    html: message,
  };

  await transporter.sendMail(mailOptions);
};

const generateAndSendOtp = async (userId, email, type) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpRecord = new OTP({
    userId,
    otp,
    expiresAt: Date.now() + 30 * 1000,
  });

  await otpRecord.save();
  await sendOtpEmail(email, otp, type);
};

module.exports = { generateAndSendOtp };
