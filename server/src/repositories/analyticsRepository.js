import Booking from '../models/booking.js';
import Trip from '../models/trip.js';
import User from '../models/user.js';
import Bus from '../models/bus.js';
import Rating from '../models/rating.js';
import mongoose from 'mongoose';
import { appLogger } from '../utils/logger.js';

class AnalyticsRepository {
  async getBookingsByTripIds(tripIds) {
    try {
      return await Booking.find({
        tripId: { $in: tripIds }
      })
        .populate('userId', 'name email phone')
        .populate({
          path: 'tripId',
          populate: {
            path: 'busId',
            model: 'Bus'
          }
        });
    } catch (error) {
      appLogger.error(`Error in getBookingsByTripIds: ${error.message}`);
      throw error;
    }
  }

  async getBookingsInDateRange(startDate, endDate) {
    try {
      return await Booking.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('userId', 'name email phone')
        .populate({
          path: 'tripId',
          populate: {
            path: 'busId',
            model: 'Bus'
          }
        });
    } catch (error) {
      appLogger.error(`Error in getBookingsInDateRange: ${error.message}`);
      throw error;
    }
  }

  async getTripsByBusIds(busIds) {
    try {
      return await Trip.find({
        busId: { $in: busIds }
      }).populate('busId');
    } catch (error) {
      appLogger.error(`Error in getTripsByBusIds: ${error.message}`);
      throw error;
    }
  }


  async getTripsInDateRange(startDate, endDate) {
    try {
      return await Trip.find({
        departureTime: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('busId');
    } catch (error) {
      appLogger.error(`Error in getTripsInDateRange: ${error.message}`);
      throw error;
    }
  }


  async getUsersInDateRange(startDate, endDate, role = null) {
    try {
      const query = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      if (role) {
        query.role = role;
      }
      
      return await User.find(query);
    } catch (error) {
      appLogger.error(`Error in getUsersInDateRange: ${error.message}`);
      throw error;
    }
  }


  async getBusesByOperator(operatorId) {
    try {
      return await Bus.find({ operatorId });
    } catch (error) {
      appLogger.error(`Error in getBusesByOperator: ${error.message}`);
      throw error;
    }
  }


  async getRatingsByTripId(tripId) {
    try {
      return await Rating.find({ tripId })
        .populate('userId', 'name email');
    } catch (error) {
      appLogger.error(`Error in getRatingsByTripId: ${error.message}`);
      throw error;
    }
  }


  async getBookingStatsByOperator(operatorId, startDate, endDate, groupByField = 'createdAt') {
    try {
      const buses = await Bus.find({ operatorId });
      const busIds = buses.map(bus => bus._id);
      
      const trips = await Trip.find({ busId: { $in: busIds } });
      const tripIds = trips.map(trip => trip._id);
      
      const dateFormat = {
        daily: { $dateToString: { format: "%Y-%m-%d", date: `$${groupByField}` } },
        weekly: { 
          $dateToString: { 
            format: "%Y-%U", 
            date: `$${groupByField}` 
          } 
        },
        monthly: { $dateToString: { format: "%Y-%m", date: `$${groupByField}` } }
      };
      
      const aggregateFormat = dateFormat.daily; 
      
      return await Booking.aggregate([
        {
          $match: {
            tripId: { $in: tripIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: aggregateFormat,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
            seats: { $sum: { $size: "$seats" } },
            discounts: { $sum: { $ifNull: ["$discount", 0] } }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            period: "$_id",
            count: 1,
            revenue: 1,
            seats: 1,
            discounts: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getBookingStatsByOperator: ${error.message}`);
      throw error;
    }
  }

  async getRevenueStatsByOperator(operatorId, startDate, endDate, groupBy = 'daily') {
    try {
      const buses = await Bus.find({ operatorId });
      const busIds = buses.map(bus => bus._id);
      
      const trips = await Trip.find({ busId: { $in: busIds } });
      const tripIds = trips.map(trip => trip._id);
      
      let dateFormat;
      switch(groupBy) {
        case 'weekly':
          dateFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
          break;
        case 'monthly':
          dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        case 'daily':
        default:
          dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
      }
      
      return await Booking.aggregate([
        {
          $match: {
            tripId: { $in: tripIds },
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
          }
        },
        {
          $group: {
            _id: dateFormat,
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
            discounts: { $sum: { $ifNull: ["$discount", 0] } }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            period: "$_id",
            revenue: 1,
            bookings: 1,
            discounts: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getRevenueStatsByOperator: ${error.message}`);
      throw error;
    }
  }


  async getRevenueByBusType(operatorId, startDate, endDate) {
    try {
      return await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
          }
        },
        {
          $lookup: {
            from: 'trips',
            localField: 'tripId',
            foreignField: '_id',
            as: 'trip'
          }
        },
        {
          $unwind: '$trip'
        },
        {
          $lookup: {
            from: 'buses',
            localField: 'trip.busId',
            foreignField: '_id',
            as: 'bus'
          }
        },
        {
          $unwind: '$bus'
        },
        {
          $match: {
            'bus.operatorId': new mongoose.Types.ObjectId(operatorId)
          }
        },
        {
          $group: {
            _id: '$bus.type',
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            busType: { $ifNull: ['$_id', 'unknown'] },
            revenue: 1,
            bookings: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getRevenueByBusType: ${error.message}`);
      throw error;
    }
  }


  async getRevenueByRoute(operatorId, startDate, endDate) {
    try {
      return await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
          }
        },
        {
          $lookup: {
            from: 'trips',
            localField: 'tripId',
            foreignField: '_id',
            as: 'trip'
          }
        },
        {
          $unwind: '$trip'
        },
        {
          $lookup: {
            from: 'buses',
            localField: 'trip.busId',
            foreignField: '_id',
            as: 'bus'
          }
        },
        {
          $unwind: '$bus'
        },
        {
          $match: {
            'bus.operatorId': new mongoose.Types.ObjectId(operatorId)
          }
        },
        {
          $group: {
            _id: {
              source: '$trip.source',
              destination: '$trip.destination'
            },
            revenue: { $sum: '$totalPrice' },
            bookings: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            route: { $concat: ['$_id.source', ' to ', '$_id.destination'] },
            source: '$_id.source',
            destination: '$_id.destination',
            revenue: 1,
            bookings: 1
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getRevenueByRoute: ${error.message}`);
      throw error;
    }
  }

  async getUserRegistrationStats(startDate, endDate, groupBy = 'daily') {
    try {
      // Determine date format based on groupBy parameter
      let dateFormat;
      switch(groupBy) {
        case 'weekly':
          dateFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
          break;
        case 'monthly':
          dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        case 'daily':
        default:
          dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
      }
      
      return await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            role: 'user'
          }
        },
        {
          $group: {
            _id: dateFormat,
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            period: "$_id",
            count: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getUserRegistrationStats: ${error.message}`);
      throw error;
    }
  }


  async getTopUsersByBookingCount(startDate, endDate, limit = 10) {
    try {
      return await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            bookingCount: { $sum: 1 },
            totalSpending: { 
              $sum: { 
                $cond: [{ $eq: ['$paymentStatus', 'success'] }, '$totalPrice', 0] 
              } 
            }
          }
        },
        {
          $sort: { bookingCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            phone: '$user.phone',
            bookingCount: 1,
            totalSpending: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getTopUsersByBookingCount: ${error.message}`);
      throw error;
    }
  }

  async getTopUsersBySpending(startDate, endDate, limit = 10) {
    try {
      return await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
          }
        },
        {
          $group: {
            _id: '$userId',
            bookingCount: { $sum: 1 },
            totalSpending: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { totalSpending: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            phone: '$user.phone',
            bookingCount: 1,
            totalSpending: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getTopUsersBySpending: ${error.message}`);
      throw error;
    }
  }

  async getOperatorPerformanceMetrics(startDate, endDate) {
    try {
      // Get all operators
      const operators = await User.find({ role: 'operator' });
      const operatorIds = operators.map(op => op._id);
      
      // Get base metrics using aggregation
      const baseMetrics = await Bus.aggregate([
        {
          $match: {
            operatorId: { $in: operatorIds }
          }
        },
        {
          $group: {
            _id: '$operatorId',
            totalBuses: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'operator'
          }
        },
        {
          $unwind: '$operator'
        },
        {
          $project: {
            _id: 0,
            operatorId: '$_id',
            name: '$operator.name',
            email: '$operator.email',
            totalBuses: 1
          }
        }
      ]);
      
      // For each operator, get additional metrics
      for (const metric of baseMetrics) {
        // Get buses
        const buses = await Bus.find({ operatorId: metric.operatorId });
        const busIds = buses.map(bus => bus._id);
        
        // Get trips
        const trips = await Trip.find({
          busId: { $in: busIds },
          departureTime: { $gte: startDate, $lte: endDate }
        });
        const tripIds = trips.map(trip => trip._id);
        
        // Get bookings
        const bookings = await Booking.find({
          tripId: { $in: tripIds },
          createdAt: { $gte: startDate, $lte: endDate }
        });
        
        const successfulBookings = bookings.filter(booking => booking.paymentStatus === 'success');
        
        // Get ratings
        const ratings = await Rating.find({
          tripId: { $in: tripIds },
          createdAt: { $gte: startDate, $lte: endDate }
        });
        
        // Calculate metrics
        metric.totalTrips = trips.length;
        metric.totalBookings = bookings.length;
        metric.totalRevenue = successfulBookings.reduce((acc, b) => acc + b.totalPrice, 0);
        metric.averageRating = ratings.length > 0 ? 
          ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : null;
      }
      
      return baseMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      appLogger.error(`Error in getOperatorPerformanceMetrics: ${error.message}`);
      throw error;
    }
  }


  async getPopularRoutes(startDate, endDate, limit = 10) {
    try {
      return await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'trips',
            localField: 'tripId',
            foreignField: '_id',
            as: 'trip'
          }
        },
        {
          $unwind: '$trip'
        },
        {
          $group: {
            _id: {
              source: '$trip.source',
              destination: '$trip.destination'
            },
            bookingCount: { $sum: 1 },
            passengersCount: { $sum: { $size: '$seats' } },
            revenue: { 
              $sum: { 
                $cond: [{ $eq: ['$paymentStatus', 'success'] }, '$totalPrice', 0] 
              } 
            }
          }
        },
        {
          $sort: { bookingCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            _id: 0,
            route: { $concat: ['$_id.source', ' to ', '$_id.destination'] },
            source: '$_id.source',
            destination: '$_id.destination',
            bookingCount: 1,
            passengersCount: 1,
            revenue: 1
          }
        }
      ]);
    } catch (error) {
      appLogger.error(`Error in getPopularRoutes: ${error.message}`);
      throw error;
    }
  }

  async getSystemStatistics(startDate, endDate) {
    try {
      const userStats = await User.aggregate([
        {
          $facet: {
            'total': [
              { $match: { createdAt: { $lte: endDate } } },
              { $count: 'count' }
            ],
            'new': [
              { 
                $match: { 
                  createdAt: { 
                    $gte: startDate, 
                    $lte: endDate 
                  } 
                } 
              },
              { $count: 'count' }
            ],
            'byRole': [
              { $match: { createdAt: { $lte: endDate } } },
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  role: '$_id',
                  count: 1
                }
              }
            ]
          }
        }
      ]);
      
      const busStats = await Bus.aggregate([
        {
          $facet: {
            'total': [
              { $count: 'count' }
            ],
            'byType': [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  type: { $ifNull: ['$_id', 'unknown'] },
                  count: 1
                }
              }
            ]
          }
        }
      ]);
      
      const tripStats = await Trip.aggregate([
        {
          $facet: {
            'total': [
              { $count: 'count' }
            ],
            'inDateRange': [
              { 
                $match: { 
                  departureTime: { 
                    $gte: startDate, 
                    $lte: endDate 
                  } 
                } 
              },
              { $count: 'count' }
            ]
          }
        }
      ]);
      
      const bookingStats = await Booking.aggregate([
        {
          $facet: {
            'total': [
              { $count: 'count' }
            ],
            'inDateRange': [
              { 
                $match: { 
                  createdAt: { 
                    $gte: startDate, 
                    $lte: endDate 
                  } 
                } 
              },
              { $count: 'count' }
            ],
            'byStatus': [
              { 
                $match: { 
                  createdAt: { 
                    $gte: startDate, 
                    $lte: endDate 
                  } 
                } 
              },
              {
                $group: {
                  _id: '$paymentStatus',
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  status: '$_id',
                  count: 1
                }
              }
            ],
            'revenue': [
              { 
                $match: { 
                  createdAt: { 
                    $gte: startDate, 
                    $lte: endDate 
                  },
                  paymentStatus: 'success'
                } 
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$totalPrice' },
                  discount: { $sum: { $ifNull: ['$discount', 0] } }
                }
              }
            ]
          }
        }
      ]);
      
      // Extract and format the results
      const totalUsers = userStats[0].total[0]?.count || 0;
      const newUsers = userStats[0].new[0]?.count || 0;
      const usersByRole = userStats[0].byRole.reduce((acc, role) => {
        acc[role.role] = role.count;
        return acc;
      }, {});
      
      const totalBuses = busStats[0].total[0]?.count || 0;
      const busesByType = busStats[0].byType.reduce((acc, bus) => {
        acc[bus.type] = bus.count;
        return acc;
      }, {});
      
      const totalTrips = tripStats[0].total[0]?.count || 0;
      const tripsInRange = tripStats[0].inDateRange[0]?.count || 0;
      
      const totalBookings = bookingStats[0].total[0]?.count || 0;
      const bookingsInRange = bookingStats[0].inDateRange[0]?.count || 0;
      const bookingsByStatus = bookingStats[0].byStatus.reduce((acc, status) => {
        acc[status.status] = status.count;
        return acc;
      }, {});
      
      const totalRevenue = bookingStats[0].revenue[0]?.total || 0;
      const totalDiscounts = bookingStats[0].revenue[0]?.discount || 0;
      
      const successfulBookings = bookingsByStatus['success'] || 0;
      const bookingSuccessRate = bookingsInRange > 0 ? (successfulBookings / bookingsInRange) * 100 : 0;
      
      return {
        totalUsers,
        newUsers,
        usersByRole,
        totalBuses,
        busesByType,
        totalTrips,
        tripsInRange,
        totalBookings,
        bookingsInRange,
        bookingsByStatus,
        successfulBookings,
        bookingSuccessRate,
        totalRevenue,
        totalDiscounts
      };
    } catch (error) {
      appLogger.error(`Error in getSystemStatistics: ${error.message}`);
      throw error;
    }
  }
}

export default new AnalyticsRepository();
