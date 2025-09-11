const admin = require('../config/firebaseAdmin');
const db = require('../config/db');

async function auth(req, res, next) {
  console.log('--- start auth check ---');
  try {
    const authHeader = req.headers['authorization'] || '';
    console.log('Received Authorization header:', authHeader ? '[present]' : '[missing]');

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = match[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid; // Firebase stable unique id

    // Optional profile fields (may be undefined)
    const email = decoded.email || null;
    const displayName = decoded.name || null;
    const photoURL = decoded.picture || null;

    // Upsert into Postgres: users(user_id TEXT PRIMARY KEY, username, email, icon_url)
    await db.query(
      `INSERT INTO users (user_id, username, email, icon_url)
       VALUES ($1, COALESCE($2, $1), $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET username = COALESCE(EXCLUDED.username, users.username),
             email    = COALESCE(EXCLUDED.email, users.email),
             icon_url = COALESCE(EXCLUDED.icon_url, users.icon_url)`,
      [uid, displayName, email, photoURL]
    );

    // Downstream controllers read req.user.user_id
    req.user = { user_id: uid, uid };
    console.log('verify successful for uid:', uid);
    return next();
  } catch (err) {
    // If verifyIdToken throws with auth/argument-error etc., treat as 401/403
    console.error('verifyIdToken failed:', err && err.code, err && err.message);
    const status = err && err.code === 'auth/argument-error' ? 401 : 403;
    return res.status(status).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;