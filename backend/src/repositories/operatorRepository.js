const Operator = require('../models/operator');

const findById = async (operatorid) => {
  return await Operator.findById(operatorid);
};

const findByEmail = async (email) => {
  return await Operator.findOne({ email });
};

module.exports = { findById, findByEmail };
