const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    pricing: { type: Number, required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  tripSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
  
  module.exports = mongoose.model('Trip', tripSchema);
  