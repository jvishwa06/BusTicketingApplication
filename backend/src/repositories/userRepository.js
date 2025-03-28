import User from '../models/user.js';

class UserRepository {
  async findById(userId) {
    return await User.findById(userId);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }
}

export default new UserRepository();
