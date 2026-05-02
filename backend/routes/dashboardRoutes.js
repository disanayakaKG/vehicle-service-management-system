const express = require('express');
const router = express.Router();
const { getOverview, getDetails } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/overview', protect, adminOnly, getOverview);
router.get('/details/:type', protect, adminOnly, getDetails);

module.exports = router;
