import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
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

export default mongoose.models.Bus || mongoose.model('Bus', busSchema);
