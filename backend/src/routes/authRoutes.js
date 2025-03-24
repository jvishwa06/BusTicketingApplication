const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

router.post('/user/register', AuthController.registerUser);
router.post('/user/login', AuthController.loginUser);
router.post('/user/forgot-password', AuthController.forgotPassword);
router.post('/user/reset-password', AuthController.resetPassword);

router.get('/verify-email', AuthController.verifyEmail);

router.post('/admin/register', AuthController.registerAdmin);
router.post('/admin/login', AuthController.loginAdmin);
router.post('/admin/forgot-password', AuthController.forgotPassword);
router.post('/admin/reset-password', AuthController.resetPassword);

router.post('/operator/register', AuthController.registerOperator);
router.post('/operator/login', AuthController.loginOperator);
router.post('/operator/forgot-password', AuthController.forgotPassword);
router.post('/operator/reset-password', AuthController.resetPassword);

router.get('/operator/approve', AuthController.approveOperator);
router.get('/operator/reject', AuthController.rejectOperator);

module.exports = router;