const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function recalculateProductRating(productId) {
  const reviews = await Review.find({ product: productId });
  let average = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    average = sum / reviews.length;
  }
  await Product.findByIdAndUpdate(productId, { rating: average });
}

async function hasUserPurchasedAndReceivedProduct(userId, productId) {
  const orders = await Order.find({
    customer: userId,
    'items.productId': productId,
    orderStatus: 'Delivered',
    deliveryStatus: 'Delivered'
  });
  return orders.length > 0;
}

exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const hasPurchased = await hasUserPurchasedAndReceivedProduct(userId, productId);
    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only review products you have purchased and received' });
    }

    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      product: productId,
      user: userId,
      rating,
      comment
    });

    await review.save();
    await recalculateProductRating(productId);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    const hasPurchased = await hasUserPurchasedAndReceivedProduct(req.user._id, review.product);
    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only edit reviews for products you have purchased and received' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment is required' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();
    await recalculateProductRating(review.product);
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const hasPurchased = await hasUserPurchasedAndReceivedProduct(req.user._id, review.product);
    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only delete reviews for products you have purchased and received' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await recalculateProductRating(productId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};