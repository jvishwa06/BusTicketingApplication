const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Credit/Debit Card', 'UPI', 'Wallet'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], required: true },
    paymentTime: { type: Date, default: Date.now },
  });
  
  paymentSchema.pre('save', function(next) {
    this.paymentTime = Date.now();
    next();
  });
  
  module.exports = mongoose.model('Payment', paymentSchema);
  