const Garden = require('../models/gardenModel');

// Daily check-in: store flower_name (string) into this week's correct day column.
exports.checkin = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { date: dateRaw, flower_name, pot_image } = req.body || {};

    // flower_name is required
    if (!flower_name || typeof flower_name !== 'string') {
      return res.status(400).json({ error: 'flower_name is required (string)' });
    }

    // date optional, default = today
    const date = normalizeDate(dateRaw);

    // Write flower_name to database (weekly_garden.imageN)
    const result = await Garden.checkin(
      userId,
      date,
      flower_name.trim(),
      (typeof pot_image === 'string' ? pot_image.trim() : null)
    );

    return res.status(200).json({
      message: 'Check-in recorded successfully',
      data: result,
    });
  } catch (err) {
    console.error('Garden check-in error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
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

// Compute Monday (ISO week start) for "today" in server local time.
function mondayOfThisWeek() {
  const d = new Date();
  // JS: 0=Sun,1=Mon,...6=Sat  -> convert so Mon=0
  const dow = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// GET /api/garden/week -> return only this week's record (Mon..Sun)
// Requires auth middleware to inject req.user.user_id
exports.getThisWeekGarden = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    // Ask the model for this week's garden (uses week_monday = current ISO Monday)
    if (typeof Garden.getThisWeekGarden !== 'function') {
      // Defensive: model method not implemented yet
      return res.status(501).json({ error: 'getThisWeekGarden not implemented in model' });
    }

    const row = await Garden.getThisWeekGarden(userId);

    if (row) {
      // Found a record for this week
      return res.status(200).json(row);
    }

    // No record yet this week -> return an empty shell for easier frontend rendering
    const weekMonday = mondayOfThisWeek();
    return res.status(200).json({
      user_id: userId,
      week_monday: weekMonday,
      pot_image: null,
      image1: null, image2: null, image3: null, image4: null,
      image5: null, image6: null, image7: null,
      earned_count: 0,
      created_at: null,
      updated_at: null
    });
  } catch (err) {
    console.error('Get this week garden error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/garden/friends-today
exports.getFriendsToday = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const friends = await Garden.getFriendsDailyCheckins(userId);
    return res.status(200).json(friends);
  } catch (err) {
    console.error('Get friends daily snapshot error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};