const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Franchise = require('../models/Franchise');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all franchises (Enforcer and Admin)
router.get('/', [authMiddleware, roleMiddleware('enforcer', 'admin')], async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { franchiseNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const franchises = await Franchise.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Franchise.countDocuments(filter);

    res.json({
      franchises,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get franchise by number (Enforcer and Admin)
router.get('/:franchiseNumber', [authMiddleware, roleMiddleware('enforcer', 'admin')], async (req, res) => {
  try {
    const franchise = await Franchise.findOne({ franchiseNumber: req.params.franchiseNumber });

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    res.json(franchise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create franchise (Admin only)
router.post('/', [authMiddleware, roleMiddleware('admin')], [
  body('franchiseNumber').notEmpty(),
  body('ownerName').notEmpty(),
  body('contactNumber').notEmpty(),
  body('address').notEmpty(),
  body('licenseNumber').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if franchise number exists
    const existing = await Franchise.findOne({ franchiseNumber: req.body.franchiseNumber });
    if (existing) {
      return res.status(400).json({ message: 'Franchise number already exists' });
    }

    const franchise = new Franchise(req.body);
    await franchise.save();

    res.status(201).json(franchise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update franchise (Admin only)
router.put('/:franchiseNumber', [authMiddleware, roleMiddleware('admin')], async (req, res) => {
  try {
    const franchise = await Franchise.findOneAndUpdate(
      { franchiseNumber: req.params.franchiseNumber },
      req.body,
      { new: true, runValidators: true }
    );

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    res.json(franchise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update franchise status (Admin only)
router.patch('/:franchiseNumber/status', [authMiddleware, roleMiddleware('admin')], [
  body('status').isIn(['active', 'suspended', 'revoked'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const franchise = await Franchise.findOneAndUpdate(
      { franchiseNumber: req.params.franchiseNumber },
      { status: req.body.status },
      { new: true }
    );

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found' });
    }

    res.json(franchise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
