const pool = require('../config/db');

const createDailyScore = async (userId, score_date, mental_health_score, mental_details) => {
  console.log("start uploading daily score");
  const query = `
    INSERT INTO daily_scores (user_id, score_date, mental_health_score, mental_details)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [userId, score_date, mental_health_score, mental_details];
  const res = await pool.query(query, values);
  return res.rows[0];
};

const updateDailyScore = async (userId, score_date, mental_health_score, mental_details) => {
  console.log("start updating daily score");
  const query = `
    UPDATE daily_scores
    SET mental_health_score = $3,
        mental_details = $4
    WHERE user_id = $1
      AND score_date = $2
    RETURNING *;
  `;
  const values = [userId, score_date, mental_health_score, mental_details];
  const res = await pool.query(query, values);
  return res.rows[0];
};


const getDailyScoresByDate = async(userId, score_date) => {
    console.log("start get daily score by date");
    let query = `
        SELECT * FROM daily_scores
        WHERE user_id = $1 AND score_date = $2
    `;
    const values = [userId, score_date];
    const res = await pool.query(query, values);
    return res.rows;
};

const getDailyScoresByDays = async(userId, days) => {
    const query = `
      SELECT *
      FROM daily_scores
      WHERE user_id = $1
        AND score_date >= (CURRENT_DATE - ($2::int - 1) * INTERVAL '1 day')
      ORDER BY score_date DESC
    `;
    const values = [userId, days];
    const res = await pool.query(query, values);
    return res.rows;
};

module.exports= {
    createDailyScore,
    getDailyScoresByDate,
    getDailyScoresByDays,
    updateDailyScore
}