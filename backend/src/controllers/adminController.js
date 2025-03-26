const AdminService = require('../services/adminService');
const TripRepository = require('../repositories/tripRepository');

class AdminController {
  constructor() {
    this.adminService = AdminService;
    this.tripRepository = TripRepository;
  }

  async viewAllUsers(req, res) {
    try {
      const users = await this.adminService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async blockUnblockUser(req, res) {
    try {
      const userId = req.params.userId;
      const status = await this.adminService.toggleUserBlockStatus(userId);
      return res.status(200).json({ message: status });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async viewAllOperators(req, res) {
    try {
      const operators = await this.adminService.getAllOperators();
      return res.status(200).json(operators);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async blockUnblockOperator(req, res) {
    try {
      const operatorId = req.params.operatorId;  
      const status = await this.adminService.toggleOperatorBlockStatus(operatorId);
      return res.status(200).json({ message: status });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async viewTrip(req, res) {
    try {
      const tripId = req.params.tripId;
      const trip = await this.tripRepository.findById(tripId);
  
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
  
      return res.status(200).json(trip);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async viewAllTrips(req, res) {
    try {
      const trips = await this.tripRepository.findAll();
      return res.status(200).json(trips);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async cancelTrip(req, res) {
    try {
      const tripId = req.params.tripId;

      const trip = await this.tripRepository.findById(tripId);  
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });  
      }

      trip.status = 'cancelled';
      await trip.save();  

      return res.status(200).json({ message: 'Trip cancelled successfully' });  
    } catch (error) {
      return res.status(500).json({ message: error.message });  
    }
  }
}

module.exports = new AdminController();
