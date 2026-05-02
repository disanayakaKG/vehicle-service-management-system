const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard overview stats
// @route   GET /api/dashboard/overview
// @access  Private (Admin)
exports.getOverview = async (req, res) => {
    try {
        // 1. Total Products
        const totalProducts = await Product.countDocuments();

        // 2. Low Stock (Quantity < 10)
        const lowStock = await Product.countDocuments({ stockQuantity: { $lt: 10 } });

        // 3. Total Orders
        const totalOrders = await Order.countDocuments();

        // 4. Revenue (sum of non-cancelled orders)
        const revenueData = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const revenue = revenueData[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                totalOrders,
                revenue,
                lowStock
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while fetching dashboard stats',
            error: error.message
        });
    }
};

// @desc    Get dashboard details for a selected card
// @route   GET /api/dashboard/details/:type
// @access  Private (Admin)
exports.getDetails = async (req, res) => {
    try {
        const { type } = req.params;

        if (type === 'products') {
            const products = await Product.find({}).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: products });
        }

        if (type === 'orders') {
            const orders = await Order.find({}).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: orders });
        }

        if (type === 'revenue') {
            const orders = await Order.find({ orderStatus: { $ne: 'Cancelled' } }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: orders });
        }

        if (type === 'low-stock') {
            const lowStockProducts = await Product.find({ stockQuantity: { $lt: 10 } }).sort({ stockQuantity: 1 });
            return res.status(200).json({ success: true, data: lowStockProducts });
        }

        return res.status(400).json({ success: false, message: 'Invalid dashboard detail type' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
