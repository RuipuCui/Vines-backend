const db = require('../config/db');

const User = {
  // Find user by email
  async findByEmail(email) {
    const { rows } = await db.query(
      `
        SELECT user_id, username, display_name, email, icon_url, birthday, phone, created_at
          FROM users
         WHERE email = $1
      `,
      [email]
    );
    return rows[0];
  },

  // Find user by ID
  async findById(id) {
    const { rows } = await db.query(
      `
        SELECT user_id, username, display_name, email, icon_url, birthday, phone, created_at
          FROM users
         WHERE user_id = $1
      `,
      [id]
    );
    return rows[0];
  },

  // Create or upsert user (used by Firebase auth)
  async create({ uid, username, email, iconUrl, display_name, birthday, phone }) {
    const { rows } = await db.query(
      `
        INSERT INTO users (user_id, username, display_name, email, icon_url, birthday, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING user_id, username, display_name, email, icon_url, birthday, phone, created_at
      `,
      [uid, username, display_name, email, iconUrl, birthday, phone]
    );
    return rows[0] || null;
  }
};

module.exports = User;