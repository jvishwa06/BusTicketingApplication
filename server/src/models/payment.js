import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true, min: [0, 'Payment amount cannot be negative'] },
        method: { type: String, enum: ['Credit Card', 'Debit Card', 'UPI', 'Wallet'], required: true },
        status: { type: String, enum: ['successful', 'failed', 'pending'], default: 'pending' },
        transactionId: { type: String, unique: true }
    }, 
    { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
