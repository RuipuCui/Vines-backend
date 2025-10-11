BEGIN;

-- users：以 Firebase UID 作为主键
CREATE TABLE IF NOT EXISTS users (
  user_id     TEXT PRIMARY KEY,           -- Firebase UID
  username    VARCHAR(50) UNIQUE,
  email       VARCHAR(100) UNIQUE,
  icon_url    TEXT,                        -- 头像地址
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- friendships：双向好友关系
CREATE TABLE IF NOT EXISTS friendships (
  requester_id  TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  addressee_id  TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status        VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_pk PRIMARY KEY (requester_id, addressee_id)
);

-- media_uploads：媒体上传记录（仅展示与 user_id/FK 相关的关键行）
CREATE TABLE IF NOT EXISTS media_uploads (
  upload_id   BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  s3_url      TEXT NOT NULL,
  media_type  VARCHAR(30) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- device_metrics：设备使用指标（按 user_id + local_date 去重）
CREATE TABLE IF NOT EXISTS device_metrics (
  user_id               TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  local_date            DATE NOT NULL,
  screen_time_seconds   INTEGER NOT NULL DEFAULT 0 CHECK (screen_time_seconds >= 0),
  unlock_count          INTEGER NOT NULL DEFAULT 0 CHECK (unlock_count >= 0),
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT device_metrics_pk PRIMARY KEY (user_id, local_date)
);

-- location_summary：定位汇总（只确保 user_id 类型/外键）
CREATE TABLE IF NOT EXISTS location_summary (
  user_id     TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  local_date  DATE NOT NULL,
  -- 你原 schema 中的汇总字段放在这里（例如 stay_minutes、distance_m、poi_summary 等）
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT location_summary_pk PRIMARY KEY (user_id, local_date)
);

-- daily_scores：心理分（按日去重）
CREATE TABLE IF NOT EXISTS daily_scores (
  user_id               TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  score_date            DATE NOT NULL,
  mental_health_score   INTEGER CHECK (mental_health_score BETWEEN 0 AND 100),
  mental_details        JSONB,
  CONSTRAINT daily_scores_pk PRIMARY KEY (user_id, score_date)
);

COMMIT;