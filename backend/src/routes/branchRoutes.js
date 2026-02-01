const express = require('express');
const router = express.Router();

const branchController = require('../controllers/branchController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// 🔐 All branch routes: ADMIN ONLY
router.use(protect, authorize('admin'));

// ==================== UTILITY ENDPOINTS ====================

// Compare branches
router.get('/compare', branchController.compareBranches);

// Simple list for dropdown
router.get('/list/simple', async (req, res) => {
  const branches = await require('../lib/prisma').branch.findMany({
    select: { id: true, code: true, name: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: branches });
});

// ==================== CRUD ====================

router.get('/', branchController.getBranches);
router.post('/', branchController.createBranch);

router.post('/transfer', branchController.transferData);
router.post('/sync', branchController.syncBranches);

router.get('/:id', branchController.getBranchById);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

// ==================== SETTINGS ====================

router.patch('/:id/set-default', branchController.setDefaultBranch);
router.patch('/:id/status', branchController.updateBranchStatus);
router.put('/:id/settings', branchController.updateBranchSettings);

// ==================== STATS ====================

router.get('/:id/stats', branchController.getBranchStats);
router.get('/:id/performance', branchController.getBranchPerformance);

module.exports = router;
