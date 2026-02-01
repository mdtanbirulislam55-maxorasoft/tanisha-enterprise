const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const { protect } = require('../middlewares/authMiddleware');

// All service routes require auth
router.use(protect);

// Create service request
router.post('/', serviceController.createServiceRequest);

// List service requests
router.get('/', serviceController.getServiceRequests);

// Update status
router.put('/:id/status', serviceController.updateServiceStatus);

// History
router.get('/history/list', serviceController.getServiceHistory);

// Analytics
router.get('/analytics/summary', serviceController.getServiceAnalytics);

module.exports = router;
