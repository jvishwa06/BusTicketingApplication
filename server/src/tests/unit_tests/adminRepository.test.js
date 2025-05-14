import adminRepository from '../../repositories/adminRepository';
import User from '../../models/user';
import Trip from '../../models/trip';
import Booking from '../../models/booking';
import { appLogger } from '../../utils/logger';

jest.mock('../../models/user');
jest.mock('../../models/trip');
jest.mock('../../models/booking');
jest.mock('../../utils/logger', () => ({
  appLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AdminRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users without filters', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'User One', email: 'user1@example.com', role: 'user' },
        { _id: 'user2', name: 'User Two', email: 'user2@example.com', role: 'user' }
      ];
      
      const selectMock = jest.fn().mockResolvedValue(mockUsers);
      User.find.mockReturnValue({ select: selectMock });
      
      const result = await adminRepository.getAllUsers();
      
      expect(User.find).toHaveBeenCalledWith({});
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUsers);
      expect(appLogger.info).toHaveBeenCalledWith('Fetching users with query:', {});
    });

    it('should apply filters when getting users', async () => {
      const filters = { role: 'user', isBlocked: 'true' };
      const expectedQuery = { role: 'user', isBlocked: true };
      const mockUsers = [{ _id: 'user1', name: 'User One', isBlocked: true }];
      
      const selectMock = jest.fn().mockResolvedValue(mockUsers);
      User.find.mockReturnValue({ select: selectMock });
      
      const result = await adminRepository.getAllUsers(filters);
      
      expect(User.find).toHaveBeenCalledWith(expectedQuery);
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUsers);
      expect(appLogger.info).toHaveBeenCalledWith('Fetching users with query:', expectedQuery);
    });

    it('should throw and log error when getting users fails', async () => {
      const error = new Error('Database error');
      User.find.mockImplementation(() => {
        throw error;
      });
      
      await expect(adminRepository.getAllUsers()).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching users: ${error.message}`);
    });
  });

  describe('getAllOperators', () => {
    it('should return all operators without additional filters', async () => {
      const mockOperators = [
        { _id: 'op1', name: 'Operator One', companyName: 'Company A', role: 'operator' },
        { _id: 'op2', name: 'Operator Two', companyName: 'Company B', role: 'operator' }
      ];
      
      const selectMock = jest.fn().mockResolvedValue(mockOperators);
      User.find.mockReturnValue({ select: selectMock });
      
      const result = await adminRepository.getAllOperators();
      
      expect(User.find).toHaveBeenCalledWith({ role: 'operator' });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockOperators);
    });

    it('should apply all filters when getting operators', async () => {
      const filters = { 
        isVerified: 'true', 
        isBlocked: 'false', 
        companyName: 'Company'
      };
      const mockOperators = [{ _id: 'op1', name: 'Operator One', companyName: 'Company A', isVerified: true }];
      
      const selectMock = jest.fn().mockResolvedValue(mockOperators);
      User.find.mockReturnValue({ select: selectMock });
      
      const result = await adminRepository.getAllOperators(filters);
      
      expect(User.find).toHaveBeenCalledWith({ 
        role: 'operator',
        isVerified: true,
        isBlocked: false,
        companyName: expect.any(RegExp)
      });
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockOperators);
    });

    it('should throw and log error when getting operators fails', async () => {
      const error = new Error('Database error');
      User.find.mockImplementation(() => {
        throw error;
      });
      
      await expect(adminRepository.getAllOperators()).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching operators: ${error.message}`);
    });
  });

  describe('getAllTrips', () => {
    it('should return all trips without filters', async () => {
      const mockTrips = [
        { _id: 'trip1', from: 'Bangalore', to: 'Mumbai', status: 'active' },
        { _id: 'trip2', from: 'Delhi', to: 'Chennai', status: 'active' }
      ];
      
      const populateMock = jest.fn().mockResolvedValue(mockTrips);
      Trip.find.mockReturnValue({ populate: populateMock });
      
      const result = await adminRepository.getAllTrips();
      
      expect(Trip.find).toHaveBeenCalledWith({});
      expect(populateMock).toHaveBeenCalledWith('busId', 'regNumber type operator');
      expect(result).toEqual(mockTrips);
    });

    it('should apply all filters when getting trips', async () => {
      const date = new Date('2023-05-15');
      const filters = { 
        status: 'active', 
        from: 'bang', 
        to: 'mum',
        date: date.toISOString()
      };
      const mockTrips = [{ _id: 'trip1', from: 'Bangalore', to: 'Mumbai', status: 'active' }];
      
      const populateMock = jest.fn().mockResolvedValue(mockTrips);
      Trip.find.mockReturnValue({ populate: populateMock });
      
      const result = await adminRepository.getAllTrips(filters);
      
      expect(Trip.find).toHaveBeenCalledWith({
        status: 'active',
        from: expect.any(RegExp),
        to: expect.any(RegExp),
        departureTime: expect.any(Object)
      });
      expect(populateMock).toHaveBeenCalledWith('busId', 'regNumber type operator');
      expect(result).toEqual(mockTrips);
    });

    it('should throw and log error when getting trips fails', async () => {
      const error = new Error('Database error');
      Trip.find.mockImplementation(() => {
        throw error;
      });
      
      await expect(adminRepository.getAllTrips()).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching trips: ${error.message}`);
    });
  });

  describe('getAllBookings', () => {
    it('should return all bookings without filters', async () => {
      const mockBookings = [
        { _id: 'booking1', userId: 'user1', tripId: 'trip1', status: 'confirmed' },
        { _id: 'booking2', userId: 'user2', tripId: 'trip2', status: 'confirmed' }
      ];
      
      const populateTripMock = jest.fn().mockResolvedValue(mockBookings);
      const populateUserMock = jest.fn().mockReturnValue({
        populate: populateTripMock
      });
      Booking.find.mockReturnValue({
        populate: populateUserMock
      });
      
      const result = await adminRepository.getAllBookings();
      
      expect(Booking.find).toHaveBeenCalledWith({});
      expect(populateUserMock).toHaveBeenCalledWith('userId', 'name email phone');
      expect(result).toEqual(mockBookings);
    });

    it('should apply all filters when getting bookings', async () => {
      const filters = { 
        status: 'confirmed', 
        paymentStatus: 'completed',
        tripId: 'trip123',
        userId: 'user123'
      };
      const mockBookings = [{ _id: 'booking1', status: 'confirmed', paymentStatus: 'completed' }];
      
      const populateTripMock = jest.fn().mockResolvedValue(mockBookings);
      const populateUserMock = jest.fn().mockReturnValue({
        populate: populateTripMock
      });
      Booking.find.mockReturnValue({
        populate: populateUserMock
      });
      
      const result = await adminRepository.getAllBookings(filters);
      
      expect(Booking.find).toHaveBeenCalledWith({
        status: 'confirmed',
        paymentStatus: 'completed',
        trip: 'trip123',
        user: 'user123'
      });
      expect(result).toEqual(mockBookings);
    });

    it('should throw and log error when getting bookings fails', async () => {
      const error = new Error('Database error');
      Booking.find.mockImplementation(() => {
        throw error;
      });
      
      await expect(adminRepository.getAllBookings()).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching bookings: ${error.message}`);
    });
  });

  describe('verifyOperator', () => {
    it('should verify an operator successfully', async () => {
      const userId = 'operator123';
      const verificationStatus = true;
      const updatedOperator = {
        _id: userId,
        name: 'Operator',
        role: 'operator',
        isVerified: true
      };
      
      User.findOneAndUpdate.mockResolvedValue(updatedOperator);
      
      const result = await adminRepository.verifyOperator(userId, verificationStatus);
      
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId, role: 'operator' },
        { isVerified: verificationStatus },
        { new: true }
      );
      expect(appLogger.info).toHaveBeenCalledWith(`Operator ${userId} verification status updated to: ${verificationStatus}`);
      expect(result).toEqual(updatedOperator);
    });

    it('should return null when operator not found for verification', async () => {
      const userId = 'nonexistent';
      const verificationStatus = true;
      
      User.findOneAndUpdate.mockResolvedValue(null);
      
      const result = await adminRepository.verifyOperator(userId, verificationStatus);
      
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId, role: 'operator' },
        { isVerified: verificationStatus },
        { new: true }
      );
      expect(appLogger.warn).toHaveBeenCalledWith(`Operator with ID ${userId} not found`);
      expect(result).toBeNull();
    });

    it('should throw and log error when verifying operator fails', async () => {
      const userId = 'operator123';
      const verificationStatus = true;
      const error = new Error('Database error');
      
      User.findOneAndUpdate.mockRejectedValue(error);
      
      await expect(adminRepository.verifyOperator(userId, verificationStatus)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error verifying operator: ${error.message}`);
    });
  });

  describe('updateUserStatus', () => {
    it('should block a user successfully', async () => {
      const userId = 'user123';
      const isBlocked = true;
      const updatedUser = {
        _id: userId,
        name: 'User',
        isBlocked: true
      };
      
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);
      
      const result = await adminRepository.updateUserStatus(userId, isBlocked);
      
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { isBlocked }, { new: true });
      expect(appLogger.info).toHaveBeenCalledWith(`User ${userId} status updated: Blocked`);
      expect(result).toEqual(updatedUser);
    });

    it('should unblock a user successfully', async () => {
      const userId = 'user123';
      const isBlocked = false;
      const updatedUser = {
        _id: userId,
        name: 'User',
        isBlocked: false
      };
      
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);
      
      const result = await adminRepository.updateUserStatus(userId, isBlocked);
      
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { isBlocked }, { new: true });
      expect(appLogger.info).toHaveBeenCalledWith(`User ${userId} status updated: Unblocked`);
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user not found for status update', async () => {
      const userId = 'nonexistent';
      const isBlocked = true;
      
      User.findByIdAndUpdate.mockResolvedValue(null);
      
      const result = await adminRepository.updateUserStatus(userId, isBlocked);
      
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { isBlocked }, { new: true });
      expect(appLogger.warn).toHaveBeenCalledWith(`User with ID ${userId} not found`);
      expect(result).toBeNull();
    });

    it('should throw and log error when updating user status fails', async () => {
      const userId = 'user123';
      const isBlocked = true;
      const error = new Error('Database error');
      
      User.findByIdAndUpdate.mockRejectedValue(error);
      
      await expect(adminRepository.updateUserStatus(userId, isBlocked)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error updating user status for ID ${userId}: ${error.message}`);
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a trip successfully', async () => {
      const tripId = 'trip123';
      const reason = 'Bad weather conditions';
      const updatedTrip = {
        _id: tripId,
        status: 'cancelled',
        cancellationReason: reason,
      };
      
      Trip.findByIdAndUpdate.mockResolvedValue(updatedTrip);
      Booking.updateMany.mockResolvedValue({ modifiedCount: 2 });
      
      const result = await adminRepository.cancelTrip(tripId, reason);
      
      expect(Trip.findByIdAndUpdate).toHaveBeenCalledWith(
        tripId,
        {
          status: 'cancelled',
          cancellationReason: reason,
        },
        { new: true }
      );
      expect(Booking.updateMany).toHaveBeenCalledWith(
        { trip: tripId, status: { $ne: 'cancelled' } },
        { status: 'cancelled', cancellationReason: `Trip cancelled by admin: ${reason}` }
      );
      expect(appLogger.info).toHaveBeenCalledWith(`Cancelling trip ${tripId} due to: ${reason}`);
      expect(result).toEqual(updatedTrip);
    });

    it('should return null when trip not found for cancellation', async () => {
      const tripId = 'nonexistent';
      const reason = 'Bad weather conditions';
      
      Trip.findByIdAndUpdate.mockResolvedValue(null);
      
      const result = await adminRepository.cancelTrip(tripId, reason);
      
      expect(Trip.findByIdAndUpdate).toHaveBeenCalledWith(
        tripId,
        {
          status: 'cancelled',
          cancellationReason: reason,
        },
        { new: true }
      );
      expect(appLogger.warn).toHaveBeenCalledWith(`Trip with ID ${tripId} not found`);
      expect(Booking.updateMany).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw and log error when cancelling trip fails', async () => {
      const tripId = 'trip123';
      const reason = 'Bad weather conditions';
      const error = new Error('Database error');
      
      Trip.findByIdAndUpdate.mockRejectedValue(error);
      
      await expect(adminRepository.cancelTrip(tripId, reason)).rejects.toThrow(error);
      expect(appLogger.error).toHaveBeenCalledWith(`Error cancelling trip: ${error.message}`);
    });
  });
});
