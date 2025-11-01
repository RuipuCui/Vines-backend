const Diary = require('../models/diaryModel');
const Friends = require('../models/friendModel');

const meId = (req)=> req.user?.user_id || req.user?.uid;

// --- Entries ---
exports.createEntry = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });

    const { content, mood, media_url } = req.body || {};
    const row = await Diary.createEntry(me, { content, mood, media_url });
    return res.status(201).json(row);
  } catch (e) {
    console.error('createEntry error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};

exports.listMine = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { limit = 20, before } = req.query;
    const rows = await Diary.listByUser(me, { limit: Number(limit), before });
    return res.json(rows);
  } catch (e) { console.error('listMine error:', e); return res.status(500).json({ error: 'server error' }); }
};

exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, before } = req.query;
    const rows = await Diary.listByUser(userId, { limit: Number(limit), before });
    return res.json(rows);
  } catch (e) { console.error('listByUser error:', e); return res.status(500).json({ error: 'server error' }); }
};

// friends timeline = entries by my accepted friends
exports.listFriends = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { limit = 20, before } = req.query;
    const rows = await Diary.listFriends(me, { limit: Number(limit), before });
    return res.json(rows);
  } catch (e) { console.error('listFriends error:', e); return res.status(500).json({ error: 'server error' }); }
};

exports.removeEntry = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { entryId } = req.params;
    const ok = await Diary.removeEntry(me, entryId);
    if (!ok) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (e) { console.error('removeEntry error:', e); return res.status(500).json({ error: 'server error' }); }
};

// --- Reactions ---
exports.addReaction = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { entryId } = req.params;
    const { emoji } = req.body || {};
    if (!emoji) return res.status(400).json({ error: 'emoji required' });
    const row = await Diary.addReaction(me, entryId, emoji);
    return res.status(201).json(row);
  } catch (e) { console.error('addReaction error:', e); return res.status(500).json({ error: 'server error' }); }
};

exports.removeReaction = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { entryId } = req.params;
    const { emoji } = req.body || {};
    if (!emoji) return res.status(400).json({ error: 'emoji required' });
    const ok = await Diary.removeReaction(me, entryId, emoji);
    if (!ok) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (e) { console.error('removeReaction error:', e); return res.status(500).json({ error: 'server error' }); }
};

// --- Comments ---
exports.addComment = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { entryId } = req.params;
    const { body, emoji } = req.body || {};
    if (!body && !emoji) return res.status(400).json({ error: 'body or emoji required' });
    const row = await Diary.addComment(me, entryId, { body, emoji });
    return res.status(201).json(row);
  } catch (e) { console.error('addComment error:', e); return res.status(500).json({ error: 'server error' }); }
};

exports.listComments = async (req, res) => {
  try {
    const { entryId } = req.params;
    const rows = await Diary.listComments(entryId);
    return res.json(rows);
  } catch (e) { console.error('listComments error:', e); return res.status(500).json({ error: 'server error' }); }
};

exports.removeComment = async (req, res) => {
  try {
    const me = meId(req);
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    const { entryId, commentId } = req.params;
    const ok = await Diary.removeComment(me, entryId, commentId);
    if (!ok) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (e) { console.error('removeComment error:', e); return res.status(500).json({ error: 'server error' }); }
};