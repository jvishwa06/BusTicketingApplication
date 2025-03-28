import Operator from '../models/operator.js';

const findById = async (operatorid) => {
  return await Operator.findById(operatorid);
};

const findByEmail = async (email) => {
  return await Operator.findOne({ email });
};

export default { findById, findByEmail };
