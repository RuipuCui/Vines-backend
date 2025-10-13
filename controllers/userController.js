// controllers/userController.js
const db = require('../config/db');
const User = require('../models/userModel');

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const uid = req.user && (req.user.user_id || req.user.uid);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    const { rows } = await db.query(
      `
      SELECT user_id, username, display_name, email, icon_url, birthday, phone, created_at
        FROM users
       WHERE user_id = $1
       LIMIT 1
      `,
      [uid]
    );

    if (!rows[0]) return res.status(404).json({ error: 'user not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getMe error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const uid = req.user && (req.user.user_id || req.user.uid);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    // Accept partial updates
    const {
      username,
      display_name,
      email,
      icon_url,
      birthday,   // YYYY-MM-DD
      phone
    } = req.body || {};

    // --- validations ---
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0 || username.length > 50) {
        return res.status(400).json({ error: 'username must be 1-50 chars' });
      }
    }
    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 100) {
        return res.status(400).json({ error: 'display_name must be string (<=100 chars)' });
      }
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'email must be a valid email string' });
      }
    }
    if (icon_url !== undefined && typeof icon_url !== 'string') {
      return res.status(400).json({ error: 'icon_url must be string' });
    }
    if (birthday !== undefined) {
      if (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
        return res.status(400).json({ error: 'birthday must be YYYY-MM-DD' });
      }
    }
    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return res.status(400).json({ error: 'phone must be string (<=20 chars)' });
      }
    }

    // Build dynamic SET clause
    const sets = [];
    const params = [uid];
    let i = 2;

    if (username !== undefined)     { sets.push(`username = $${i++}`);     params.push(username.trim()); }
    if (display_name !== undefined) { sets.push(`display_name = $${i++}`); params.push(display_name); }
    if (email !== undefined)        { sets.push(`email = $${i++}`);        params.push(email); }
    if (icon_url !== undefined)     { sets.push(`icon_url = $${i++}`);     params.push(icon_url); }
    if (birthday !== undefined)     { sets.push(`birthday = $${i++}`);     params.push(birthday); } // let PG cast DATE
    if (phone !== undefined)        { sets.push(`phone = $${i++}`);        params.push(phone); }

    if (sets.length === 0) return res.status(400).json({ error: 'no fields to update' });

    const sql = `
      UPDATE users
         SET ${sets.join(', ')}
       WHERE user_id = $1
   RETURNING user_id, username, display_name, email, icon_url, birthday, phone, created_at
    `;
    const { rows } = await db.query(sql, params);
    if (!rows[0]) return res.status(404).json({ error: 'user not found' });

    return res.json(rows[0]);
  } catch (err) {
    // Unique violation (e.g., username taken)
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'conflict: unique constraint', detail: err.detail });
    }
    console.error('updateMe error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

// GET /api/users/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'user not found' });

    return res.json(user);
  } catch (err) {
    console.error('getById error', err);
    return res.status(500).json({ error: 'server error' });
  }
};