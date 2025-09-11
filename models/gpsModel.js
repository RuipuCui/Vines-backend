const db = require('../config/db');

const Gps = {
  async upsertSummary(userId, localDate, locationVariance) {
    const { rows } = await db.query(
      `INSERT INTO location_summary (user_id, local_date, location_variance)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, local_date)
       DO UPDATE SET location_variance = EXCLUDED.location_variance
       RETURNING user_id, local_date, location_variance`,
      [userId, localDate, locationVariance]
    );
    return rows[0];
  },

  async getSummaryByDate(userId, localDate) {
    const { rows } = await db.query(
      `SELECT user_id, local_date, location_variance
         FROM location_summary
        WHERE user_id = $1 AND local_date = $2`,
      [userId, localDate]
    );
    return rows[0];
  },

  async listByRange(userId, fromDate, toDate) {
    let sql = `SELECT user_id, local_date, location_variance
                 FROM location_summary
                WHERE user_id = $1`;
    const params = [userId];
    if (fromDate) { params.push(fromDate); sql += ` AND local_date >= $${params.length}`; }
    if (toDate)   { params.push(toDate);   sql += ` AND local_date <= $${params.length}`; }
    sql += ' ORDER BY local_date DESC';
    const { rows } = await db.query(sql, params);
    return rows;
  },

  async listRecent(userId, days = 14) {
    const { rows } = await db.query(
      `SELECT user_id, local_date, location_variance
         FROM location_summary
        WHERE user_id = $1 AND local_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY local_date DESC`,
      [userId]
    );
    return rows;
  }
};

module.exports = Gps;