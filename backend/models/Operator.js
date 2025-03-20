const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },  
  companyName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

operatorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Operator', operatorSchema);
