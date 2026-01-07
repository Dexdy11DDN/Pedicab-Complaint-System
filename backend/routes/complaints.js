const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emitToAll, emitToRoles, emitToUser } = require('../utils/socketEmitter');

// Generate unique complaint number
const generateComplaintNumber = async () => {
  const count = await Complaint.countDocuments();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `CMP-${year}${month}-${String(count + 1).padStart(5, '0')}`;
};

// Submit complaint (Client only)
router.post('/', [authMiddleware, roleMiddleware('client')], [
  body('franchiseNumber').notEmpty(),
  body('description').notEmpty(),
  body('category').isIn(['overcharging', 'rude_behavior', 'reckless_driving', 'refusal_of_service', 'vehicle_condition', 'other']),
  body('location').notEmpty(),
  body('incidentDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const complaintNumber = await generateComplaintNumber();

    const complaint = new Complaint({
      complaintNumber,
      client: req.user.userId,
      ...req.body
    });

    await complaint.save();
    await complaint.populate('client', 'firstName lastName email');

    // Emit real-time event for new complaint
    emitToRoles(req, ['enforcer', 'admin'], 'complaint:created', complaint);

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all complaints (Enforcer and Admin)
router.get('/', [authMiddleware, roleMiddleware('enforcer', 'admin')], async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('client', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get client's own complaints
router.get('/my-complaints', [authMiddleware, roleMiddleware('client')], async (req, res) => {
  try {
    const complaints = await Complaint.find({ client: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get complaint by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('client', 'firstName lastName email phoneNumber');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Clients can only view their own complaints
    if (req.user.role === 'client' && complaint.client._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint status (Enforcer and Admin)
router.patch('/:id/status', [authMiddleware, roleMiddleware('enforcer', 'admin')], [
  body('status').isIn(['submitted', 'under_review', 'investigating', 'resolved', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('client', 'firstName lastName email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Emit real-time event for status update
    emitToAll(req, 'complaint:updated', complaint);
    // Also notify the complaint owner
    if (complaint.client && complaint.client._id) {
      emitToUser(req, complaint.client._id.toString(), 'complaint:statusChanged', {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        newStatus: complaint.status
      });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
