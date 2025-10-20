const db = require('../config/db');

// Insert or update flower for a specific day within the week
// models/gardenModel.js
const db = require('../config/db');

/**
 * Upsert a flower_name into the correct day column for the given date.
 * - userId: string
 * - date: 'YYYY-MM-DD'
 * - flowerName: e.g. 'camellia'
 * - potImage: e.g. 'pot1' (optional, set only once per week)
 */
exports.checkin = async (userId, date, flowerName, potImage = null) => {
  const q = `
    WITH params AS (
      SELECT
        $1::text  AS uid,
        (date_trunc('week', $2::date))::date AS wm,   -- Monday (ISO)
        EXTRACT(ISODOW FROM $2::date)::int  AS dow,   -- 1..7
        $3::text  AS flower,
        NULLIF($4::text, '') AS pimg
    )
    INSERT INTO weekly_garden AS wg (
      user_id, week_monday, pot_image,
      image1, image2, image3, image4, image5, image6, image7
    )
    SELECT
      uid, wm,
      pimg AS pot_image,
      CASE WHEN dow=1 THEN flower END AS image1,
      CASE WHEN dow=2 THEN flower END AS image2,
      CASE WHEN dow=3 THEN flower END AS image3,
      CASE WHEN dow=4 THEN flower END AS image4,
      CASE WHEN dow=5 THEN flower END AS image5,
      CASE WHEN dow=6 THEN flower END AS image6,
      CASE WHEN dow=7 THEN flower END AS image7
    FROM params
    ON CONFLICT (user_id, week_monday) DO UPDATE
    SET
      pot_image = COALESCE(wg.pot_image, EXCLUDED.pot_image),
      image1    = COALESCE(wg.image1, EXCLUDED.image1),
      image2    = COALESCE(wg.image2, EXCLUDED.image2),
      image3    = COALESCE(wg.image3, EXCLUDED.image3),
      image4    = COALESCE(wg.image4, EXCLUDED.image4),
      image5    = COALESCE(wg.image5, EXCLUDED.image5),
      image6    = COALESCE(wg.image6, EXCLUDED.image6),
      image7    = COALESCE(wg.image7, EXCLUDED.image7)
    RETURNING *;
  `;

  const params = [String(userId).trim(), date, String(flowerName).trim(), potImage];
  const { rows } = await db.query(q, params);
  return rows[0];
};

// Fetch garden records for the last 4 weeks
exports.getRecentGardens = async (userId) => {
  const query = `
    SELECT * FROM v_weekly_garden_with_count
    WHERE user_id = $1
      AND week_monday >= (date_trunc('week', (CURRENT_DATE - INTERVAL '28 days')::timestamp))::date
    ORDER BY week_monday DESC;
  `;
  const { rows } = await db.query(query, [userId]);
  return rows;
};

exports.getThisWeekGarden = async (userId) => {
  const q = `
    SELECT *
      FROM v_weekly_garden_with_count
     WHERE user_id = $1
       AND week_monday = (date_trunc('week', CURRENT_DATE::timestamp))::date
     LIMIT 1;
  `;
  const { rows } = await db.query(q, [userId]);
  return rows[0] || null;
};

// Get today's check-ins among friends (Daily Snapshot)
exports.getFriendsDailyCheckins = async (userId) => {
  const q = `
    WITH today AS (
      SELECT
        (date_trunc('week', CURRENT_DATE))::date AS week_monday,
        EXTRACT(ISODOW FROM CURRENT_DATE)::int AS dow
    )
    SELECT
      u.user_id,
      u.username,
      u.icon_url,
      CASE dow
        WHEN 1 THEN wg.image1
        WHEN 2 THEN wg.image2
        WHEN 3 THEN wg.image3
        WHEN 4 THEN wg.image4
        WHEN 5 THEN wg.image5
        WHEN 6 THEN wg.image6
        WHEN 7 THEN wg.image7
      END AS flower_url,
      CURRENT_DATE AS checked_in_at
    FROM friendships f
    JOIN users u ON u.user_id = f.friend_id
    JOIN weekly_garden wg
      ON wg.user_id = u.user_id
      AND wg.week_monday = (SELECT week_monday FROM today)
    JOIN today ON TRUE
    WHERE f.user_id = $1
      AND f.status = 'accepted'
      AND (
        CASE dow
          WHEN 1 THEN wg.image1
          WHEN 2 THEN wg.image2
          WHEN 3 THEN wg.image3
          WHEN 4 THEN wg.image4
          WHEN 5 THEN wg.image5
          WHEN 6 THEN wg.image6
          WHEN 7 THEN wg.image7
        END
      ) IS NOT NULL;
  `;
  const { rows } = await db.query(q, [userId]);
  return rows;
};