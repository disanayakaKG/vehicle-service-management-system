const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPayHereSession } = require('../controllers/paymentController');

router.post('/payhere/session', protect, createPayHereSession);

module.exports = router;
