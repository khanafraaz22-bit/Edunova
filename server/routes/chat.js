const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getChat, sendMessage } = require('../controllers/chatController');

router.get('/:courseId', authMiddleware, getChat);
router.post('/send', authMiddleware, sendMessage);

module.exports = router;
