import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    rating: { 
      type: Number, 
      required: true, 
      min: [1, 'Rating must be at least 1'], 
      max: [5, 'Rating cannot exceed 5'] 
    },
    review: { type: String, trim: true },
  },
  { timestamps: true }
);

ratingSchema.index({ bookingId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
