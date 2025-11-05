// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload'); // multer middleware

router.get('/me', auth, userController.getMe);
router.post('/me', auth, userController.updateMe);

router.post('/icon', auth, upload.single('file'), userController.uploadUserIcon);
router.get('/icon', auth, userController.getUserIcon);

router.get('/search', auth, userController.searchByUsername);
router.get('/:id', auth, userController.getById);

module.exports = router;