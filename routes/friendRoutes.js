const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const c = require('../controllers/friendController');

router.use(auth);

// Friend requests
router.post('/requests', c.sendRequest); // body: { toUserId }
router.get('/requests', c.listRequests); // ?type=incoming|outgoing|all
router.post('/requests/:userId/accept', c.accept);   // accept request from :userId
router.post('/requests/:userId/decline', c.decline); // decline request from :userId
router.delete('/requests/:userId', c.cancel);        // cancel my pending request to :userId

// Friends list & removal
router.get('/', c.listFriends);
router.delete('/:userId', c.remove);

module.exports = router;