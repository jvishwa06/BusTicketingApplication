const { UserRepo, AdminRepo, OperatorRepo } = require('../repositories/authRepository');
const tripRepository = require('../repositories/tripRepository');

class AdminService {
  async getAllUsers() {
    try {
      return await UserRepo.model.find();  
    } catch (error) {
      throw new Error('Error while fetching users');
    }
  }

  async toggleUserBlockStatus(userId) {
    const user = await UserRepo.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.blocked = !user.blocked;
    await user.save();
    
    return user.blocked ? 'User blocked' : 'User unblocked';
  }

  async getAllOperators() {
    try {
      return await OperatorRepo.model.find();  
    } catch (error) {
      throw new Error('Error while fetching operators');
    }
  }

  async toggleOperatorBlockStatus(operatorId) {
    const operator = await OperatorRepo.findById(operatorId);
    if (!operator) throw new Error('Operator not found');
    
    operator.blocked = !operator.blocked;
    await operator.save();
    
    return operator.blocked ? 'Operator blocked' : 'Operator unblocked';
  }

  async getTripById(tripId) {
    const trip = await tripRepository.findByIdAndOperator(tripId);
    if (!trip) throw new Error('Trip not found');
    return trip;
  }

  async cancelTrip(tripId) {
    const trip = await tripRepository.findByIdAndOperator(tripId);
    if (!trip) throw new Error('Trip not found');
    
    await tripRepository.update(tripId, { status: 'cancelled' });
    return 'Trip cancelled successfully';
  }
}

module.exports = new AdminService();
