// backend/src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Picks the first existing function from reportController by names.
 * If none exists, returns a safe handler that returns 501 (NOT crash).
 */
const pick = (names = []) => {
  for (const n of names) {
    if (typeof reportController?.[n] === 'function') return reportController[n];
  }
  return (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Not implemented',
      endpoint: req.originalUrl,
      expectedOneOf: names,
    });
  };
};

// ==================== REPORT ROUTES ====================
// These routes will NOT crash even if controller functions are missing.
// They will return 501 until you implement the handler in reportController.js.

// Dashboard reports
router.get(
  '/dashboard',
  protect,
  pick(['dashboard', 'getDashboardReports', 'getDashboardReport', 'dashboardReport'])
);

// Sales reports
router.get(
  '/sales',
  protect,
  pick(['sales', 'getSalesReport', 'getSalesReports'])
);
router.get(
  '/sales/daily',
  protect,
  pick(['getDailySales', 'dailySales', 'salesDaily'])
);
router.get(
  '/sales/monthly',
  protect,
  pick(['getMonthlySales', 'monthlySales', 'salesMonthly'])
);
router.get(
  '/sales/by-product',
  protect,
  pick(['getSalesByProduct', 'salesByProduct'])
);
router.get(
  '/sales/by-customer',
  protect,
  pick(['getSalesByCustomer', 'salesByCustomer'])
);

// Purchase reports
router.get(
  '/purchases',
  protect,
  pick(['purchases', 'getPurchaseReport', 'getPurchasesReport'])
);
router.get(
  '/purchase/by-supplier',
  protect,
  pick(['getPurchaseBySupplier', 'purchaseBySupplier'])
);

// Inventory reports
router.get(
  '/inventory',
  protect,
  pick(['inventory', 'getInventoryReport', 'inventoryReport'])
);
router.get(
  '/inventory/low-stock',
  protect,
  pick(['getLowStockReport', 'lowStock', 'inventoryLowStock'])
);
router.get(
  '/inventory/movement',
  protect,
  pick(['getInventoryMovement', 'inventoryMovement'])
);

// Financial reports
router.get(
  '/profit',
  protect,
  pick(['profit', 'getProfitReport', 'getProfitLossReport', 'profitLoss'])
);
router.get(
  '/customer-ledger',
  protect,
  pick(['getCustomerLedger', 'customerLedger'])
);
router.get(
  '/supplier-ledger',
  protect,
  pick(['getSupplierLedger', 'supplierLedger'])
);
router.get(
  '/balance-sheet',
  protect,
  pick(['getBalanceSheet', 'balanceSheet'])
);

// Master data reports
router.get(
  '/customers',
  protect,
  pick(['customers', 'getCustomersReport', 'customersReport'])
);
router.get(
  '/suppliers',
  protect,
  pick(['suppliers', 'getSuppliersReport', 'suppliersReport'])
);

// Export (optional)
router.post(
  '/export',
  protect,
  pick(['exportReport', 'export'])
);

module.exports = router;
