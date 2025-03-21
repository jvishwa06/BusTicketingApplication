const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');

router.post('/register', operatorController.registerOperator);  
router.post('/login', operatorController.loginOperator);        
router.post('/forgot-password', operatorController.forgotPassword);  
router.post('/reset-password', operatorController.resetPassword);  
router.get('/verify-email', operatorController.verifyEmail);    
router.get('/admin-approve', operatorController.adminApprove);

module.exports = router;
