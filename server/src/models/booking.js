import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: { type: [Number], required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: {type: String,enum: ['success', 'failed', 'pending'],default: 'pending'},
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);