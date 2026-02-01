const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

// Apply auth middleware to all product routes
router.use(protect);

// Routes
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
