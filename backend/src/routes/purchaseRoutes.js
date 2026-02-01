const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');

// Safe fallback (controller method missing hole crash করবে না)
const tempHandler = (name) => (req, res) => {
  res.status(501).json({
    success: false,
    error: `${name} not implemented`,
  });
};

// All purchase routes protected
router.use(protect);

// Create purchase
router.post(
  '/',
  purchaseController.createPurchase || tempHandler('createPurchase')
);

// Get all purchases
router.get(
  '/',
  purchaseController.getPurchases || tempHandler('getPurchases')
);

// Get single purchase
router.get(
  '/:id',
  purchaseController.getPurchaseById || tempHandler('getPurchaseById')
);

// Update purchase
router.put(
  '/:id',
  purchaseController.updatePurchase || tempHandler('updatePurchase')
);

// Delete purchase
router.delete(
  '/:id',
  purchaseController.deletePurchase || tempHandler('deletePurchase')
);

module.exports = router;
