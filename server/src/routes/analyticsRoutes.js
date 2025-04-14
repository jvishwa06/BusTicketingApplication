import express from 'express';
import AnalyticsController from '../controllers/analyticsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/operator/booking-reports', authMiddleware.authorizeRoles('operator'),AnalyticsController.getOperatorBookingReports);
router.get('/operator/revenue', authMiddleware.authorizeRoles('operator'),AnalyticsController.getOperatorRevenueAnalysis);
router.get('/operator/trip-performance', authMiddleware.authorizeRoles('operator'),AnalyticsController.getTripPerformanceAndFeedback);

router.get('/admin/users', authMiddleware.authorizeRoles('admin'),AnalyticsController.getUserActivityAnalytics);
router.get('/admin/operators', authMiddleware.authorizeRoles('admin'),AnalyticsController.getOperatorActivityAnalytics);
router.get('/admin/system', authMiddleware.authorizeRoles('admin'),AnalyticsController.getSystemAnalytics);
router.get('/admin/popular-routes', authMiddleware.authorizeRoles('admin'),AnalyticsController.getPopularRoutesAnalytics);

export default router;