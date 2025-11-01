const db = require('../config/db');

// --- helper: aggregate reactions breakdown for entries ---
const reactionsAggSql = `
  SELECT r.entry_id,
         jsonb_agg(
           jsonb_build_object('emoji', r.emoji, 'count', r.cnt)
           ORDER BY r.cnt DESC, r.emoji
         ) AS reactions
  FROM (
    SELECT entry_id, emoji, COUNT(*)::int AS cnt
    FROM diary_reactions
    WHERE entry_id = ANY($1::uuid[])
    GROUP BY entry_id, emoji
  ) r
  GROUP BY r.entry_id
`;

async function attachMeta(rows, me) {
  if (!rows.length) return rows;
  const ids = rows.map(r => r.entry_id);
  // reactions breakdown
  const r1 = await db.query(reactionsAggSql, [ids]);
  const mapReactions = new Map(r1.rows.map(x => [String(x.entry_id), x.reactions]));

  // comment counts
  const r2 = await db.query(`
    SELECT entry_id, COUNT(*)::int AS comment_count
    FROM diary_comments
    WHERE entry_id = ANY($1::uuid[])
    GROUP BY entry_id
  `, [ids]);
  const mapComments = new Map(r2.rows.map(x => [String(x.entry_id), x.comment_count]));

  // did I react (per emoji)? optional simple flag "reacted": true if any
  const r3 = me ? await db.query(`
    SELECT entry_id, TRUE AS reacted
    FROM diary_reactions
    WHERE user_id = $1 AND entry_id = ANY($2::uuid[])
    GROUP BY entry_id
  `, [me, ids]) : { rows: [] };
  const mapMine = new Map(r3.rows.map(x => [String(x.entry_id), true]));

  return rows.map(r => ({
    ...r,
    reactions: mapReactions.get(String(r.entry_id)) || [],
    comment_count: mapComments.get(String(r.entry_id)) || 0,
    reacted: mapMine.get(String(r.entry_id)) || false
  }));
}

// --- Entries ---
exports.createEntry = async (userId, { content, mood, media_url }) => {
  const q = `
    INSERT INTO diary_entries (user_id, content, mood, media_url)
    VALUES ($1, $2, $3, $4)
    RETURNING entry_id, user_id, content, mood, media_url, created_at, updated_at;
  `;
  const { rows } = await db.query(q, [userId, content || null, mood || null, media_url || null]);
  return rows[0];
};

exports.listByUser = async (userId, { limit = 20, before }) => {
  const q = `
    SELECT e.entry_id, e.user_id, e.content, e.mood, e.media_url, e.created_at,
           u.username, u.icon_url
    FROM diary_entries e
    JOIN users u ON u.user_id = e.user_id
    WHERE e.user_id = $1
      AND ($2::timestamp IS NULL OR e.created_at < $2::timestamp)
    ORDER BY e.created_at DESC
    LIMIT $3;
  `;
  const { rows } = await db.query(q, [String(userId).trim(), before || null, limit]);
  return attachMeta(rows, null);
};

exports.listFriends = async (me, { limit = 20, before }) => {
  const q = `
    SELECT e.entry_id, e.user_id, e.content, e.mood, e.media_url, e.created_at,
           u.username, u.icon_url
    FROM diary_entries e
    JOIN users u ON u.user_id = e.user_id
    JOIN friendships f ON f.friend_id = e.user_id
    WHERE f.user_id = $1
      AND f.status = 'accepted'
      AND ($2::timestamp IS NULL OR e.created_at < $2::timestamp)
    ORDER BY e.created_at DESC
    LIMIT $3;
  `;
  const { rows } = await db.query(q, [String(me).trim(), before || null, limit]);
  return attachMeta(rows, me);
};

exports.removeEntry = async (me, entryId) => {
  const q = `DELETE FROM diary_entries WHERE entry_id = $1 AND user_id = $2`;
  const { rowCount } = await db.query(q, [entryId, me]);
  return rowCount > 0;
};

// --- Reactions ---
exports.addReaction = async (me, entryId, emoji) => {
  const q = `
    INSERT INTO diary_reactions (entry_id, user_id, emoji)
    VALUES ($1, $2, $3)
    ON CONFLICT (entry_id, user_id, emoji) DO NOTHING
    RETURNING entry_id, user_id, emoji, created_at;
  `;
  const { rows } = await db.query(q, [entryId, me, emoji]);
  return rows[0] || { entry_id: entryId, user_id: me, emoji, created_at: null };
};

exports.removeReaction = async (me, entryId, emoji) => {
  const q = `DELETE FROM diary_reactions WHERE entry_id = $1 AND user_id = $2 AND emoji = $3`;
  const { rowCount } = await db.query(q, [entryId, me, emoji]);
  return rowCount > 0;
};

// --- Comments ---
exports.addComment = async (me, entryId, { body, emoji }) => {
  const q = `
    INSERT INTO diary_comments (entry_id, user_id, body, emoji)
    VALUES ($1, $2, $3, $4)
    RETURNING comment_id, entry_id, user_id, body, emoji, created_at, updated_at;
  `;
  const { rows } = await db.query(q, [entryId, me, body || null, emoji || null]);
  return rows[0];
};

exports.listComments = async (entryId) => {
  const q = `
    SELECT c.comment_id, c.entry_id, c.user_id, c.body, c.emoji, c.created_at,
           u.username, u.icon_url
    FROM diary_comments c
    JOIN users u ON u.user_id = c.user_id
    WHERE c.entry_id = $1
    ORDER BY c.created_at ASC;
  `;
  const { rows } = await db.query(q, [entryId]);
  return rows;
};

exports.removeComment = async (me, entryId, commentId) => {
  const q = `DELETE FROM diary_comments WHERE comment_id = $1 AND entry_id = $2 AND user_id = $3`;
  const { rowCount } = await db.query(q, [commentId, entryId, me]);
  return rowCount > 0;
};

// --- Reactions: summary + my reactions + recent reactors ---
exports.getReactions = async (entryId, me, { limit = 10 } = {}) => {
  // 1) summary (emoji -> count)
  const q1 = `
    SELECT emoji, COUNT(*)::int AS count
    FROM diary_reactions
    WHERE entry_id = $1
    GROUP BY emoji
    ORDER BY count DESC, emoji
  `;
  const r1 = await db.query(q1, [entryId]);

  // 2) my reactions on this entry (a user can react multiple emojis under current PK)
  let mine = [];
  if (me) {
    const q2 = `
      SELECT emoji
      FROM diary_reactions
      WHERE entry_id = $1 AND user_id = $2
      ORDER BY created_at DESC
    `;
    const r2 = await db.query(q2, [entryId, String(me).trim()]);
    mine = r2.rows.map(x => x.emoji);
  }

  // 3) recent reactors (optional preview)
  const q3 = `
    SELECT r.emoji, r.user_id, r.created_at,
           u.username, u.icon_url
    FROM diary_reactions r
    JOIN users u ON u.user_id = r.user_id
    WHERE r.entry_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2
  `;
  const r3 = await db.query(q3, [entryId, Number(limit)]);

  // normalize summary with reacted_by_me flags
  const summary = r1.rows.map(row => ({
    emoji: row.emoji,
    count: row.count,
    reacted_by_me: mine.includes(row.emoji),
  }));

  return {
    entry_id: entryId,
    summary,
    my_reactions: mine, 
    recent_reactors: r3.rows.map(x => ({
      user_id: x.user_id,
      username: x.username,
      icon_url: x.icon_url,
      emoji: x.emoji,
      reacted_at: x.created_at,
    })),
  };
};