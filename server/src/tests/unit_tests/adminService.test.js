import AdminService from '../../services/adminService.js';
import AdminRepository from '../../repositories/adminRepository.js';
import { appLogger } from '../../utils/logger.js';

jest.mock('../../repositories/adminRepository.js');
jest.mock('../../utils/logger.js');

describe('AdminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('should block a user successfully', async () => {
      const mockUserId = '12345';
      const mockUser = { id: mockUserId, blocked: true };
      AdminRepository.updateUserStatus.mockResolvedValue(mockUser);

      const result = await AdminService.blockUser(mockUserId);
      
      expect(AdminRepository.updateUserStatus).toHaveBeenCalledWith(mockUserId, true);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User blocked successfully', user: mockUser });
    });

    it('should throw an error if user not found', async () => {
      const mockUserId = '12345';
      AdminRepository.updateUserStatus.mockResolvedValue(null);
      
      await expect(AdminService.blockUser(mockUserId)).rejects.toThrow(`User with ID ${mockUserId} not found`);
      expect(appLogger.warn).toHaveBeenCalled();
    });

    it('should handle and log repository errors when blocking user', async () => {
      const mockUserId = '12345';
      const mockError = new Error('Database connection failed');
      AdminRepository.updateUserStatus.mockRejectedValue(mockError);
      
      await expect(AdminService.blockUser(mockUserId)).rejects.toThrow('Database connection failed');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should throw a generic error when no error message is provided', async () => {
      const mockUserId = '12345';
      AdminRepository.updateUserStatus.mockRejectedValue({});
      
      await expect(AdminService.blockUser(mockUserId)).rejects.toThrow('Error blocking user');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user successfully', async () => {
      const mockUserId = '12345';
      const mockUser = { id: mockUserId, blocked: false };
      AdminRepository.updateUserStatus.mockResolvedValue(mockUser);

      const result = await AdminService.unblockUser(mockUserId);
      
      expect(AdminRepository.updateUserStatus).toHaveBeenCalledWith(mockUserId, false);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User unblocked successfully', user: mockUser });
    });

    it('should throw an error if user not found', async () => {
      const mockUserId = '12345';
      AdminRepository.updateUserStatus.mockResolvedValue(null);
      
      await expect(AdminService.unblockUser(mockUserId)).rejects.toThrow(`User with ID ${mockUserId} not found`);
      expect(appLogger.warn).toHaveBeenCalled();
    });

    it('should handle and log repository errors when unblocking user', async () => {
      const mockUserId = '12345';
      const mockError = new Error('Database connection failed');
      AdminRepository.updateUserStatus.mockRejectedValue(mockError);
      
      await expect(AdminService.unblockUser(mockUserId)).rejects.toThrow('Database connection failed');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should throw a generic error when no error message is provided', async () => {
      const mockUserId = '12345';
      AdminRepository.updateUserStatus.mockRejectedValue({});
      
      await expect(AdminService.unblockUser(mockUserId)).rejects.toThrow('Error unblocking user');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users with filters successfully', async () => {
      const mockFilters = { role: 'user', isBlocked: 'false' };
      const mockUsers = [
        { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'user', isBlocked: false },
        { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'user', isBlocked: false }
      ];

      AdminRepository.getAllUsers.mockResolvedValue(mockUsers);

      const result = await AdminService.getAllUsers(mockFilters);
      
      expect(AdminRepository.getAllUsers).toHaveBeenCalledWith(mockFilters);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should handle repository errors when fetching users', async () => {
      const mockError = new Error('Database error');
      AdminRepository.getAllUsers.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllUsers()).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllOperators', () => {
    it('should retrieve all operators successfully', async () => {
      const mockFilters = { isVerified: 'true' };
      const mockOperators = [
        { _id: '1', name: 'Operator 1', email: 'op1@example.com', role: 'operator', isVerified: true },
        { _id: '2', name: 'Operator 2', email: 'op2@example.com', role: 'operator', isVerified: true }
      ];
      
      AdminRepository.getAllOperators.mockResolvedValue(mockOperators);

      const result = await AdminService.getAllOperators(mockFilters);
      
      expect(AdminRepository.getAllOperators).toHaveBeenCalledWith(mockFilters);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockOperators);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no operators found', async () => {
      AdminRepository.getAllOperators.mockResolvedValue([]);
      
      const result = await AdminService.getAllOperators({});
      
      expect(AdminRepository.getAllOperators).toHaveBeenCalled();
      expect(appLogger.info).toHaveBeenCalledWith('Getting all operators with filters:', {});
      expect(appLogger.info).toHaveBeenCalledWith('Retrieved 0 operators');
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle and log repository errors when retrieving operators', async () => {
      const mockError = new Error('Database connection failed');
      AdminRepository.getAllOperators.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllOperators({})).rejects.toThrow('Failed to retrieve operators');
      expect(appLogger.error).toHaveBeenCalledWith(`Error retrieving operators: ${mockError.message}`);
    });
    
    it('should handle error with empty string message when retrieving operators', async () => {
      const mockError = new Error('');
      AdminRepository.getAllOperators.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllOperators({})).rejects.toThrow('Failed to retrieve operators');
      expect(appLogger.error).toHaveBeenCalledWith('Error retrieving operators: ');
    });
    
    it('should handle error without message property when retrieving operators', async () => {
      const mockError = {};  
      AdminRepository.getAllOperators.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllOperators({})).rejects.toThrow('Failed to retrieve operators');
      expect(appLogger.error).toHaveBeenCalledWith('Error retrieving operators: undefined');
    });
  });

  describe('verifyOperator', () => {
    it('should verify an operator successfully', async () => {
      const mockUserId = '12345';
      const mockVerificationStatus = true;
      const mockOperator = { 
        _id: mockUserId, 
        name: 'Operator',
        email: 'operator@example.com', 
        role: 'operator', 
        isVerified: true 
      };

      AdminRepository.verifyOperator.mockResolvedValue(mockOperator);

      const result = await AdminService.verifyOperator(mockUserId, mockVerificationStatus);
      
      expect(AdminRepository.verifyOperator).toHaveBeenCalledWith(mockUserId, mockVerificationStatus);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockOperator);
    });

    it('should throw an error if operator not found', async () => {
      const mockUserId = '12345';
      const mockVerificationStatus = true;
      
      AdminRepository.verifyOperator.mockResolvedValue(null);
      
      await expect(AdminService.verifyOperator(mockUserId, mockVerificationStatus))
        .rejects.toThrow(`Operator with ID ${mockUserId} not found`);
      expect(appLogger.warn).toHaveBeenCalled();
    });

    it('should handle repository errors when verifying operator', async () => {
      const mockUserId = '12345';
      const mockVerificationStatus = true;
      const mockError = new Error('Database error');
      
      AdminRepository.verifyOperator.mockRejectedValue(mockError);
      
      await expect(AdminService.verifyOperator(mockUserId, mockVerificationStatus))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllTrips', () => {
    it('should retrieve all trips with filters successfully', async () => {
      const mockFilters = { status: 'active', from: 'New York' };
      const mockTrips = [
        { _id: '1', from: 'New York', to: 'Boston', status: 'active' },
        { _id: '2', from: 'New York', to: 'Washington', status: 'active' }
      ];

      AdminRepository.getAllTrips.mockResolvedValue(mockTrips);

      const result = await AdminService.getAllTrips(mockFilters);
      
      expect(AdminRepository.getAllTrips).toHaveBeenCalledWith(mockFilters);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockTrips);
    });

    it('should handle repository errors when fetching trips', async () => {
      const mockError = new Error('Database error');
      AdminRepository.getAllTrips.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllTrips()).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllBookings', () => {
    it('should retrieve all bookings with filters successfully', async () => {
      const mockFilters = { status: 'confirmed', paymentStatus: 'paid' };
      const mockBookings = [
        { _id: '1', user: '123', trip: '456', status: 'confirmed', paymentStatus: 'paid' },
        { _id: '2', user: '789', trip: '456', status: 'confirmed', paymentStatus: 'paid' }
      ];

      AdminRepository.getAllBookings.mockResolvedValue(mockBookings);

      const result = await AdminService.getAllBookings(mockFilters);
      
      expect(AdminRepository.getAllBookings).toHaveBeenCalledWith(mockFilters);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockBookings);
    });

    it('should handle repository errors when fetching bookings', async () => {
      const mockError = new Error('Database error');
      AdminRepository.getAllBookings.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllBookings()).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('modifyTrip', () => {
    it('should modify a trip successfully', async () => {
      const mockTripId = '12345';
      const mockTripData = { 
        departureTime: new Date('2025-05-01T10:00:00Z'),
        fare: 50 
      };
      const mockTrip = { 
        _id: mockTripId, 
        from: 'New York', 
        to: 'Boston',
        departureTime: new Date('2025-05-01T10:00:00Z'),
        fare: 50,
        status: 'active'
      };

      AdminRepository.modifyTrip.mockResolvedValue(mockTrip);

      const result = await AdminService.modifyTrip(mockTripId, mockTripData);
      
      expect(AdminRepository.modifyTrip).toHaveBeenCalledWith(mockTripId, mockTripData);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockTrip);
    });

    it('should throw an error if trip not found', async () => {
      const mockTripId = '12345';
      const mockTripData = { departureTime: new Date('2025-05-01T10:00:00Z') };
      
      AdminRepository.modifyTrip.mockResolvedValue(null);
      
      await expect(AdminService.modifyTrip(mockTripId, mockTripData))
        .rejects.toThrow(`Trip with ID ${mockTripId} not found`);
      expect(appLogger.warn).toHaveBeenCalled();
    });

    it('should handle repository errors when modifying trip', async () => {
      const mockTripId = '12345';
      const mockTripData = { departureTime: new Date('2025-05-01T10:00:00Z') };
      const mockError = new Error('Database error');
      
      AdminRepository.modifyTrip.mockRejectedValue(mockError);
      
      await expect(AdminService.modifyTrip(mockTripId, mockTripData))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a trip successfully', async () => {
      const mockTripId = '12345';
      const mockReason = 'Weather conditions';
      const mockTrip = { 
        _id: mockTripId, 
        from: 'New York', 
        to: 'Boston',
        status: 'cancelled',
        cancellationReason: 'Weather conditions',
        adminCancelled: true
      };

      AdminRepository.cancelTrip.mockResolvedValue(mockTrip);

      const result = await AdminService.cancelTrip(mockTripId, mockReason);
      
      expect(AdminRepository.cancelTrip).toHaveBeenCalledWith(mockTripId, mockReason);
      expect(appLogger.info).toHaveBeenCalled();
      expect(result).toEqual(mockTrip);
    });

    it('should throw an error if trip not found', async () => {
      const mockTripId = '12345';
      const mockReason = 'Weather conditions';
      
      AdminRepository.cancelTrip.mockResolvedValue(null);
      
      await expect(AdminService.cancelTrip(mockTripId, mockReason))
        .rejects.toThrow(`Trip with ID ${mockTripId} not found`);
      expect(appLogger.warn).toHaveBeenCalled();
    });

    it('should handle repository errors when cancelling trip', async () => {
      const mockTripId = '12345';
      const mockReason = 'Weather conditions';
      const mockError = new Error('Database error');
      
      AdminRepository.cancelTrip.mockRejectedValue(mockError);
      
      await expect(AdminService.cancelTrip(mockTripId, mockReason))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });

  describe('error handling with undefined error messages', () => {
    it('should use default message for getAllUsers when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.getAllUsers.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllUsers()).rejects.toThrow('Error fetching users');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should use default message for verifyOperator when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.verifyOperator.mockRejectedValue(mockError);
      
      await expect(AdminService.verifyOperator('123', true)).rejects.toThrow('Error verifying operator');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should use default message for getAllTrips when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.getAllTrips.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllTrips()).rejects.toThrow('Error fetching trips');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should use default message for getAllBookings when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.getAllBookings.mockRejectedValue(mockError);
      
      await expect(AdminService.getAllBookings()).rejects.toThrow('Error fetching bookings');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should use default message for modifyTrip when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.modifyTrip.mockRejectedValue(mockError);
      
      await expect(AdminService.modifyTrip('123', {})).rejects.toThrow('Error modifying trip');
      expect(appLogger.error).toHaveBeenCalled();
    });

    it('should use default message for cancelTrip when error has no message', async () => {
      const mockError = new Error();
      mockError.message = undefined;
      AdminRepository.cancelTrip.mockRejectedValue(mockError);
      
      await expect(AdminService.cancelTrip('123', 'reason')).rejects.toThrow('Error cancelling trip');
      expect(appLogger.error).toHaveBeenCalled();
    });
  });
});