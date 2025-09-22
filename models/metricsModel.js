// models/metricsModel.js

const pool = require('../config/db');

// Helper for input validation
const assertDeviceMetricsInput = ({ userId, localDate, screenTimeMinutes, unlockCount }) => {
  if (!userId) throw new Error('userId required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(localDate))) throw new Error('localDate must be YYYY-MM-DD');
  const stm = Number(screenTimeMinutes);
  if (!Number.isFinite(stm) || stm < 0) throw new Error('screenTimeMinutes must be a non-negative number');
  if (unlockCount != null) {
    const uc = Number(unlockCount);
    if (!Number.isFinite(uc) || uc < 0) throw new Error('unlockCount must be a non-negative number');
  }
};

/**
 * Upsert device metrics for one day
 */
const upsertDeviceMetrics = async ({ userId, localDate, screenTimeMinutes, unlockCount = null }) => {
  assertDeviceMetricsInput({ userId, localDate, screenTimeMinutes, unlockCount });
  const query = `
    INSERT INTO device_metrics (user_id, local_date, screen_time_minutes, unlock_count)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, local_date) DO UPDATE SET
      screen_time_minutes = EXCLUDED.screen_time_minutes,
      unlock_count = EXCLUDED.unlock_count
    RETURNING *;
  `;
  const values = [userId, localDate, screenTimeMinutes, unlockCount];
  const res = await pool.query(query, values);
  return res.rows[0];
};

/**
 * Lookup device metrics of one day
 */
const getDeviceMetricsByDate = async (userId, localDate) => {
  const { rows } = await pool.query(
    `SELECT * FROM device_metrics WHERE user_id = $1 AND local_date = $2`,
    [userId, localDate]
  );
  return rows[0] || null;
};

/**
 * Get device metrics for a period
 */
const getDeviceMetricsRange = async (userId, fromDate, toDate) => {
  const { rows } = await pool.query(
    `SELECT * FROM device_metrics
       WHERE user_id = $1 AND local_date >= $2 AND local_date <= $3
       ORDER BY local_date ASC`,
    [userId, fromDate, toDate]
  );
  return rows;
};

/**
 * Delete device metrics for one day 
 */
const deleteDeviceMetricsByDate = async (userId, localDate) => {
  const { rows } = await pool.query(
    `DELETE FROM device_metrics WHERE user_id = $1 AND local_date = $2 RETURNING *`,
    [userId, localDate]
  );
  return rows[0] || null;
};


// Batch upsert helper
const upsertManyDeviceMetrics = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  // Validate all first
  rows.forEach(assertDeviceMetricsInput);
  const values = [];
  const placeholders = rows.map((r, i) => {
    const base = i * 4;
    values.push(r.userId, r.localDate, r.screenTimeMinutes, r.unlockCount ?? null);
    return `($${base+1}, $${base+2}, $${base+3}, $${base+4})`;
  }).join(',');
  const sql = `
    INSERT INTO device_metrics (user_id, local_date, screen_time_minutes, unlock_count)
    VALUES ${placeholders}
    ON CONFLICT (user_id, local_date) DO UPDATE SET
      screen_time_minutes = EXCLUDED.screen_time_minutes,
      unlock_count = EXCLUDED.unlock_count
    RETURNING *;
  `;
  const res = await pool.query(sql, values);
  return res.rows;
};

module.exports = {
  upsertDeviceMetrics,
  getDeviceMetricsByDate,
  getDeviceMetricsRange,
  deleteDeviceMetricsByDate,
  upsertManyDeviceMetrics,
};