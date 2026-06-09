const mongoose = require('mongoose');

// User Schema - Defines how user data is stored in MongoDB
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'] 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true, 
        lowercase: true 
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'] 
    },
    phone: { 
        type: String, 
        trim: true,
        default: null
    },
    profileImage: {
        type: String,
        default: null
    },
    role: { 
        type: String, 
        enum: ['admin', 'customer', 'supplier'], 
        default: 'customer' 
    }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
