const db = require('../config/db');

const User = {
  async findByEmail(email) {
    const { rows } = await db.query(
      'SELECT user_id, username, email, password_hash, created_at FROM users WHERE email = $1',
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

  async create({ username, email, passwordHash }) {
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id, username, email, created_at`,
      [username, email, passwordHash]
    );
    return rows[0];
  }
};

module.exports = User;