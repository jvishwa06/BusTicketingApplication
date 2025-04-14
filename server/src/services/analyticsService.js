import AnalyticsRepository from '../repositories/analyticsRepository.js';
import BookingRepository from '../repositories/bookingRepository.js';
import TripRepository from '../repositories/tripRepository.js';
import UserRepository from '../repositories/userRepository.js';
import BusRepository from '../repositories/busRepository.js';
import RatingRepository from '../repositories/ratingRepository.js';
import { appLogger } from '../utils/logger.js';

class AnalyticsService {
  async getBookingReportsByOperator(operatorId, startDate, endDate, groupBy = 'daily') {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const buses = await BusRepository.getBusesByOperator(operatorId);
      const busIds = buses.map(bus => bus._id);
      
      const trips = await TripRepository.getTripsByBusIds(busIds);
      const tripIds = trips.map(trip => trip._id);
      
      const bookings = await AnalyticsRepository.getBookingsByTripIds(tripIds);
      
      const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
      
      const groupedData = this._groupDataByTimeFrame(filteredBookings, groupBy);
      
      const totalBookings = filteredBookings.length;
      const totalSeats = filteredBookings.reduce((acc, booking) => acc + booking.seats.length, 0);
      const totalRevenue = filteredBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
      const successfulBookings = filteredBookings.filter(b => b.paymentStatus === 'success').length;
      const pendingBookings = filteredBookings.filter(b => b.paymentStatus === 'pending').length;
      const cancelledBookings = filteredBookings.filter(b => b.paymentStatus === 'failed').length;
      
      return {
        totalBookings,
        totalSeats,
        totalRevenue,
        successfulBookings,
        pendingBookings,
        cancelledBookings,
        bookingTrends: groupedData,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getBookingReportsByOperator: ${error.message}`);
      throw error;
    }
  }


  async getRevenueAnalysisByOperator(operatorId, startDate, endDate, groupBy = 'daily') {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const buses = await BusRepository.getBusesByOperator(operatorId);
      const busIds = buses.map(bus => bus._id);
      
      const trips = await TripRepository.getTripsByBusIds(busIds);
      const tripIds = trips.map(trip => trip._id);
      
      const bookings = await AnalyticsRepository.getBookingsByTripIds(tripIds);
      const successfulBookings = bookings.filter(b => b.paymentStatus === 'success');
      
      const filteredBookings = successfulBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
      
      const groupedRevenueData = this._groupRevenueByTimeFrame(filteredBookings, groupBy);
      
      const revenueByBusType = {};
      for (const booking of filteredBookings) {
        const trip = trips.find(t => t._id.toString() === booking.tripId.toString());
        if (trip && trip.busId) {
          const bus = buses.find(b => b._id.toString() === trip.busId.toString());
          if (bus) {
            const busType = bus.type || 'unknown';
            revenueByBusType[busType] = (revenueByBusType[busType] || 0) + booking.totalPrice;
          }
        }
      }
      
      const revenueByRoute = {};
      for (const booking of filteredBookings) {
        const trip = trips.find(t => t._id.toString() === booking.tripId.toString());
        if (trip) {
          const route = `${trip.source} to ${trip.destination}`;
          revenueByRoute[route] = (revenueByRoute[route] || 0) + booking.totalPrice;
        }
      }
      
      const totalRevenue = filteredBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
      const totalBookings = filteredBookings.length;
      const averageRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const totalDiscounts = filteredBookings.reduce((acc, booking) => acc + (booking.discount || 0), 0);
      
      return {
        totalRevenue,
        totalBookings,
        averageRevenuePerBooking,
        totalDiscounts,
        revenueTrends: groupedRevenueData,
        revenueByBusType,
        revenueByRoute,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getRevenueAnalysisByOperator: ${error.message}`);
      throw error;
    }
  }


  async getTripPerformanceByOperator(operatorId, startDate, endDate, tripId = null) {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const buses = await BusRepository.getBusesByOperator(operatorId);
      const busIds = buses.map(bus => bus._id);
      
      let trips;
      if (tripId) {
        const specificTrip = await TripRepository.getTripById(tripId);
        trips = specificTrip && busIds.includes(specificTrip.busId.toString()) ? [specificTrip] : [];
      } else {
        trips = await TripRepository.getTripsByBusIds(busIds);
      }
      
      const filteredTrips = trips.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate >= start && tripDate <= end;
      });
      
      const tripPerformanceData = [];
      
      for (const trip of filteredTrips) {
        const tripBookings = await BookingRepository.getBookingsByTripId(trip._id);
        
        const tripRatings = await RatingRepository.getRatingsByTripId(trip._id);
        
        const totalBookings = tripBookings.length;
        const totalSeats = tripBookings.reduce((acc, booking) => acc + booking.seats.length, 0);
        const occupancyRate = trip.busId && trip.busId.totalSeats ? 
                             (totalSeats / trip.busId.totalSeats) * 100 : 0;
        const revenue = tripBookings
                        .filter(b => b.paymentStatus === 'success')
                        .reduce((acc, booking) => acc + booking.totalPrice, 0);
        
        const avgRating = tripRatings.length > 0 ? 
                         tripRatings.reduce((acc, rating) => acc + rating.rating, 0) / tripRatings.length : 
                         null;
        
        const feedback = tripRatings.map(rating => ({
          rating: rating.rating,
          comment: rating.comment,
          createdAt: rating.createdAt
        }));
        
        tripPerformanceData.push({
          tripId: trip._id,
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          busType: trip.busId ? trip.busId.type : 'unknown',
          totalBookings,
          totalSeats,
          occupancyRate,
          revenue,
          averageRating: avgRating,
          feedback
        });
      }
      
      tripPerformanceData.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
      
      return {
        trips: tripPerformanceData,
        totalTrips: tripPerformanceData.length,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getTripPerformanceByOperator: ${error.message}`);
      throw error;
    }
  }

  async getUserActivityAnalytics(startDate, endDate, groupBy = 'daily') {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const users = await UserRepository.getAllUsers();
      const filteredUsers = users.filter(user => user.role === 'user');
      
      const filteredBookings = await AnalyticsRepository.getBookingsInDateRange(start, end);
      
      const newUsersByTimeFrame = this._groupUserRegistrationsByTimeFrame(filteredUsers, groupBy, start, end);
      
      const bookingsByTimeFrame = this._groupDataByTimeFrame(filteredBookings, groupBy);
      
      const totalUsers = filteredUsers.length;
      const activeUsers = new Set(filteredBookings.map(booking => booking.userId.toString())).size;
      const newUsers = filteredUsers.filter(user => {
        const registrationDate = new Date(user.createdAt);
        return registrationDate >= start && registrationDate <= end;
      }).length;
      
      const userBookingCounts = {};
      filteredBookings.forEach(booking => {
        // Extract the user ID properly, handling both string and object representations
        const userId = booking.userId && booking.userId._id ? booking.userId._id.toString() : 
                     (booking.userId ? booking.userId.toString() : 'unknown');
        userBookingCounts[userId] = (userBookingCounts[userId] || 0) + 1;
      });
      
      const topUsersByBookingCount = Object.entries(userBookingCounts)
        .map(([userId, count]) => {
          // Find the user by ID in the users array
          const user = users.find(u => u._id.toString() === userId);
          return {
            userId: userId, // Just the string ID
            name: user ? user.name : 'Unknown',
            email: user ? user.email : 'Unknown',
            bookingCount: count
          };
        })
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 10);
      
      const userSpending = {};
      filteredBookings
        .filter(booking => booking.paymentStatus === 'success')
        .forEach(booking => {
          // Extract the user ID properly, handling both string and object representations
          const userId = booking.userId && booking.userId._id ? booking.userId._id.toString() : 
                       (booking.userId ? booking.userId.toString() : 'unknown');
          userSpending[userId] = (userSpending[userId] || 0) + booking.totalPrice;
        });
      
      const topUsersBySpending = Object.entries(userSpending)
        .map(([userId, spending]) => {
          // Find the user by ID in the users array
          const user = users.find(u => u._id.toString() === userId);
          return {
            userId: userId, // Just the string ID
            name: user ? user.name : 'Unknown',
            email: user ? user.email : 'Unknown',
            totalSpending: spending
          };
        })
        .sort((a, b) => b.totalSpending - a.totalSpending)
        .slice(0, 10);
      
      return {
        totalUsers,
        activeUsers,
        newUsers,
        userRegistrationTrend: newUsersByTimeFrame,
        bookingActivityTrend: bookingsByTimeFrame,
        topUsersByBookingCount,
        topUsersBySpending,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getUserActivityAnalytics: ${error.message}`);
      throw error;
    }
  }

  async getOperatorActivityAnalytics(startDate, endDate, groupBy = 'daily') {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const users = await UserRepository.getAllUsers();
      const operators = users.filter(user => user.role === 'operator');
      
      const buses = await BusRepository.getAllBuses();
      
      const trips = await TripRepository.getAllTrips();
      const filteredTrips = trips.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate >= start && tripDate <= end;
      });
      
      const allBookings = await BookingRepository.getAllBookings();
      const filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
      
      const operatorMetrics = [];
      for (const operator of operators) {
        const operatorBuses = buses.filter(bus => 
          bus.operatorId && bus.operatorId.toString() === operator._id.toString()
        );
        const busIds = operatorBuses.map(bus => bus._id);
        
        const operatorTrips = trips.filter(trip => 
          trip.busId && busIds.includes(trip.busId.toString())
        );
        const tripIds = operatorTrips.map(trip => trip._id);
        
        const operatorBookings = allBookings.filter(booking => 
          booking.tripId && tripIds.includes(booking.tripId.toString())
        );
        
        const filteredOperatorBookings = operatorBookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= start && bookingDate <= end;
        });
        
        const totalBuses = operatorBuses.length;
        const totalTrips = operatorTrips.length;
        const totalBookings = filteredOperatorBookings.length;
        const totalRevenue = filteredOperatorBookings
          .filter(b => b.paymentStatus === 'success')
          .reduce((acc, booking) => acc + booking.totalPrice, 0);
        
        const ratings = [];
        for (const tripId of tripIds) {
          const tripRatings = await RatingRepository.getRatingsByTripId(tripId);
          ratings.push(...tripRatings);
        }
        
        const avgRating = ratings.length > 0 ? 
          ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : null;
        
        operatorMetrics.push({
          operatorId: operator._id,
          name: operator.name,
          email: operator.email,
          totalBuses,
          totalTrips,
          totalBookings,
          totalRevenue,
          averageRating: avgRating
        });
      }
      
      operatorMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      const routePerformance = {};
      for (const trip of filteredTrips) {
        const route = `${trip.source} to ${trip.destination}`;
        const tripBookings = filteredBookings.filter(b => 
          b.tripId && b.tripId.toString() === trip._id.toString()
        );
        
        const bookingCount = tripBookings.length;
        const revenue = tripBookings
          .filter(b => b.paymentStatus === 'success')
          .reduce((acc, b) => acc + b.totalPrice, 0);
        
        if (!routePerformance[route]) {
          routePerformance[route] = { bookings: 0, revenue: 0 };
        }
        
        routePerformance[route].bookings += bookingCount;
        routePerformance[route].revenue += revenue;
      }
      
      const topRoutes = Object.entries(routePerformance)
        .map(([route, metrics]) => ({
          route,
          bookings: metrics.bookings,
          revenue: metrics.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      return {
        totalOperators: operators.length,
        operatorMetrics,
        topRoutes,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getOperatorActivityAnalytics: ${error.message}`);
      throw error;
    }
  }


  async getSystemAnalytics(startDate, endDate) {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      
      const users = await UserRepository.getAllUsers();
      const filteredUsers = users.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt <= end;
      });
      
      const usersByRole = {
        user: filteredUsers.filter(user => user.role === 'user').length,
        operator: filteredUsers.filter(user => user.role === 'operator').length,
        admin: filteredUsers.filter(user => user.role === 'admin').length
      };
      
      const buses = await BusRepository.getAllBuses();
      const busesByType = {};
      buses.forEach(bus => {
        const busType = bus.type || 'unknown';
        busesByType[busType] = (busesByType[busType] || 0) + 1;
      });
      
      const trips = await TripRepository.getAllTrips();
      const filteredTrips = trips.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate >= start && tripDate <= end;
      });
      
      const allBookings = await BookingRepository.getAllBookings();
      const filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });

      const totalUsers = filteredUsers.length;
      const totalBuses = buses.length;
      const totalTrips = filteredTrips.length;
      const totalBookings = filteredBookings.length;
      const successfulBookings = filteredBookings.filter(b => b.paymentStatus === 'success').length;
      const totalRevenue = filteredBookings
        .filter(b => b.paymentStatus === 'success')
        .reduce((acc, b) => acc + b.totalPrice, 0);
      const totalDiscounts = filteredBookings
        .filter(b => b.discount && b.discount > 0)
        .reduce((acc, b) => acc + (b.discount || 0), 0);
      
      const bookingSuccessRate = totalBookings > 0 ? (successfulBookings / totalBookings) * 100 : 0;
      
      const newUsers = filteredUsers.filter(user => {
        const registrationDate = new Date(user.createdAt);
        return registrationDate >= start && registrationDate <= end;
      }).length;
      
      return {
        totalUsers,
        usersByRole,
        totalBuses,
        busesByType,
        totalTrips,
        totalBookings,
        successfulBookings,
        bookingSuccessRate,
        totalRevenue,
        totalDiscounts,
        newUsers,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getSystemAnalytics: ${error.message}`);
      throw error;
    }
  }


  async getPopularRoutesAnalytics(startDate, endDate, limit = 10) {
    try {
      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      const limitNum = parseInt(limit) || 10;
      
      const trips = await TripRepository.getAllTrips();
      
      const allBookings = await BookingRepository.getAllBookings();
      const filteredBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= start && bookingDate <= end;
      });
      
      const routeMap = {};
      trips.forEach(trip => {
        const route = `${trip.source} to ${trip.destination}`;
        if (!routeMap[route]) {
          routeMap[route] = {
            source: trip.source,
            destination: trip.destination,
            tripIds: []
          };
        }
        routeMap[route].tripIds.push(trip._id.toString());
      });
      
      const routeMetrics = [];
      for (const [routeName, routeInfo] of Object.entries(routeMap)) {
        const routeBookings = filteredBookings.filter(booking => 
          booking.tripId && routeInfo.tripIds.includes(booking.tripId.toString())
        );
        
        const bookingCount = routeBookings.length;
        const revenue = routeBookings
          .filter(b => b.paymentStatus === 'success')
          .reduce((acc, b) => acc + b.totalPrice, 0);
        const passengersCount = routeBookings.reduce((acc, b) => acc + b.seats.length, 0);
        
        routeMetrics.push({
          route: routeName,
          source: routeInfo.source,
          destination: routeInfo.destination,
          bookingCount,
          passengersCount,
          revenue,
          tripsCount: routeInfo.tripIds.length
        });
      }
      
      routeMetrics.sort((a, b) => b.bookingCount - a.bookingCount);
      const topRoutesByBookings = routeMetrics.slice(0, limitNum);
      
      routeMetrics.sort((a, b) => b.revenue - a.revenue);
      const topRoutesByRevenue = routeMetrics.slice(0, limitNum);
      
      return {
        topRoutesByBookings,
        topRoutesByRevenue,
        startDate: start,
        endDate: end
      };
    } catch (error) {
      appLogger.error(`Error in getPopularRoutesAnalytics: ${error.message}`);
      throw error;
    }
  }


  _groupDataByTimeFrame(data, groupBy) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.createdAt);
      let key;
      
      switch(groupBy) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          count: 0,
          seats: 0,
          revenue: 0
        };
      }
      
      grouped[key].count += 1;
      grouped[key].seats += item.seats ? item.seats.length : 0;
      grouped[key].revenue += item.totalPrice || 0;
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }


  _groupRevenueByTimeFrame(bookings, groupBy) {
    const grouped = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      let key;
      
      switch(groupBy) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          revenue: 0,
          bookings: 0,
          discounts: 0
        };
      }
      
      grouped[key].revenue += booking.totalPrice || 0;
      grouped[key].bookings += 1;
      grouped[key].discounts += booking.discount || 0;
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }


  _groupUserRegistrationsByTimeFrame(users, groupBy, startDate, endDate) {
    const grouped = {};
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      let key;
      
      switch(groupBy) {
        case 'weekly':
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - currentDate.getDay());
          key = weekStart.toISOString().split('T')[0];
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'daily':
        default:
          key = currentDate.toISOString().split('T')[0];
          currentDate.setDate(currentDate.getDate() + 1);
          break;
      }
      
      grouped[key] = {
        period: key,
        count: 0
      };
    }
    
    users.forEach(user => {
      const date = new Date(user.createdAt);
      if (date < startDate || date > endDate) return;
      
      let key;
      
      switch(groupBy) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }
      
      if (grouped[key]) {
        grouped[key].count += 1;
      }
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }
}

export default new AnalyticsService();
