const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper function to generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token expires in 30 days
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        // 1. Validate required fields
        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // 2. Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create and save the user
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone || null,
            role: role || 'customer'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        console.log(`🔐 Login attempt for email: ${normalizedEmail}`);   // ← Helpful log

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log(`❌ User not found: ${normalizedEmail}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`❌ Password mismatch for: ${normalizedEmail}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log(`✅ Login successful for: ${normalizedEmail}`);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        console.error(`💥 Login Error:`, error.message);   // ← Very important
        res.status(500).json({ message: error.message || 'Server error during login' });
    }
};
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // req.user is attached by the protect middleware
        if (req.user) {
            res.status(200).json(req.user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};
