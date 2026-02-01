const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

// Create customer
router.post('/', protect, customerController.createCustomer);

// Get all customers
router.get('/', protect, customerController.getCustomers);

// Get single customer
router.get('/:id', protect, customerController.getCustomerById);

// Update customer
router.put('/:id', protect, customerController.updateCustomer);

// Delete customer
router.delete('/:id', protect, customerController.deleteCustomer);

module.exports = router;
