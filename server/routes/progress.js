const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { updateProgress, getStats } = require('../controllers/progressController');

router.post('/update', authMiddleware, updateProgress);
router.get('/stats', authMiddleware, getStats);

module.exports = router;
