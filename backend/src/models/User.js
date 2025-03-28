import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  verified: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);
export default User;