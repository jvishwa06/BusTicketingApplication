const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },  
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
