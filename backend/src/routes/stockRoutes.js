const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', stockController.getStock);
router.get('/current', stockController.getCurrentStock);
router.post('/adjust', stockController.adjustStock);
router.post('/transfer', stockController.transferStock);

module.exports = router;
