const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    createOrder,
    getMyOrders,
    getAllOrdersAdmin,
    getOrderById,
    updateOrderStatus,
    updateDeliveryStatus,
    cancelOrder,
    refundOrder
} = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/admin/all', protect, adminOnly, getAllOrdersAdmin);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/delivery', protect, adminOnly, updateDeliveryStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/refund', protect, refundOrder);

module.exports = router;
