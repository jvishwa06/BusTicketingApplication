const OperatorService = require('../services/operatorService.js');

const getUserProfile = async (req, res) => {
  try {
    console.log(req);
    const operator = await OperatorService.getUserProfile(req.operator._id);
    res.json(operator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}; 

const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await OperatorService.updateUserProfile(req.operator._id, req.body);
    res.json({ message: 'Profile updated successfully', operator: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { getUserProfile, updateUserProfile };
