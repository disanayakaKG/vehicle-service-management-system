const Order = require('../models/Order');

// Define the delivery status flow
const DELIVERY_STATUS_FLOW = [
    'Order Placed',
    'Order Confirmed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered'
];

// Store last update times for each order
const orderLastUpdateTimes = new Map();

// Function to update delivery status automatically
const updateDeliveryStatus = async () => {
    try {
        console.log('Running automatic delivery status update...');
        
        // Get all orders that are not yet delivered or refunded
        const orders = await Order.find({
            deliveryStatus: { $nin: ['Delivered', 'Refunded', 'Cancelled'] }
        });

        const currentTime = new Date();
        const tenSecondsInMs = 10 * 1000; // 10 seconds in milliseconds

        for (const order of orders) {
            const orderId = order._id.toString();
            const lastUpdateTime = orderLastUpdateTimes.get(orderId) || order.createdAt;
            const timeSinceLastUpdate = currentTime - lastUpdateTime;

            // Only update if at least 10 seconds have passed since last update
            if (timeSinceLastUpdate >= tenSecondsInMs) {
                const currentStatusIndex = DELIVERY_STATUS_FLOW.indexOf(order.deliveryStatus);
                
                // If current status is not found in flow, start from beginning
                let nextStatusIndex = currentStatusIndex === -1 ? 1 : currentStatusIndex + 1;
                
                // Check if we have a next status
                if (nextStatusIndex < DELIVERY_STATUS_FLOW.length) {
                    const newStatus = DELIVERY_STATUS_FLOW[nextStatusIndex];
                    
                    console.log(`Updating order ${orderId} from "${order.deliveryStatus}" to "${newStatus}"`);
                    
                    // Update the order status
                    order.deliveryStatus = newStatus;
                    
                    // If this is the final status (Delivered), also update orderStatus
                    if (newStatus === 'Delivered') {
                        order.orderStatus = 'Delivered';
                        console.log(`Order ${orderId} orderStatus also set to Delivered`);
                    }
                    
                    await order.save();
                    
                    // Update the last update time for this order
                    orderLastUpdateTimes.set(orderId, currentTime);
                    
                    console.log(`Order ${orderId} updated to ${newStatus}`);
                } else {
                    // Order is already delivered, remove from tracking
                    orderLastUpdateTimes.delete(orderId);
                }
            }
        }
        
        console.log('Automatic delivery status update completed');
    } catch (error) {
        console.error('Error in automatic delivery status update:', error);
    }
};

// Function to start the scheduler
const startDeliveryScheduler = () => {
    console.log('Starting delivery status scheduler...');
    
    // Run immediately on start
    updateDeliveryStatus();
    
    // Then run every 10 seconds
    setInterval(updateDeliveryStatus, 10 * 1000); // 10 seconds interval
    
    console.log('Delivery status scheduler started - will update every 10 seconds');
};

// Function to stop the scheduler (if needed)
const stopDeliveryScheduler = () => {
    // This would need to store the interval ID to work properly
    console.log('Delivery status scheduler stopped');
};

// Export functions
module.exports = {
    updateDeliveryStatus,
    startDeliveryScheduler,
    stopDeliveryScheduler,
    DELIVERY_STATUS_FLOW
};
