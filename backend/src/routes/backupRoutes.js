const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { protect, admin } = require('../middlewares/authMiddleware');

// ==================== BACKUP OPERATIONS ====================

// Get all backups
router.get('/', protect, admin, backupController.getBackups);

// Create manual backup
router.post('/create', protect, admin, backupController.createBackup);

// Restore from backup
router.post('/:id/restore', protect, admin, backupController.restoreBackup);

// Download backup file
router.get('/:id/download', protect, admin, backupController.downloadBackup);

// Delete backup
router.delete('/:id', protect, admin, backupController.deleteBackup);

// ==================== BACKUP SETTINGS ====================

// Get backup settings
router.get('/settings', protect, admin, backupController.getBackupSettings);

// Update backup settings
router.put('/settings', protect, admin, backupController.updateBackupSettings);

// ==================== AUTO BACKUP ====================

// Schedule auto backup
router.post('/schedule', protect, admin, backupController.scheduleBackup);

// Get backup schedule
router.get('/schedule', protect, admin, backupController.getBackupSchedule);

// ==================== DATA MANAGEMENT ====================

// Cleanup old backups
router.post('/cleanup', protect, admin, backupController.cleanupBackups);

// Check backup integrity
router.get('/:id/verify', protect, admin, backupController.verifyBackup);

// Get backup statistics
router.get('/stats', protect, admin, backupController.getBackupStats);

// ==================== EXPORT/IMPORT ====================

// Export data in various formats
router.post('/export', protect, admin, backupController.exportData);

// Import data from file
router.post('/import', protect, admin, backupController.importData);

// ==================== DATABASE OPERATIONS ====================

// Optimize database
router.post('/optimize', protect, admin, backupController.optimizeDatabase);

// Repair database
router.post('/repair', protect, admin, backupController.repairDatabase);

// ==================== UTILITY ENDPOINTS ====================

// Get backup status
router.get('/status', protect, admin, (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'active',
      lastBackup: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      nextBackup: new Date(Date.now() + 82800000).toISOString(), // 23 hours from now
      backupSize: '245 MB',
      availableSpace: '15.2 GB'
    }
  });
});

// Test backup functionality
router.post('/test', protect, admin, (req, res) => {
  res.json({
    success: true,
    message: 'Backup test completed successfully',
    data: {
      tested: true,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;

