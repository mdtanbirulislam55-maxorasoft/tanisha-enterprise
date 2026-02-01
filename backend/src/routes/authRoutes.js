// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Refresh token (support BOTH paths)
router.post('/refresh', authController.refreshToken);
router.post('/refresh-token', authController.refreshToken);

// Token verify
router.post('/verify-token', authController.verifyToken);

// Protected
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
