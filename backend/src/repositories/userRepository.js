import User from '../models/user.js';

const findById = async (userId) => {
  return await User.findById(userId);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

export default { findById, findByEmail };
