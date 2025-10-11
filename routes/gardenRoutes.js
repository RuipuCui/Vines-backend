const express = require('express');
const router = express.Router();
const { checkin, getRecentGardens } = require('../controllers/gardenController');
const { authenticateToken } = require('../middleware/auth');

// Daily check-in: earn a flower
router.post('/checkin', authenticateToken, checkin);

// Fetch garden data for the last month (4 weeks)
router.get('/recent', authenticateToken, getRecentGardens);

module.exports = router;