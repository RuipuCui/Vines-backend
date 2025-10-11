const Garden = require('../models/gardenModel');

// Handle daily check-in: add a flower to this week
exports.checkin = async (req, res) => {
  try {
    const userId = req.user.user_id; // injected from Firebase middleware
    const { date, flower_url, pot_url } = req.body;

    if (!date || !flower_url)
      return res.status(400).json({ error: 'date and flower_url are required' });

    const result = await Garden.checkin(userId, date, flower_url, pot_url);
    res.status(200).json({ message: 'Check-in recorded successfully', data: result });
  } catch (err) {
    console.error('Garden check-in error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Retrieve the last 4 weeks of garden records
exports.getRecentGardens = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const gardens = await Garden.getRecentGardens(userId);
    res.status(200).json(gardens);
  } catch (err) {
    console.error('Get garden records error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};