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
// Send a friend request (A -> B) and also return receiver's basic profile.
// Backward compatible: keeps existing fields and adds other_* fields.
exports.sendFriendRequest = async (fromUserId, toUserId) => {
  const [fromId, toId] = sanitizeIds(fromUserId, toUserId);

  const q = `
    WITH ins AS (
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (user_id, friend_id) DO NOTHING
      RETURNING user_id, friend_id, status, created_at
    )
    SELECT
      COALESCE(i.user_id, $1)  AS user_id,
      COALESCE(i.friend_id, $2) AS friend_id,
      COALESCE(i.status, 'pending') AS status,
      COALESCE(i.created_at, NOW()) AS created_at,
      u.user_id   AS other_user_id,
      u.username  AS other_username,
      u.icon_url  AS other_icon_url
    FROM (SELECT * FROM ins) i
    JOIN users u ON u.user_id = $2
    UNION ALL
    SELECT
      $1 AS user_id,
      $2 AS friend_id,
      'pending' AS status,
      NOW() AS created_at,
      u2.user_id AS other_user_id,
      u2.username AS other_username,
      u2.icon_url AS other_icon_url
    WHERE NOT EXISTS (SELECT 1 FROM ins)
      AND EXISTS (SELECT 1 FROM users u2 WHERE u2.user_id = $2);
  `;
  const { rows } = await db.query(q, [fromId, toId]);
  return rows[0] || null;
};

/**
 * List pending requests.
 * type = 'incoming' | 'outgoing' | 'all'
 */
// List pending requests with the *other party's* basic profile.
// type: 'incoming' | 'outgoing' | 'all'
exports.listRequests = async (me, type = 'all') => {
  const userId = String(me).trim();
  const t = (type || 'all').toLowerCase();

  if (t === 'incoming') {
    const q = `
      SELECT
        f.user_id   AS requester_id,
        f.friend_id AS receiver_id,
        f.status,
        f.created_at,
        -- other party is the requester
        u.user_id   AS other_user_id,
        u.username  AS other_username,
        u.icon_url  AS other_icon_url,
        'incoming'  AS direction
      FROM friendships f
      JOIN users u ON u.user_id = f.user_id
      WHERE f.friend_id = $1
        AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;
    const { rows } = await db.query(q, [userId]);
    return rows;
  }

  if (t === 'outgoing') {
    const q = `
      SELECT
        f.user_id   AS requester_id,
        f.friend_id AS receiver_id,
        f.status,
        f.created_at,
        -- other party is the receiver
        u.user_id   AS other_user_id,
        u.username  AS other_username,
        u.icon_url  AS other_icon_url,
        'outgoing'  AS direction
      FROM friendships f
      JOIN users u ON u.user_id = f.friend_id
      WHERE f.user_id = $1
        AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;
    const { rows } = await db.query(q, [userId]);
    return rows;
  }

  // 'all' = incoming ∪ outgoing with the same shape
  const q = `
    SELECT
      f.user_id   AS requester_id,
      f.friend_id AS receiver_id,
      f.status,
      f.created_at,
      u.user_id   AS other_user_id,
      u.username  AS other_username,
      u.icon_url  AS other_icon_url,
      'incoming'  AS direction
    FROM friendships f
    JOIN users u ON u.user_id = f.user_id
    WHERE f.friend_id = $1 AND f.status = 'pending'
    UNION ALL
    SELECT
      f.user_id   AS requester_id,
      f.friend_id AS receiver_id,
      f.status,
      f.created_at,
      u.user_id   AS other_user_id,
      u.username  AS other_username,
      u.icon_url  AS other_icon_url,
      'outgoing'  AS direction
    FROM friendships f
    JOIN users u ON u.user_id = f.friend_id
    WHERE f.user_id = $1 AND f.status = 'pending'
    ORDER BY created_at DESC;
  `;
  const { rows } = await db.query(q, [userId]);
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
  const q = `
    SELECT
      u.user_id,
      u.username,
      u.display_name,
      u.icon_url,
      f.created_at
    FROM friendships f
    JOIN users u
      ON u.user_id = f.friend_id
    WHERE f.user_id = $1
      AND f.status = 'accepted'
    ORDER BY u.username;
  `;
  const { rows } = await db.query(q, [me]);
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