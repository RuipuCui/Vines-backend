const express = require('express');
const router = express.Router();
const dailyScoreController = require('../controllers/dailyScoreController');

const auth = require('../middleware/auth');     // jwt middleware


router.post('/upload', auth,  dailyScoreController.uploadUserDailyScore);
router.get('/get', auth,  dailyScoreController.getUserDailyScore);


module.exports = router;
