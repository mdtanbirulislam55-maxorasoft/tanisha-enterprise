const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesController');
const { protect } = require('../middlewares/authMiddleware');

// Safety wrapper (controller method missing hole crash na kore clean error dibe)
const tempHandler = (name) => (req, res) =>
  res.status(501).json({ success: false, error: `${name} not implemented` });

// All sales routes protected
router.use(protect);

// Create sale
router.post('/', salesController.createSale || tempHandler('createSale'));

// Get all sales
router.get('/', salesController.getSales || tempHandler('getSales'));

// Get single sale
router.get('/:id', salesController.getSaleById || tempHandler('getSaleById'));

// Update sale status
router.put('/:id/status', salesController.updateSaleStatus || tempHandler('updateSaleStatus'));

// Cancel sale
router.put('/:id/cancel', salesController.cancelSale || tempHandler('cancelSale'));

// Sales summary/dashboard
router.get('/reports/summary', salesController.getSalesSummary || tempHandler('getSalesSummary'));

module.exports = router;
