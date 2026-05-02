const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getReviewsByProduct, createReview, updateReview, deleteReview } = require('../controllers/reviewController');

router.get('/product/:productId', getReviewsByProduct);
router.post('/product/:productId', protect, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;