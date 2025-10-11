const db = require('../config/db');

// Insert or update flower for a specific day within the week
exports.checkin = async (userId, date, flowerUrl, potUrl = null) => {
  const query = `
    WITH params AS (
      SELECT
        $1::text AS uid,
        (date_trunc('week', $2::timestamp))::date AS wm,   -- Monday of that week
        EXTRACT(ISODOW FROM $2::date)::int AS dow,         -- day of week (1-7)
        $3::text AS furl,
        $4::text AS purl
    )
    INSERT INTO weekly_garden AS wg (
      user_id, week_monday, pot_image_url,
      image1, image2, image3, image4, image5, image6, image7
    )
    SELECT
      uid, wm,
      NULLIF(purl, '') AS pot_image_url,
      CASE WHEN dow=1 THEN furl END AS image1,
      CASE WHEN dow=2 THEN furl END AS image2,
      CASE WHEN dow=3 THEN furl END AS image3,
      CASE WHEN dow=4 THEN furl END AS image4,
      CASE WHEN dow=5 THEN furl END AS image5,
      CASE WHEN dow=6 THEN furl END AS image6,
      CASE WHEN dow=7 THEN furl END AS image7
    FROM params
    ON CONFLICT (user_id, week_monday) DO UPDATE
    SET
      pot_image_url = COALESCE(wg.pot_image_url, EXCLUDED.pot_image_url),
      image1 = COALESCE(wg.image1, CASE WHEN EXCLUDED.image1 IS NOT NULL THEN EXCLUDED.image1 END),
      image2 = COALESCE(wg.image2, CASE WHEN EXCLUDED.image2 IS NOT NULL THEN EXCLUDED.image2 END),
      image3 = COALESCE(wg.image3, CASE WHEN EXCLUDED.image3 IS NOT NULL THEN EXCLUDED.image3 END),
      image4 = COALESCE(wg.image4, CASE WHEN EXCLUDED.image4 IS NOT NULL THEN EXCLUDED.image4 END),
      image5 = COALESCE(wg.image5, CASE WHEN EXCLUDED.image5 IS NOT NULL THEN EXCLUDED.image5 END),
      image6 = COALESCE(wg.image6, CASE WHEN EXCLUDED.image6 IS NOT NULL THEN EXCLUDED.image6 END),
      image7 = COALESCE(wg.image7, CASE WHEN EXCLUDED.image7 IS NOT NULL THEN EXCLUDED.image7 END)
    RETURNING *;
  `;
  const { rows } = await db.query(query, [userId, date, flowerUrl, potUrl]);
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