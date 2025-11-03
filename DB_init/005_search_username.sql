CREATE INDEX IF NOT EXISTS ix_users_username_lower
  ON users (lower(username));