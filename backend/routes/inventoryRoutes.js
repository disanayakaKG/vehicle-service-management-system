const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getInventoryProducts,
    getLowStockProducts,
    updateStock,
    getInventoryReport,
} = require('../controllers/inventoryController');

router.get('/', protect, getInventoryProducts);
router.get('/low-stock', protect, getLowStockProducts);
router.put('/:id/stock', protect, updateStock);
router.get('/report', protect, getInventoryReport);

module.exports = router;
