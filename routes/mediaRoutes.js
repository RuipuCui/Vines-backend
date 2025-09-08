const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const upload = require('../middleware/upload'); // multer middleware
const auth = require('../middleware/auth');     // jwt middleware

router.post('/upload', auth, upload.single('file'), mediaController.uploadMedia);
router.get('/getMedia', auth,  mediaController.getUserMedia);
router.delete('/deleteMediaByUploadId', auth, mediaController.deleteMediaByUploadId);
router.delete('/deleteMediaByUserId', auth, mediaController.deleteMediaByUserId);


module.exports = router;
