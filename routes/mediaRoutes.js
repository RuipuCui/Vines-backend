const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const upload = require('../middleware/upload'); // multer middleware
const auth = require('../middleware/auth');     // jwt middleware

// POST /api/media (with multer and auth)
router.post('/upload', auth, upload.single('file'), mediaController.uploadMedia);

// GET /api/media (get all uploads for logged-in user)
router.post('/get', auth,  mediaController.getUserMedia);


module.exports = router;
