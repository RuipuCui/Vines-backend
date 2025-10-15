// controllers/friendController.js
const Friends = require('../models/friendModel');

// Read current user id injected by auth middleware (Firebase)
const meId = (req) => req.user?.user_id || req.user?.uid;

// POST /api/friends/requests
// body: { toUserId: string }
exports.sendRequest = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const { toUserId } = req.body || {};
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });

    if (String(me) === String(toUserId)) {
      return res.status(400).json({ error: 'cannot add yourself' });
    }

    const r = await Friends.sendFriendRequest(me, toUserId);
    if (!r) return res.status(409).json({ error: 'request already exists' });

    // Model now returns other_username / other_icon_url so frontend can render avatar immediately
    return res.status(201).json(r);
  } catch (e) {
    console.error('sendRequest error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

// GET /api/friends/requests?type=incoming|outgoing|all
exports.listRequests = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    // default to 'all' to show both directions unless frontend asks otherwise
    const raw = (req.query.type || 'all').toString().toLowerCase().trim();
    const allowed = new Set(['incoming', 'outgoing', 'all']);
    const type = allowed.has(raw) ? raw : 'all';

    const items = await Friends.listRequests(me, type);
    return res.json(items);
  } catch (e) {
    console.error('listRequests error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

// POST /api/friends/requests/:userId/accept
exports.accept = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    // requesterId (sender of A->B)
    const targetIdRaw = req.params.userId || req.params.id;
    const targetId = typeof targetIdRaw === 'string' ? targetIdRaw.trim() : targetIdRaw;
    if (!targetId) return res.status(400).json({ error: 'missing requesterId in URL' });

    try {
      const ok = await Friends.acceptRequest(targetId, me); // (A, B)
      return res.json(ok); // { ok: true }
    } catch (e) {
      if (e.message === 'not_found_or_forbidden') {
        return res.status(404).json({ error: 'request not found or not allowed', meta: e.meta });
      }
      if (e.message === 'not_pending') {
        return res.status(409).json({ error: 'request is not pending', meta: e.meta });
      }
      console.error('accept controller error:', e);
      return res.status(400).json({ error: 'cannot accept', detail: e.message });
    }
  } catch (e) {
    console.error('accept controller outer error:', e);
    return res.status(400).json({ error: 'cannot accept' });
  }
};

// POST /api/friends/requests/:userId/decline
exports.decline = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const targetIdRaw = req.params.userId || req.params.id;
    const targetId = typeof targetIdRaw === 'string' ? targetIdRaw.trim() : targetIdRaw;
    if (!targetId) return res.status(404).json({ error: 'not found' });

    const r = await Friends.declineRequest(targetId, me);
    if (!r) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('decline error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

// DELETE /api/friends/requests/:userId
exports.cancel = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });

    const targetIdRaw = req.params.userId || req.params.id;
    const targetId = typeof targetIdRaw === 'string' ? targetIdRaw.trim() : targetIdRaw;
    if (!targetId) return res.status(404).json({ error: 'not found' });

    const r = await Friends.cancelRequest(me, targetId);
    if (!r) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('cancel error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

// GET /api/friends
exports.listFriends = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });
    const rows = await Friends.listFriends(me);
    return res.json(rows);
  } catch (e) {
    console.error('listFriends error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

// DELETE /api/friends/:userId
exports.remove = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorised' });
    const { userId } = req.params;
    const r = await Friends.removeFriend(me, userId);
    if (!r || !r.removed) return res.status(404).json({ error: 'not friends' });
    return res.json({ ok: true });
  } catch (e) {
    console.error('remove friend error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};