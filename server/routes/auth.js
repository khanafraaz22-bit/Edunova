const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { signup, login, logout, getMe, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
