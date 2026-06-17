
require('dotenv').config();

// Apply DNS fix ONLY for local development (resolves ISP blocks on MongoDB SRV)
// We skip this in production/Railway because it breaks their internal routing
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT_NAME) {
    console.log("🔧 Applying local DNS fix for MongoDB...");
    const dns = require('node:dns');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const reviewRoutes = require('./routes/reviewRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { startDeliveryScheduler } = require('./utils/deliveryScheduler');

// Connect to Database with better logging
console.log("🔄 Attempting to connect to MongoDB...");
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('Vehicle Spare Parts API is running...');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reviews', reviewRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);

    // Start the delivery scheduler after server starts
    setTimeout(() => {
        startDeliveryScheduler();
    }, 2000); // Start after 2 seconds to ensure database is connected
});