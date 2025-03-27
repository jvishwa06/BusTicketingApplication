const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController.js');
const { authenticateOperatorandUser } = require('../middleware/authMiddleware');

router.get('/profile', authenticateOperatorandUser, getUserProfile);
router.put('/profile',authenticateOperatorandUser, updateUserProfile);

module.exports = router;
