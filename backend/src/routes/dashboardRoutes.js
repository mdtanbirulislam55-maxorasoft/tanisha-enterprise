const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// সব রাউটে অথেন্টিকেশন
router.use(protect);

// ড্যাশবোর্ড এন্ডপয়েন্ট
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/quick-stats', dashboardController.getQuickStats);
router.get('/sales-chart', dashboardController.getSalesChartData);
router.get('/low-stock', dashboardController.getLowStockProducts);
router.get('/pending-orders', dashboardController.getPendingOrders);

module.exports = router;
