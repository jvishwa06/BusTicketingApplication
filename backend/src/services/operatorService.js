const operatorRepository = require('../repositories/operatorRepository');

const getUserProfile = async (operatorId) => {
  const user = await operatorRepository.findById(operatorId);
  if (!user) {
    throw new Error('Operator not found');
  }
  return user;
};

const updateUserProfile = async (operatorId, updateData) => {
  const user = await operatorRepository.findById(operatorId);
  if (!user) {
    throw new Error('Operator not found');
  }

  user.name = updateData.name || user.name;
  user.email = updateData.email || user.email;

  await user.save();
  return user;
};

module.exports = { getUserProfile, updateUserProfile };
