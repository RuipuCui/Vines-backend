const Gps = require('../models/gpsModel');

function isISODate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

exports.saveSummary = async (req, res) => {
  try {
    const userId = req.user && (req.user.user_id || req.user.id || req.user.uid);
    if (!userId) return res.status(401).json({ error: 'unauthorised, login required' });

    const { local_date, location_variance } = req.body || {};

    if (!isISODate(local_date)) {
      return res.status(400).json({ error: 'local_date needs to follow YYYY-MM-DD format' });
    }

    const varianceNum = Number(location_variance);
    if (!Number.isFinite(varianceNum)) {
      return res.status(400).json({ error: 'location_variance needs to be a number' });
    }

    const row = await Gps.upsertSummary(userId, local_date, varianceNum);
    return res.status(200).json({ message: 'saved successfully', data: row });
  } catch (err) {
    console.error('saveSummary error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user && (req.user.user_id || req.user.id || req.user.uid);
    if (!userId) return res.status(401).json({ error: 'unauthorised, login required' });

    const { date, from, to } = req.query || {};

    // Query one day
    if (date) {
      if (!isISODate(date)) return res.status(400).json({ error: 'date needs to follow YYYY-MM-DD format' });
      const row = await Gps.getSummaryByDate(userId, date);
      return res.json({ date, data: row || null });
    }

    // Query a period of time
    const fromDate = from;
    const toDate = to;
    if (fromDate && !isISODate(fromDate)) return res.status(400).json({ error: 'from needs to follow YYYY-MM-DD format' });
    if (toDate && !isISODate(toDate)) return res.status(400).json({ error: 'to needs to follow YYYY-MM-DD format' });

    // Query the past 14 days
    let list;
    if (!fromDate && !toDate) {
      list = await Gps.listRecent(userId, 14);
    } else {
      list = await Gps.listByRange(userId, fromDate, toDate);
    }
    return res.json({ items: list });
  } catch (err) {
    console.error('getSummary error', err);
    return res.status(500).json({ error: '服务器错误' });
  }
};