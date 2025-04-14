import AnalyticsService from '../services/analyticsService.js';
import { appLogger } from '../utils/logger.js';

class AnalyticsController {
  static async getOperatorBookingReports(req, res) {
    try {
      const operatorId = req.user.id;
      const { startDate, endDate, groupBy } = req.query;
      
      const reports = await AnalyticsService.getBookingReportsByOperator(
        operatorId, 
        startDate, 
        endDate, 
        groupBy
      );
      
      appLogger.info(`Operator booking reports generated for operator: ${operatorId}`);
      res.status(200).json({
        success: true,
        message: 'Booking reports generated successfully',
        data: reports
      });
    } catch (error) {
      appLogger.error(`Error generating operator booking reports: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async getOperatorRevenueAnalysis(req, res) {
    try {
      const operatorId = req.user.id;
      const { startDate, endDate, groupBy } = req.query;
      
      const revenueData = await AnalyticsService.getRevenueAnalysisByOperator(
        operatorId,
        startDate,
        endDate,
        groupBy
      );
      
      appLogger.info(`Revenue analysis generated for operator: ${operatorId}`);
      res.status(200).json({
        success: true,
        message: 'Revenue analysis generated successfully',
        data: revenueData
      });
    } catch (error) {
      appLogger.error(`Error generating revenue analysis: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async getTripPerformanceAndFeedback(req, res) {
    try {
      const operatorId = req.user.id;
      const { startDate, endDate, tripId } = req.query;
      
      const tripPerformance = await AnalyticsService.getTripPerformanceByOperator(
        operatorId,
        startDate,
        endDate,
        tripId
      );
      
      appLogger.info(`Trip performance data generated for operator: ${operatorId}`);
      res.status(200).json({
        success: true,
        message: 'Trip performance data generated successfully',
        data: tripPerformance
      });
    } catch (error) {
      appLogger.error(`Error generating trip performance data: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  static async getUserActivityAnalytics(req, res) {
    try {
      const { startDate, endDate, groupBy } = req.query;
      
      const userAnalytics = await AnalyticsService.getUserActivityAnalytics(
        startDate,
        endDate,
        groupBy
      );
      
      appLogger.info('User activity analytics generated');
      res.status(200).json({
        success: true,
        message: 'User activity analytics generated successfully',
        data: userAnalytics
      });
    } catch (error) {
      appLogger.error(`Error generating user activity analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async getOperatorActivityAnalytics(req, res) {
    try {
      const { startDate, endDate, groupBy } = req.query;
      
      const operatorAnalytics = await AnalyticsService.getOperatorActivityAnalytics(
        startDate,
        endDate,
        groupBy
      );
      
      appLogger.info('Operator activity analytics generated');
      res.status(200).json({
        success: true,
        message: 'Operator activity analytics generated successfully',
        data: operatorAnalytics
      });
    } catch (error) {
      appLogger.error(`Error generating operator activity analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async getSystemAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const systemAnalytics = await AnalyticsService.getSystemAnalytics(
        startDate,
        endDate
      );
      
      appLogger.info('System analytics generated');
      res.status(200).json({
        success: true,
        message: 'System analytics generated successfully',
        data: systemAnalytics
      });
    } catch (error) {
      appLogger.error(`Error generating system analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  static async getPopularRoutesAnalytics(req, res) {
    try {
      const { startDate, endDate, limit } = req.query;
      
      const routesAnalytics = await AnalyticsService.getPopularRoutesAnalytics(
        startDate,
        endDate,
        limit
      );
      
      appLogger.info('Popular routes analytics generated');
      res.status(200).json({
        success: true,
        message: 'Popular routes analytics generated successfully',
        data: routesAnalytics
      });
    } catch (error) {
      appLogger.error(`Error generating popular routes analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

export default AnalyticsController;
