// routes/metricsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/metricsController');

router.use(auth);

// Single day upsert (idempotent)
router.post('/device', c.postDevice);

// Batch upsert (idempotent)
router.post('/device/batch', c.postDeviceBatch);

// Get Metrics：Range or Single day
router.get('/device', c.getRange);
router.get('/device/:date', c.getByDate);

// Delete metrics for a specific date
router.delete('/device/:date', c.deleteByDate);

module.exports = router;