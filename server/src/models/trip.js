import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
    {
        busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
        operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
        source: { type: String, required: true, trim: true },
        destination: { type: String, required: true, trim: true },
        departureTime: { type: Date, required: true },
        arrivalTime: { type: Date, required: true },
        price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
        availableSeats: { type: Number, required: true, min: [0, 'Available seats cannot be negative'] },
        distance: { type: Number, required:true },
        status: { 
            type: String, 
            required: true, 
            enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
            default: 'scheduled'
        },
        cancellationReason: { type: String }
    }, 
    { timestamps: true }
);

export default mongoose.models.Trip || mongoose.model('Trip', tripSchema);
