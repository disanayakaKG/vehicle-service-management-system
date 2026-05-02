const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: { 
        type: String, 
        required: [true, 'Product ID is required'], 
        unique: true 
    },
    name: { 
        type: String, 
        required: [true, 'Product name is required'] 
    },
    brand: { 
        type: String, 
        required: [true, 'Brand is required'] 
    },
    vehicleType: { 
        type: String, 
        required: [true, 'Vehicle type is required'] 
    },
    vehicleName: { 
        type: String, 
        required: [true, 'Vehicle name is required'] 
    },
    category: { 
        type: String, 
        required: [true, 'Category is required'] 
    },
    price: { 
        type: Number, 
        required: [true, 'Price is required'] 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    finalPrice: { 
        type: Number 
    },
    stockQuantity: { 
        type: Number, 
        required: [true, 'Stock quantity is required'],
        default: 0 
    },
    rating: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 5
    },
    image: { 
        type: String 
    },
    description: { 
        type: String 
    },
    warrantyMonths: {
        type: Number,
        default: 0,
        min: 0
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Product', productSchema);
