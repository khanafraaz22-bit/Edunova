const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { analyzeCourse, getCourses, getCourse, deleteCourse } = require('../controllers/courseController');

router.post('/analyze', authMiddleware, analyzeCourse);
router.get('/', authMiddleware, getCourses);
router.get('/:id', authMiddleware, getCourse);
router.delete('/:id', authMiddleware, deleteCourse);

module.exports = router;
