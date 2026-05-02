const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin/Supplier)
const createProduct = async (req, res) => {
    try {
        const { 
            productId, name, brand, vehicleType, vehicleName, 
            category, price, discount, stockQuantity, rating, description, warrantyMonths 
        } = req.body;

        // Calculate finalPrice
        const disc = discount || 0;
        const finalPrice = price - (price * disc / 100);

        const product = new Product({
            productId,
            name,
            brand,
            vehicleType,
            vehicleName,
            category,
            price,
            discount: disc,
            finalPrice,
            stockQuantity,
            rating: rating || 0,
            description,
            warrantyMonths: warrantyMonths !== undefined ? warrantyMonths : 0,
            image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || ''),
            createdBy: req.user._id // Attached by protect middleware
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all products with search, filter, and sort
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { 
            search, brand, vehicleType, vehicleName, 
            category, minPrice, maxPrice, minRating, sort 
        } = req.query;

        let query = {};

        // 1. Search by productId or name
        if (search) {
            query.$or = [
                { productId: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // 2. Exact match filters
        if (brand) query.brand = brand;
        if (vehicleType) query.vehicleType = vehicleType;
        if (vehicleName) query.vehicleName = vehicleName;
        if (category) query.category = category;

        // 3. Range filters
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }

        // 4. Sorting logic
        let sortQuery = { createdAt: -1 }; // Default: Newest
        if (sort === 'price_asc') sortQuery = { price: 1 };
        if (sort === 'price_desc') sortQuery = { price: -1 };
        if (sort === 'rating_desc') sortQuery = { rating: -1 };
        if (sort === 'newest') sortQuery = { createdAt: -1 };

        const products = await Product.find(query).sort(sortQuery);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get top rated products
// @route   GET /api/products/top-rated
// @access  Public
const getTopRatedProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ rating: -1 }).limit(5);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin/Supplier)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Update fields if provided in body
            product.productId = req.body.productId || product.productId;
            product.name = req.body.name || product.name;
            product.brand = req.body.brand || product.brand;
            product.vehicleType = req.body.vehicleType || product.vehicleType;
            product.vehicleName = req.body.vehicleName || product.vehicleName;
            product.category = req.body.category || product.category;
            product.stockQuantity = req.body.stockQuantity || product.stockQuantity;
            product.rating = req.body.rating || product.rating;
            product.description = req.body.description || product.description;
            product.warrantyMonths = req.body.warrantyMonths !== undefined ? req.body.warrantyMonths : product.warrantyMonths;

            // Handle price and discount changes for finalPrice recalculation
            if (req.body.price !== undefined || req.body.discount !== undefined) {
                const newPrice = req.body.price !== undefined ? req.body.price : product.price;
                const newDiscount = req.body.discount !== undefined ? req.body.discount : product.discount;
                
                product.price = newPrice;
                product.discount = newDiscount;
                product.finalPrice = newPrice - (newPrice * newDiscount / 100);
            }

            // Handle image update
            if (req.file) {
                product.image = `/uploads/${req.file.filename}`;
            } else if (req.body.image !== undefined) {
                product.image = req.body.image;
            }

            const updatedProduct = await product.save();
            res.status(200).json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Supplier)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.status(200).json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getTopRatedProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
