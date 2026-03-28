const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { summarizeVideo, teachTopic, findTopic, generateMindMap, generateExam, submitExam, analyzeGaps } = require('../controllers/aiController');

router.post('/summarize', authMiddleware, summarizeVideo);
router.post('/teach', authMiddleware, teachTopic);
router.post('/find-topic', authMiddleware, findTopic);
router.post('/mindmap', authMiddleware, generateMindMap);
router.post('/exam', authMiddleware, generateExam);
router.post('/exam/submit', authMiddleware, submitExam);
router.post('/gap-analysis', authMiddleware, analyzeGaps);

module.exports = router;
