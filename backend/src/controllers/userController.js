import UserService from '../services/userService.js';
import appLogger from '../utils/appLogger.js';

const getUserProfile = async (req, res) => {
  try {
    console.log(req.user._id);
    const user = await UserService.getUserProfile(req.user._id);
    res.json(user);
  } catch (error) {
    appLogger.error({ message: 'Error to fetch profile', operatorId: req.user._id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};  

const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await UserService.updateUserProfile(req.user._id, req.body);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    appLogger.error({ message: 'Error to update profile', operatorId: req.user._id, error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export { getUserProfile, updateUserProfile };
