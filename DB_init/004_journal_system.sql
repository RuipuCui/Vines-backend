BEGIN;

-- for UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Diary entries
CREATE TABLE IF NOT EXISTS diary_entries (
  entry_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content      TEXT,                 -- free text (optional)
  mood         TEXT,                 -- e.g. 'happy', 'calm' ...
  media_url    TEXT,                 -- optional (image/video/file), keep simple for now
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_timestamp_diary_entries()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_timestamp_diary_entries ON diary_entries;
CREATE TRIGGER trg_set_timestamp_diary_entries
BEFORE UPDATE ON diary_entries
FOR EACH ROW EXECUTE FUNCTION set_timestamp_diary_entries();

CREATE INDEX IF NOT EXISTS ix_diary_entries_user_created
  ON diary_entries(user_id, created_at DESC);

-- 2) Reactions (Slack/WhatsApp style)
CREATE TABLE IF NOT EXISTS diary_reactions (
  entry_id   UUID NOT NULL REFERENCES diary_entries(entry_id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,  -- e.g. '👍' or ':heart:'; keep as text
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entry_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS ix_diary_reactions_entry ON diary_reactions(entry_id);

-- 3) Comments (text or emoji, at least one)
CREATE TABLE IF NOT EXISTS diary_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES diary_entries(entry_id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  body       TEXT,
  emoji      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT diary_comment_nonempty CHECK (
    body IS NOT NULL OR emoji IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION set_timestamp_diary_comments()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_timestamp_diary_comments ON diary_comments;
CREATE TRIGGER trg_set_timestamp_diary_comments
BEFORE UPDATE ON diary_comments
FOR EACH ROW EXECUTE FUNCTION set_timestamp_diary_comments();

CREATE INDEX IF NOT EXISTS ix_diary_comments_entry_created
  ON diary_comments(entry_id, created_at);

COMMIT;