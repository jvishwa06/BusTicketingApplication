import mongoose from 'mongoose';

const BusSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true,trim: true},
    registrationNumber: {type: String,required: true,unique: true,uppercase: true},
    type: { type: String, enum: ['AC', 'Non-AC', 'Sleeper', 'Seater'], required: true },
    totalSeats: { type: Number, required: true, min: [1, 'Total seats must be at least 1'] },
    amenities: {type: [String], enum: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle']},
  },
  { timestamps: true }
);

BusSchema.pre('save', function (next) {
  this.name = this.name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  next();
});

export default mongoose.model('Bus', BusSchema);
