const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    seatNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    bookingStatus: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], required: true },
    bookingTime: { type: Date, default: Date.now },
  });
  
  bookingSchema.pre('save', function(next) {
    this.bookingTime = Date.now();
    next();
  });
  
  module.exports = mongoose.model('Booking', bookingSchema);
  