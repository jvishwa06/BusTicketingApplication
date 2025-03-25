const adminService = require('../services/adminService');
const tripRepository = require('../repositories/tripRepository');

const viewAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const blockUnblockUser = async (req, res) => {
    try {
      const userId = req.params.userId;
      const status = await adminService.toggleUserBlockStatus(userId);
      return res.status(200).json({ message: status });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

const viewAllOperators = async (req, res) => {
  try {
    const operators = await adminService.getAllOperators();
    return res.status(200).json(operators);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const blockUnblockOperator = async (req, res) => {
    try {
      const operatorId = req.params.userId;
      const status = await adminService.toggleOperatorBlockStatus(operatorId);
      return res.status(200).json({ message: status });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  const viewTrip = async (req, res) => {
    try {
      const tripId = req.params.tripId;
      const trip = await tripRepository.findById(tripId);
  
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
  
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };


const viewAllTrips = async (req, res) => {
try {
    const trips = await tripRepository.findAll();
    return res.status(200).json(trips);
} catch (error) {
    return res.status(500).json({ message: error.message });
}
};


const cancelTrip = async (req, res) => {
  try {
    const tripId = req.params.tripId;  

    const trip = await tripRepository.findById(tripId);  
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });  
    }

    trip.status = 'cancelled';
    await trip.save();  

    return res.status(200).json({ message: 'Trip cancelled successfully' });  
  } catch (error) {
    return res.status(500).json({ message: error.message });  
  }
};

module.exports = {
  viewAllUsers,
  blockUnblockUser,
  viewAllOperators,
  blockUnblockOperator,
  viewTrip,
  cancelTrip,
  viewAllTrips
};
