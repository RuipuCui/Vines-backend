const db = require('../config/db');

/**
 * Schema this model targets:
 * friendships(user_id INTEGER, friend_id INTEGER, status VARCHAR(20) CHECK IN ('pending','accepted','rejected'), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, friend_id))
 *
 * Conventions:
 * - PENDING: a one-way record from requester -> receiver
 * - ACCEPTED: two records (A->B and B->A), both 'accepted'
 * - REJECTED: keep a one-way record requester -> receiver with status 'rejected' (optional; can also delete)
 */

const sanitizeIds = (a, b) => {
  if (!a || !b) throw new Error('invalid_user_id');
  const A = String(a).trim();
  const B = String(b).trim();
  if (A === B) throw new Error('cannot_friend_self');
  return [A, B];
};

/**
 * Send a friend request (creates a single PENDING row requester -> receiver).
 * Returns the created row or null if an identical pending/accepted/rejected row already exists.
 */
exports.sendFriendRequest = async (fromUserId, toUserId) => {
  const [fromId, toId] = sanitizeIds(fromUserId, toUserId);
  const { rows } = await db.query(
    `INSERT INTO friendships (user_id, friend_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (user_id, friend_id) DO NOTHING
     RETURNING *;`,
    [fromId, toId]
  );
  return rows[0] || null;
};

/**
 * List pending requests.
 * type = 'incoming' | 'outgoing' | 'all'
 */
exports.listRequests = async (userId, type = 'incoming') => {
  let sql, params;
  if (type === 'incoming') {
    sql = `
      SELECT f.*, u.username AS from_username, u.email AS from_email
      FROM friendships f
      JOIN users u ON u.user_id = f.user_id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`;
    params = [userId];
  } else if (type === 'outgoing') {
    sql = `
      SELECT f.*, u.username AS to_username, u.email AS to_email
      FROM friendships f
      JOIN users u ON u.user_id = f.friend_id
      WHERE f.user_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`;
    params = [userId];
  } else {
    sql = `
      SELECT * FROM friendships
      WHERE (user_id = $1 OR friend_id = $1) AND status = 'pending'
      ORDER BY created_at DESC`;
    params = [userId];
  }
  const { rows } = await db.query(sql, params);
  return rows;
};

/**
 * Accept a pending request from requesterId -> me.
 * - Updates A->B (pending) to 'accepted'
 * - Upserts B->A to 'accepted'
 * Adds diagnostics so we can tell "not found" vs "not pending".
 */
exports.acceptRequest = async (requesterId, me) => {
  const [fromId, toId] = sanitizeIds(requesterId, me);

  // --- MINIMAL FIX: only call connect() when db is a Pool ---
  let client = null;
  let q = db;
  try {
    // Detect Pool by constructor name; Pools are safe to .connect() per request
    if (db && db.constructor && db.constructor.name === 'Pool') {
      client = await db.connect();
      q = client;
    }

    if (client) await q.query('BEGIN');

    const { rowCount } = await q.query(
      `UPDATE friendships
         SET status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [fromId, toId]
    );

    if (rowCount === 0) {
      const { rows: probe } = await q.query(
        `SELECT status FROM friendships WHERE user_id = $1 AND friend_id = $2`,
        [fromId, toId]
      );
      if (!probe[0]) {
        const e = new Error('not_found_or_forbidden');
        e.meta = { fromId, toId };
        throw e;
      } else {
        const e = new Error('not_pending');
        e.meta = { fromId, toId, currentStatus: probe[0].status };
        throw e;
      }
    }

    await q.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [toId, fromId]
    );

    if (client) await q.query('COMMIT');
    return { ok: true };
  } catch (e) {
    if (client) await q.query('ROLLBACK');
    throw e;
  } finally {
    // Only release when we actually checked out a Pool client
    if (client && typeof client.release === 'function') client.release();
  }
};

/**
 * Decline a pending request from requesterId -> me (set to 'rejected').
 */
exports.declineRequest = async (requesterId, me) => {
  const [fromId, toId] = sanitizeIds(requesterId, me);
  const { rows } = await db.query(
    `UPDATE friendships
     SET status = 'rejected'
     WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
     RETURNING *;`,
    [fromId, toId]
  );
  return rows[0] || null;
};

/**
 * Cancel a pending request that I sent to receiverId.
 * Since schema has no 'cancelled' status, we delete the pending row.
 */
exports.cancelRequest = async (me, receiverId) => {
  const [fromId, toId] = sanitizeIds(me, receiverId);
  const { rows } = await db.query(
    `DELETE FROM friendships
     WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
     RETURNING *;`,
    [fromId, toId]
  );
  return rows[0] || null;
};

/**
 * List accepted friends for me.
 * Because we create reciprocal rows on accept, we can query only my outgoing accepted edges.
 */
exports.listFriends = async (me) => {
  const { rows } = await db.query(
    `SELECT u.user_id, u.username, u.email
     FROM friendships f
     JOIN users u ON u.user_id = f.friend_id
     WHERE f.user_id = $1 AND f.status = 'accepted'
     ORDER BY f.created_at DESC`,
    [me]
  );
  return rows;
};

/**
 * Remove a friendship completely (delete both directions if present).
 */
exports.removeFriend = async (me, other) => {
  const [a, b] = sanitizeIds(me, other);
  const { rowCount } = await db.query(
    `DELETE FROM friendships
     WHERE (user_id = $1 AND friend_id = $2)
        OR (user_id = $2 AND friend_id = $1)`,
    [a, b]
  );
  return { removed: rowCount };
};

/**
 * Optional helper: get current status between two users (if any).
 */
exports.getStatusBetween = async (a, b) => {
  const [x, y] = sanitizeIds(a, b);
  const { rows } = await db.query(
    `SELECT status FROM friendships WHERE user_id = $1 AND friend_id = $2`,
    [x, y]
  );
  return rows[0]?.status || null;
};