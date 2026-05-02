const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: [true, 'Product ID is required']
    },
    productName: {
        type: String,
        required: [true, 'Product name is required']
    },
    image: {
        type: String
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required']
    },
    subtotal: {
        type: Number,
        required: [true, 'Subtotal is required']
    }
}, {
    _id: false
});

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required']
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required']
    },
    customerPhone: {
        type: String,
        required: [true, 'Customer phone is required']
    },
    shippingAddress: {
        type: String,
        required: [true, 'Shipping address is required']
    },
    items: {
        type: [orderItemSchema],
        required: [true, 'Order items are required'],
        validate: {
            validator: function(value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: 'At least one order item is required'
        }
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Demo Card Payment', 'PayHere Sandbox'],
        required: [true, 'Payment method is required']
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    deliveryStatus: {
        type: String,
        enum: ['Order Placed', 'Order Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Refunded'],
        default: 'Order Placed'
    },
    estimatedDeliveryDate: {
        type: Date
    },
    trackingNumber: {
        type: String
    },
    cardLastFour: {
        type: String
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
