BEGIN;

DROP VIEW IF EXISTS v_weekly_garden_with_count;

ALTER TABLE weekly_garden
  RENAME COLUMN pot_image_url TO pot_image;

CREATE OR REPLACE VIEW v_weekly_garden_with_count AS
SELECT
  user_id,
  week_monday,
  pot_image,
  image1, image2, image3, image4, image5, image6, image7,
  ((image1 IS NOT NULL)::int
   + (image2 IS NOT NULL)::int
   + (image3 IS NOT NULL)::int
   + (image4 IS NOT NULL)::int
   + (image5 IS NOT NULL)::int
   + (image6 IS NOT NULL)::int
   + (image7 IS NOT NULL)::int) AS earned_count,
  created_at,
  updated_at
FROM weekly_garden;

COMMIT;