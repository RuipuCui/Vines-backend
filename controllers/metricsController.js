// controllers/metricsController.js
const {
  upsertDeviceMetrics,
  upsertManyDeviceMetrics,
  getDeviceMetricsByDate,
  getDeviceMetricsRange,
  deleteDeviceMetricsByDate,
} = require('../models/metricsModel');

// Consistent with friend module, try to get userId (TEXT) from req.auth
const meId = (req) => req?.auth?.userId || req?.user?.id || req?.user?.user_id;

const isYYYYMMDD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

/**
 * Single day upsert (idempotent)
 * POST /metrics/device
 * body: { user_id, local_date, screen_time_minutes, unlock_count }
 */
exports.postDevice = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const {
      user_id,
      local_date,
      screen_time_minutes,
      unlock_count = null,
    } = req.body || {};

    if (!user_id || !local_date) {
      return res.status(400).json({ error: 'user_id & local_date required' });
    }
    if (String(me) !== String(user_id)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (!isYYYYMMDD(local_date)) {
      return res.status(400).json({ error: 'local_date must be YYYY-MM-DD' });
    }

    const row = await upsertDeviceMetrics({
      userId: String(user_id),
      localDate: local_date,
      screenTimeMinutes: screen_time_minutes,
      unlockCount: unlock_count,
    });

    return res.json(row);
  } catch (e) {
    return res.status(400).json({ error: 'invalid payload' });
  }
};

/**
 * Batch upsert (idempotent)
 * POST /metrics/device/batch
 * body: { rows: [{ user_id, local_date, screen_time_minutes, unlock_count? }, ...] } or array directly
 */
exports.postDeviceBatch = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const payload = Array.isArray(req.body?.rows) ? req.body.rows
                   : Array.isArray(req.body)     ? req.body
                   : null;
    if (!payload || payload.length === 0) {
      return res.status(400).json({ error: 'rows required' });
    }

    // Validate user_id ownership and date format
    for (const r of payload) {
      if (!r.user_id || String(r.user_id) !== String(me)) {
        return res.status(403).json({ error: 'forbidden: mixed or missing user_id' });
      }
      if (!r.local_date || !isYYYYMMDD(r.local_date)) {
        return res.status(400).json({ error: 'local_date must be YYYY-MM-DD' });
      }
    }

    const rows = await upsertManyDeviceMetrics(
      payload.map((r) => ({
        userId: String(r.user_id),
        localDate: r.local_date,
        screenTimeMinutes: r.screen_time_minutes,
        unlockCount: r.unlock_count ?? null,
      }))
    );

    return res.json({ count: rows.length, rows });
  } catch (e) {
    return res.status(400).json({ error: 'invalid payload' });
  }
};

/**
 * Get metrics for a specific date
 * GET /metrics/device/:date
 */
exports.getByDate = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const date = req.params.date;
    if (!isYYYYMMDD(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const row = await getDeviceMetricsByDate(String(me), date);
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.json(row);
  } catch {
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * Get metrics for a range
 * GET /metrics/device?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Defaults to last 14 days if missing
 */
exports.getRange = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const { from, to } = req.query || {};
    let fromDate = from;
    let toDate = to;

    if (!fromDate || !toDate) {
      const today = new Date();
      const d14 = new Date(today);
      d14.setDate(today.getDate() - 13); // 14 days total
      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
      fromDate = fmt(d14);
      toDate = fmt(today);
    }

    if (!isYYYYMMDD(fromDate) || !isYYYYMMDD(toDate)) {
      return res.status(400).json({ error: 'from/to must be YYYY-MM-DD' });
    }

    const rows = await getDeviceMetricsRange(String(me), fromDate, toDate);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * Delete metrics for a specific date
 */
exports.deleteByDate = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const date = req.params.date;
    if (!isYYYYMMDD(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const row = await deleteDeviceMetricsByDate(String(me), date);
    if (!row) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'server error' });
  }
};