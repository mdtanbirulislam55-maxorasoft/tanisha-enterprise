const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// 🔐 All user management routes = ADMIN only
router.use(protect, authorize('admin'));

// ==================== USER MANAGEMENT ====================

// Get all users
router.get('/', settingsController.getUsers);

// Create new user
router.post('/', settingsController.createUser);

// Update user
router.put('/:id', settingsController.updateUser);

// Deactivate user (soft delete)
router.delete('/:id', settingsController.deleteUser);

module.exports = router;
