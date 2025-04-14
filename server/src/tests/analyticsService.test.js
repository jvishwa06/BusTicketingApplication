import analyticsService from '../services/analyticsService.js';
import analyticsRepository from '../repositories/analyticsRepository.js';
import busRepository from '../repositories/busRepository.js';
import tripRepository from '../repositories/tripRepository.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/analyticsRepository.js');
jest.mock('../repositories/busRepository.js');
jest.mock('../repositories/tripRepository.js');
jest.mock('../repositories/ratingRepository.js');
jest.mock('../repositories/userRepository.js');
jest.mock('../utils/logger.js');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookingReportsByOperator', () => {
    const operatorId = 'operator123';
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    it('should return booking reports for an operator', async () => {
      // Mock data
      const mockBuses = [
        { _id: 'bus1', type: 'AC Sleeper', operatorId },
        { _id: 'bus2', type: 'Non-AC Sleeper', operatorId }
      ];
      
      const mockTrips = [
        { _id: 'trip1', busId: 'bus1', source: 'City A', destination: 'City B' },
        { _id: 'trip2', busId: 'bus2', source: 'City C', destination: 'City D' }
      ];
      
      const mockBookings = [
        { 
          _id: 'booking1', 
          tripId: 'trip1', 
          seats: [1, 2], 
          totalPrice: 1000, 
          paymentStatus: 'success',
          createdAt: new Date('2023-01-15')
        },
        { 
          _id: 'booking2', 
          tripId: 'trip2', 
          seats: [3], 
          totalPrice: 500, 
          paymentStatus: 'pending',
          createdAt: new Date('2023-01-20')
        }
      ];
      
      // Setup mocks
      busRepository.getBusesByOperator.mockResolvedValue(mockBuses);
      tripRepository.getTripsByBusIds.mockResolvedValue(mockTrips);
      analyticsRepository.getBookingsByTripIds.mockResolvedValue(mockBookings);
      
      // Call the method
      const result = await analyticsService.getBookingReportsByOperator(operatorId, startDate, endDate);
      
      // Assertions
      expect(busRepository.getBusesByOperator).toHaveBeenCalledWith(operatorId);
      expect(tripRepository.getTripsByBusIds).toHaveBeenCalledWith(['bus1', 'bus2']);
      expect(analyticsRepository.getBookingsByTripIds).toHaveBeenCalledWith(['trip1', 'trip2']);
      
      expect(result).toHaveProperty('totalBookings', 2);
      expect(result).toHaveProperty('totalSeats', 3);
      expect(result).toHaveProperty('totalRevenue', 1500);
      expect(result).toHaveProperty('successfulBookings', 1);
      expect(result).toHaveProperty('pendingBookings', 1);
      expect(result).toHaveProperty('bookingTrends');
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Database error');
      busRepository.getBusesByOperator.mockRejectedValue(error);
      
      await expect(analyticsService.getBookingReportsByOperator(operatorId, startDate, endDate))
        .rejects.toThrow('Database error');
      
      expect(appLogger.error).toHaveBeenCalledWith(`Error in getBookingReportsByOperator: ${error.message}`);
    });
  });

  describe('getRevenueAnalysisByOperator', () => {
    const operatorId = 'operator123';
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    it('should return revenue analysis for an operator', async () => {
      // Mock data
      const mockBuses = [
        { _id: 'bus1', type: 'AC Sleeper', operatorId },
        { _id: 'bus2', type: 'Non-AC Sleeper', operatorId }
      ];
      
      const mockTrips = [
        { _id: 'trip1', busId: 'bus1', source: 'City A', destination: 'City B' },
        { _id: 'trip2', busId: 'bus2', source: 'City C', destination: 'City D' }
      ];
      
      const mockBookings = [
        { 
          _id: 'booking1', 
          tripId: 'trip1', 
          seats: [1, 2], 
          totalPrice: 1000, 
          discount: 100,
          paymentStatus: 'success',
          createdAt: new Date('2023-01-15')
        },
        { 
          _id: 'booking2', 
          tripId: 'trip2', 
          seats: [3], 
          totalPrice: 500, 
          discount: 50,
          paymentStatus: 'success',
          createdAt: new Date('2023-01-20')
        }
      ];
      
      // Setup mocks
      busRepository.getBusesByOperator.mockResolvedValue(mockBuses);
      tripRepository.getTripsByBusIds.mockResolvedValue(mockTrips);
      analyticsRepository.getBookingsByTripIds.mockResolvedValue(mockBookings);
      
      // Call the method
      const result = await analyticsService.getRevenueAnalysisByOperator(operatorId, startDate, endDate);
      
      // Assertions
      expect(busRepository.getBusesByOperator).toHaveBeenCalledWith(operatorId);
      expect(tripRepository.getTripsByBusIds).toHaveBeenCalledWith(['bus1', 'bus2']);
      expect(analyticsRepository.getBookingsByTripIds).toHaveBeenCalledWith(['trip1', 'trip2']);
      
      expect(result).toHaveProperty('totalRevenue', 1500);
      expect(result).toHaveProperty('totalBookings', 2);
      expect(result).toHaveProperty('averageRevenuePerBooking', 750);
      expect(result).toHaveProperty('totalDiscounts', 150);
      expect(result).toHaveProperty('revenueTrends');
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Database error');
      busRepository.getBusesByOperator.mockRejectedValue(error);
      
      await expect(analyticsService.getRevenueAnalysisByOperator(operatorId, startDate, endDate))
        .rejects.toThrow('Database error');
      
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error in getRevenueAnalysisByOperator'));
    });
  });
});
