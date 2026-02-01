const authController = require('./authController');

/**
 * User management controller
 * (re-exported from authController to keep codebase consistent)
 */
module.exports = {
  getAllUsers: authController.getAllUsers,
  getUserById: authController.getUserById,
  updateUser: authController.updateUser,
  updateUserStatus: authController.updateUserStatus,
};
