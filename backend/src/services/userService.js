import UserRepo from '../repositories/userRepository.js';
class UserService {
  async getUserProfile(userId) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserProfile(userId, updateData) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.name = updateData.name || user.name;
    user.email = updateData.email || user.email;

    await user.save();
    return user;
  }
}

export default new UserService();