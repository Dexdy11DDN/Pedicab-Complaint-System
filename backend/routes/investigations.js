const express = require('express');
const router = express.Router();
const Investigation = require('../models/Investigation');
const Complaint = require('../models/Complaint');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emitToAll, emitToRoles } = require('../utils/socketEmitter');

// @route   GET /api/investigations
// @desc    Get all investigations
// @access  Admin, Enforcer
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    const { status, acceptedByMe } = req.query;
    
    // Enforcers have restricted access
    if (req.user.role === 'enforcer') {
      // If specifically requesting only open investigations
      if (status === 'open') {
        query = { status: 'open' };
      }
      // If requesting only investigations accepted by this enforcer
      else if (acceptedByMe === 'true') {
        query = { acceptedBy: req.user.userId };
      }
      // Default: show both open and their accepted investigations
      else {
        query = {
          $or: [
            { status: 'open' },
            { acceptedBy: req.user.userId }
          ]
        };
      }
    } else {
      // Admin can filter by status if provided
      if (status) {
        query.status = status;
      }
    }

    const investigations = await Investigation.find(query)
      .populate('complaint')
      .populate('requestedBy', 'firstName lastName email')
      .populate('acceptedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json({ investigations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/investigations
// @desc    Create investigation request (Admin creates a quest)
// @access  Admin
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { franchiseNumber, complaintId, description } = req.body;

    if (!franchiseNumber || !description) {
      return res.status(400).json({ message: 'Franchise number and description are required' });
    }

    // Validate complaint exists if complaintId is provided
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
    }

    const investigation = new Investigation({
      franchiseNumber,
      complaint: complaintId || null,
      requestedBy: req.user.userId,
      description,
      status: 'open'
    });

    await investigation.save();

    const populated = await Investigation.findById(investigation._id)
      .populate('complaint')
      .populate('requestedBy', 'firstName lastName email');

    // Emit real-time event for new investigation
    emitToRoles(req, ['enforcer', 'admin'], 'investigation:created', populated);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating investigation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/investigations/:id/accept
// @desc    Enforcer accepts an investigation quest
// @access  Enforcer
router.patch('/:id/accept', authMiddleware, roleMiddleware('enforcer'), async (req, res) => {
  try {
    const investigation = await Investigation.findById(req.params.id);
    
    if (!investigation) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    if (investigation.status !== 'open') {
      return res.status(400).json({ message: 'Investigation is not available' });
    }

    investigation.status = 'accepted';
    investigation.acceptedBy = req.user.userId;
    investigation.acceptedDate = Date.now();

    await investigation.save();

    const updated = await Investigation.findById(investigation._id)
      .populate('complaint')
      .populate('requestedBy', 'firstName lastName email')
      .populate('acceptedBy', 'firstName lastName email');

    // Emit real-time event for investigation acceptance
    emitToAll(req, 'investigation:updated', updated);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/investigations/:id
// @desc    Get investigation by ID
// @access  Admin, Enforcer (if accepted by them)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const investigation = await Investigation.findById(req.params.id)
      .populate('complaint')
      .populate('requestedBy', 'firstName lastName email')
      .populate('acceptedBy', 'firstName lastName email');
    
    if (!investigation) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    // Enforcers can only view if they accepted it or if it's open
    if (req.user.role === 'enforcer') {
      if (investigation.status !== 'open' && 
          (!investigation.acceptedBy || investigation.acceptedBy._id.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(investigation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/investigations/:id
// @desc    Delete investigation (Admin only, only if still open)
// @access  Admin
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const investigation = await Investigation.findById(req.params.id);
    
    if (!investigation) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    if (investigation.status !== 'open') {
      return res.status(400).json({ message: 'Cannot delete accepted or completed investigations' });
    }

    await investigation.deleteOne();
    res.json({ message: 'Investigation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
