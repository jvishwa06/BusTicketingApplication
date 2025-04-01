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
        availableSeats: { type: Number, required: true, min: [0, 'Available seats cannot be negative'] }
    }, 
    { timestamps: true }
);

tripSchema.pre('save', async function (next) {
    if (this.arrivalTime <= this.departureTime) {
        return next(new Error('Arrival time must be after departure time.'));
    }
    next();
});

export default mongoose.model('Trip', tripSchema);
