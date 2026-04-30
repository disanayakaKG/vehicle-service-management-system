const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/dashboardController');

// For now, making it public for testing, but ideally it should be protected
router.get('/overview', getOverview);

module.exports = router;
