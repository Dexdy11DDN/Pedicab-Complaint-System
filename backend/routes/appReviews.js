const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AppReview = require('../models/AppReview');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Submit or update app review (Client only)
router.post('/', [authMiddleware, roleMiddleware('client')], [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().trim().isLength({ max: 500 }).withMessage('Comment is required (max 500 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;

    // Check if user already has a review
    let review = await AppReview.findOne({ user: req.user.userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      await review.save();
      await review.populate('user', 'firstName lastName');
      return res.json({ message: 'Review updated successfully', review });
    }

    // Create new review
    review = new AppReview({
      user: req.user.userId,
      rating,
      comment
    });

    await review.save();
    await review.populate('user', 'firstName lastName');

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's review (Client only)
router.get('/my-review', [authMiddleware, roleMiddleware('client')], async (req, res) => {
  try {
    const review = await AppReview.findOne({ user: req.user.userId });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all reviews with analytics (Admin only)
router.get('/', [authMiddleware, roleMiddleware('admin')], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await AppReview.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await AppReview.countDocuments();

    // Calculate analytics
    const analytics = await AppReview.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const stats = analytics[0] || {
      averageRating: 0,
      totalReviews: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0
    };

    res.json({
      reviews,
      analytics: {
        averageRating: Math.round(stats.averageRating * 10) / 10 || 0,
        totalReviews: stats.totalReviews,
        distribution: {
          5: stats.rating5,
          4: stats.rating4,
          3: stats.rating3,
          2: stats.rating2,
          1: stats.rating1
        }
      },
      pagination: {
        totalPages: Math.ceil(totalReviews / limit),
        currentPage: parseInt(page),
        total: totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review (Admin only - for moderation)
router.delete('/:id', [authMiddleware, roleMiddleware('admin')], async (req, res) => {
  try {
    const review = await AppReview.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
