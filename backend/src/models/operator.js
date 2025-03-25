const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },  
  blocked: { type: Boolean, default: false },
});

module.exports = mongoose.model('Operator', operatorSchema);