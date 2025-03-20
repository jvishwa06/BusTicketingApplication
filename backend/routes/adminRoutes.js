const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/reset-password', adminController.resetPassword);
router.get('/verify-email', adminController.verifyEmail);

module.exports = router;
