const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/diaryController');

router.use(auth);

// entries
router.post('/', c.createEntry);                   // create my diary
router.get('/me', c.listMine);                     // my timeline
router.get('/user/:userId', c.listByUser);         // someone's timeline (public to logged-in users)
router.get('/friends', c.listFriends);             // friends timeline (accepted friendships)
router.delete('/:entryId', c.removeEntry);         // delete my entry

// reactions
router.post('/:entryId/reactions', c.addReaction);     // body: { emoji }
router.delete('/:entryId/reactions', c.removeReaction);// body: { emoji }

// comments
router.post('/:entryId/comments', c.addComment);       // body: { body? , emoji? } (one required)
router.get('/:entryId/comments', c.listComments);
router.delete('/:entryId/comments/:commentId', c.removeComment);

module.exports = router;