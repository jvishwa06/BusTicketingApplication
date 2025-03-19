const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    refundMethod: { type: String, enum: ['Bank Transfer', 'Wallet'], required: true },
    refundStatus: { type: String, enum: ['Pending', 'Processed', 'Failed'], required: true },
    refundTime: { type: Date, default: Date.now },
  });
  
  refundSchema.pre('save', function(next) {
    this.refundTime = Date.now();
    next();
  });
  
  module.exports = mongoose.model('Refund', refundSchema);
  