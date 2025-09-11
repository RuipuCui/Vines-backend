// controllers/userController.js
const db = require('../config/db');
const User = require('../models/userModel');

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const uid = req.user && (req.user.user_id || req.user.uid);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    const me = await User.findById(uid);
    return res.json(me || null);
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

    const { username, icon_url, email } = req.body || {};

    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0 || username.length > 50) {
        return res.status(400).json({ error: 'username must be 1-50 chars' });
      }
    }
    if (email !== undefined && typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be string' });
    }
    if (icon_url !== undefined && typeof icon_url !== 'string') {
      return res.status(400).json({ error: 'icon_url must be string' });
    }

    const sets = [];
    const params = [uid];
    let i = 2;

    if (username !== undefined) { sets.push(`username = $${i++}`); params.push(username); }
    if (email !== undefined)    { sets.push(`email = $${i++}`);    params.push(email);    }
    if (icon_url !== undefined) { sets.push(`icon_url = $${i++}`); params.push(icon_url); }

    if (sets.length === 0) return res.status(400).json({ error: 'no fields to update' });

    const sql = `
      UPDATE users
         SET ${sets.join(', ')}
       WHERE user_id = $1
   RETURNING user_id, username, email, icon_url, created_at`;
    const { rows } = await db.query(sql, params);
    if (!rows[0]) return res.status(404).json({ error: 'user not found' });

    return res.json(rows[0]);
  } catch (err) {
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