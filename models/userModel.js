const db = require('../config/db');

const User = {
  async findByEmail(email) {
    const { rows } = await db.query(
            'SELECT user_id, username, email, icon_url, created_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT user_id, username, email, created_at FROM users WHERE user_id = $1',
      [id]
    );
    return rows[0];
  },

  async create({ uid, username, email, iconUrl }) {
    const { rows } = await db.query(
      `INSERT INTO users (user_id, username, email, icon_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE
        SET username = COALESCE(EXCLUDED.username, users.username),
            email    = COALESCE(EXCLUDED.email, users.email),
            icon_url = COALESCE(EXCLUDED.icon_url, users.icon_url)
      RETURNING user_id, username, email, created_at, icon_url`,
      [uid, username, email, iconUrl]
    );
    return rows[0];
  }
};

module.exports = User;