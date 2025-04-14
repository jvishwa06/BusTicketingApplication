import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
        },
        phone: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'operator', 'admin'], default: 'user' },
        companyName: { type: String, default: null },
        companyAddress: { type: String, default: null },
        isBlocked: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
