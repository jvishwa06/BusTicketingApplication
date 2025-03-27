const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile }  = require('../controllers/operatorController');
const { authenticateOperatorandUser } = require('../middleware/authMiddleware');

router.get('/profile',authenticateOperatorandUser,  getUserProfile);
router.put('/profile',authenticateOperatorandUser, updateUserProfile);

module.exports = router;