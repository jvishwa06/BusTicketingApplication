import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
  source: {
    city: { type: String, required: true },
    location: { type: String, required: true },
  },
  destination: {
    city: { type: String, required: true },
    location: { type: String, required: true },
  },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  busDetails: {
    type: {
      type: String, required: true
    },
    totalSeats: { type: Number, required: true },
    amenities: [String],
    seatLayout: { type: String, enum: ['2x2', '2x3', '3x3'], required: true },
  },
  pricing: {
    basePrice: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  availableSeats: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

tripSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;