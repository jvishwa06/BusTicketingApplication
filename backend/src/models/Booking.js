import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: { type: [Number], required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: {type: String,enum: ['success', 'failed', 'pending'],default: 'pending'},
    paymentDetails: {type: mongoose.Schema.Types.ObjectId,ref: 'Payment', default: null},
  },
  { timestamps: true }
);

export default mongoose.model('Booking', BookingSchema);
