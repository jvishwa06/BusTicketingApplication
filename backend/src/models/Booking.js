import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  operator: {type: mongoose.Schema.Types.ObjectId,ref: 'Operator',required: true},
  passenger: {name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }},
  seatNumber: { type: Number, required: true },
  status: {type: String,enum: ['pending', 'confirmed', 'cancelled'],default: 'pending'},
  paymentStatus: {type: String,enum: ['pending', 'completed', 'refunded'],default: 'pending'},
  amount: {type: Number,required: true},
  bookingDate: {type: Date,default: Date.now},
  feedback: {rating: { type: Number, min: 1, max: 5 },comment: String}
});

const Booking = mongoose.model('Booking', bookingSchema); 

export default Booking;