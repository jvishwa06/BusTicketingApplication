import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  verified: { type: Boolean, default: false },
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;