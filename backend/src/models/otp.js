const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: { type: string, required: true }, 
  otp: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('OTP', otpSchema);