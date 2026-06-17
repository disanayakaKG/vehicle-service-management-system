const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const VALID_ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const VALID_DELIVERY_STATUSES = ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
    try {
        console.log('Creating order with data:', JSON.stringify(req.body, null, 2));
        console.log('User authenticated:', req.user ? req.user.email : 'No user');
        
        const order = new Order({
            ...req.body,
            customer: req.user._id,
            // Always bind order to currently authenticated account
            customerEmail: req.user.email,
            // Initialize delivery tracking fields
            deliveryStatus: 'Order Placed',
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            trackingNumber: `TRK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });

        // Reduce inventory for each ordered item
        console.log('Processing inventory reduction for items:', order.items.length);
        for (const item of order.items) {
            const requestedQty = Number(item.quantity || 0);
            console.log('Processing item:', item.productId, item.productName, 'qty:', requestedQty);

            if (!requestedQty || requestedQty <= 0) {
                return res.status(400).json({ message: `Invalid quantity for product: ${item.productName}` });
            }

            let product = null;
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
                product = await Product.findById(item.productId);
            }

            if (!product) {
                product = await Product.findOne({ productId: item.productId });
            }

            console.log('Found product:', product ? product.name : 'Not found');
            if (!product) {
                return res.status(400).json({ message: `Product not found: ${item.productName}` });
            }

            if (Number(product.stockQuantity) < requestedQty) {
                return res.status(400).json({
                    message: `Insufficient stock for product: ${item.productName}. Available: ${product.stockQuantity}, Requested: ${requestedQty}`
                });
            }

            product.stockQuantity = Math.max(0, Number(product.stockQuantity) - requestedQty);
            await product.save();
            console.log('Stock updated successfully for product:', product.name, 'new stock:', product.stockQuantity);
        }

        const createdOrder = await order.save();
        console.log('Order created successfully:', createdOrder._id);
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged-in customer's orders sorted by newest first
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { customer: req.user._id },
                { customerEmail: req.user.email }
            ]
        }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders for admin
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            res.status(200).json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;

        if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.orderStatus = orderStatus;
        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const updateDeliveryStatus = async (req, res) => {
    try {
        const { deliveryStatus, trackingNumber, estimatedDeliveryDate } = req.body;

        if (!VALID_DELIVERY_STATUSES.includes(deliveryStatus)) {
            return res.status(400).json({ message: 'Invalid delivery status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.deliveryStatus = deliveryStatus;
        
        // Update order status based on delivery status
        if (deliveryStatus === 'Order Placed') {
            order.orderStatus = 'Pending';
        } else if (deliveryStatus === 'Order Confirmed') {
            order.orderStatus = 'Confirmed';
        } else if (deliveryStatus === 'Processing') {
            order.orderStatus = 'Processing';
        } else if (deliveryStatus === 'Shipped') {
            order.orderStatus = 'Shipped';
        } else if (deliveryStatus === 'Out for Delivery') {
            order.orderStatus = 'Shipped';
        } else if (deliveryStatus === 'Delivered') {
            order.orderStatus = 'Delivered';
        }

        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify ownership (or allow admins)
        if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // Only allow cancellation if Pending or Confirmed
        if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Confirmed') {
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        order.orderStatus = 'Cancelled';
        order.deliveryStatus = 'Cancelled';
        const cancelledOrder = await order.save();
        res.status(200).json(cancelledOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order details (address, phone) before processing
// @route   PUT /api/orders/:id/details
// @access  Private
const updateOrderDetails = async (req, res) => {
    try {
        const { shippingAddress, customerPhone } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify ownership
        if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Only allow updates if Pending or Confirmed
        if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Confirmed') {
            return res.status(400).json({ message: 'Cannot update details for an order that is already being processed' });
        }

        if (shippingAddress) order.shippingAddress = shippingAddress;
        if (customerPhone) order.customerPhone = customerPhone;

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const refundOrder = async (req, res) => {
    try {
        console.log('Refund request received for order ID:', req.params.id);
        const order = await Order.findById(req.params.id);
        console.log('Order found:', order);
        console.log('Order delivery status:', order?.deliveryStatus);
        console.log('Order status:', order?.orderStatus);
        
        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.deliveryStatus !== 'Delivered') {
            console.log('Order not delivered, current status:', order.deliveryStatus);
            return res.status(400).json({ message: 'Only delivered orders can be refunded' });
        }

        if (order.orderStatus === 'Refunded') {
            console.log('Order already refunded');
            return res.status(400).json({ message: 'Order has already been refunded' });
        }

        console.log('Processing refund...');
        order.orderStatus = 'Refunded';
        order.deliveryStatus = 'Refunded';
        const refundedOrder = await order.save();
        console.log('Refund processed successfully');
        res.status(200).json(refundedOrder);
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrdersAdmin,
    getOrderById,
    updateOrderStatus,
    updateDeliveryStatus,
    updateOrderDetails,
    cancelOrder,
    refundOrder
};
