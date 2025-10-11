BEGIN;

-- Weekly garden table (one pot + 7 flowers per week)
CREATE TABLE IF NOT EXISTS weekly_garden (
  user_id        TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  week_monday    DATE NOT NULL,              -- Monday of the week (ISO week start)
  pot_image_url  TEXT,                       -- pot image URL
  image1         TEXT,                       -- Monday flower
  image2         TEXT,                       -- Tuesday flower
  image3         TEXT,                       -- Wednesday flower
  image4         TEXT,                       -- Thursday flower
  image5         TEXT,                       -- Friday flower
  image6         TEXT,                       -- Saturday flower
  image7         TEXT,                       -- Sunday flower
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weekly_garden_pk PRIMARY KEY (user_id, week_monday)
);

-- Trigger: automatically update the updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_timestamp_weekly_garden'
  ) THEN
    CREATE OR REPLACE FUNCTION set_timestamp_weekly_garden()
    RETURNS trigger AS $f$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $f$ LANGUAGE plpgsql;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_timestamp_weekly_garden'
  ) THEN
    CREATE TRIGGER trg_set_timestamp_weekly_garden
    BEFORE UPDATE ON weekly_garden
    FOR EACH ROW EXECUTE FUNCTION set_timestamp_weekly_garden();
  END IF;
END$$;

-- View: show weekly garden with total earned flowers count
CREATE OR REPLACE VIEW v_weekly_garden_with_count AS
SELECT
  user_id,
  week_monday,
  pot_image_url,
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