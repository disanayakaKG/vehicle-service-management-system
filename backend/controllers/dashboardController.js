const Product = require('../models/Product');

// @desc    Get dashboard overview stats
// @route   GET /api/dashboard/overview
// @access  Private (Admin)
exports.getOverview = async (req, res) => {
    try {
        // 1. Total Products
        const totalProducts = await Product.countDocuments();

        // 2. Low Stock (Quantity < 10)
        const lowStock = await Product.countDocuments({ stockQuantity: { $lt: 10 } });

        // 3. Orders Today (Placeholder - assuming Order model doesn't exist yet)
        // If you had an Order model:
        // const startOfDay = new Date();
        // startOfDay.setHours(0, 0, 0, 0);
        // const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
        const ordersToday = 0;

        // 4. Revenue (Placeholder)
        const revenue = 0;

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                ordersToday,
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
