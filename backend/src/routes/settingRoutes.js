const express = require('express');
const router = express.Router();

const settingController = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

// Safe fallback (missing controller hole crash na kore)
const tempHandler = (name) => (req, res) => {
  res.status(501).json({
    success: false,
    error: `${name} not implemented`,
  });
};

// All setting routes protected
router.use(protect);

// Get all settings
router.get(
  '/',
  settingController.getSettings || tempHandler('getSettings')
);

// Update settings
router.put(
  '/',
  settingController.updateSettings || tempHandler('updateSettings')
);

// Update single setting by key (optional)
router.put(
  '/:key',
  settingController.updateSettingByKey || tempHandler('updateSettingByKey')
);

module.exports = router;
