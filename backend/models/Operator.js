const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isEmailVerified: { type: Boolean, default: false }, 
  passwordHash: { type: String, required: true },
  verificationToken: { type: String }, 
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  otp: { type: String },
  otpExpiresAt: { type: Date },
});

operatorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Operator', operatorSchema);
