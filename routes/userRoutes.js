// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload'); // multer middleware

router.get('/me', auth, userController.getMe);
router.patch('/me', auth, userController.updateMe);

router.get('/:id', auth, userController.getById);

router.post('/icon', auth, upload.single('file'), userController.uploadUserIcon);
router.get('/icon', auth, userController.getUserIcon);

module.exports = router;