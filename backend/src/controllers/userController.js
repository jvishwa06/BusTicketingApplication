const UserService = require('../services/userService');

const getUserProfile = async (req, res) => {
  try {
    console.log(req.user._id);
    const user = await UserService.getUserProfile(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};  

const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUserProfile(req.user._id, req.body);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { getUserProfile, updateUserProfile };
