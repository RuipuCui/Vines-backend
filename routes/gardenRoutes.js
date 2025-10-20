const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/gardenController');

// protect all garden routes
router.use(auth);

// Daily check-in: add a flower to this week
router.post('/checkin', c.checkin);

// Get last 4 weeks of garden records (with earned_count)
// query: none (user inferred from auth)
router.get('/recent', c.getRecentGardens);

// Get the current week's garden (Mon..Sun)
router.get('/week', c.getThisWeekGarden);

// Get friends who checked in today (Daily Snapshot)
router.get('/friends-today', c.getFriendsToday);

// Get any user's current week garden (no friend check)
router.get('/user/:userId/week', c.getUserThisWeek);

module.exports = router;