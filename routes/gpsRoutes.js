const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const gpsController = require('../controllers/gpsController');

// Save the location summary（location_variance）
router.post('/summary', auth, gpsController.saveSummary);

// Look up the location summary
router.get('/summary', auth, gpsController.getSummary);

module.exports = router;