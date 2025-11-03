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

  // Find all users by username (case-insensitive exact match)
  // NOTE: We intentionally return a minimal safe projection for search results.
  async searchByUsername(username) {
    const { rows } = await db.query(
      `
        SELECT user_id, username, display_name, icon_url
          FROM users
         WHERE username IS NOT NULL
           AND lower(username) = lower($1)
         ORDER BY user_id ASC
      `,
      [username]
    );
    return rows;
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
  },

  async updateUserIconUrl({uid, iconUrl}){
    const { rows } = await db.query(
      `
        UPDATE users
        SET icon_url = $1
        WHERE user_id = $2
        RETURNING user_id, username, display_name, email, icon_url, birthday, phone, created_at
        `,
      [iconUrl, uid] 
    );
    return rows[0] || null;
  },

  async getUserIcon({uid}){
    const { rows } = await db.query(
      `
        SELECT icon_url
          FROM users
         WHERE user_id = $1
      `,
      [uid]
    );
    return rows[0] || null;
  }   
};

module.exports = User;