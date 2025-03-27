const User = require('../models/user');

const findById = async (userId) => {
  return await User.findById(userId);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

module.exports = { findById, findByEmail };
