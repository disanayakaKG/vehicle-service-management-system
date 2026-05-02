const Product = require('../models/Product');

const getInventoryProducts = async (req, res) => {
    try {
        const products = await Product.find({});

        const inventoryProducts = products.map((product) => {
            let stockStatus = 'In Stock';

            if (product.stockQuantity === 0) {
                stockStatus = 'Out of Stock';
            } else if (product.stockQuantity <= 5) {
                stockStatus = 'Low Stock';
            }

            return {
                ...product.toObject(),
                stockStatus,
            };
        });

        res.status(200).json(inventoryProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({ stockQuantity: { $lte: 5 } });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const { mode, quantity } = req.body;

        if (mode !== 'set' && mode !== 'add' && mode !== 'reduce') {
            return res.status(400).json({ message: 'Invalid mode. Use set, add, or reduce.' });
        }

        if (quantity === undefined || typeof quantity !== 'number' || Number.isNaN(quantity)) {
            return res.status(400).json({ message: 'Quantity must be a valid number.' });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity must not be negative.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let newQuantity = product.stockQuantity;

        if (mode === 'set') {
            newQuantity = quantity;
        } else if (mode === 'add') {
            newQuantity = product.stockQuantity + quantity;
        } else if (mode === 'reduce') {
            newQuantity = product.stockQuantity - quantity;
        }

        if (newQuantity < 0) {
            return res.status(400).json({ message: 'Stock quantity cannot be negative.' });
        }

        product.stockQuantity = newQuantity;
        const updatedProduct = await product.save();

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInventoryReport = async (req, res) => {
    try {
        const products = await Product.find({});

        const totalProducts = products.length;
        let inStockProducts = 0;
        let lowStockProducts = 0;
        let outOfStockProducts = 0;
        let totalStockValue = 0;

        products.forEach((product) => {
            if (product.stockQuantity === 0) {
                outOfStockProducts += 1;
            } else if (product.stockQuantity <= 5) {
                lowStockProducts += 1;
            } else {
                inStockProducts += 1;
            }

            totalStockValue += product.stockQuantity * (product.price || 0);
        });

        res.status(200).json({
            totalProducts,
            inStockProducts,
            lowStockProducts,
            outOfStockProducts,
            totalStockValue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInventoryProducts,
    getLowStockProducts,
    updateStock,
    getInventoryReport,
};
