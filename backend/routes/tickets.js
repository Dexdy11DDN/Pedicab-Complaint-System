const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { emitToAll, emitToRoles, emitToUser } = require('../utils/socketEmitter');

// @route   GET /api/tickets
// @desc    Get all tickets (admin) or enforcer's own tickets
// @access  Admin, Enforcer
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tickets;
    
    if (req.user.role === 'admin') {
      // Admin can see all tickets
      tickets = await Ticket.find()
        .populate('investigation')
        .populate('complaint')
        .populate('enforcer', 'firstName lastName email')
        .populate('forwardedBy', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'enforcer') {
      // Enforcer can only see their own tickets
      tickets = await Ticket.find({ enforcer: req.user.userId })
        .populate('investigation')
        .populate('complaint')
        .populate('enforcer', 'firstName lastName email')
        .populate('forwardedBy', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Admin, Enforcer (own tickets)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('investigation')
      .populate('complaint')
      .populate('enforcer', 'firstName lastName email')
      .populate('forwardedBy', 'firstName lastName');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && ticket.enforcer._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/tickets
// @desc    Create new ticket (enforcer submits after investigation)
// @access  Enforcer
router.post('/', authMiddleware, roleMiddleware('enforcer'), async (req, res) => {
  try {
    console.log('User creating ticket:', req.user);
    const { investigationId, violations, additionalNotes, evidence } = req.body;

    if (!investigationId || !violations || violations.length === 0) {
      return res.status(400).json({ message: 'Investigation ID and at least one violation are required' });
    }

    // Verify investigation exists and is accepted by this enforcer
    const Investigation = require('../models/Investigation');
    const investigation = await Investigation.findById(investigationId);
    
    if (!investigation) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    if (!investigation.acceptedBy || investigation.acceptedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only submit tickets for investigations you accepted' });
    }

    if (investigation.status !== 'accepted') {
      return res.status(400).json({ message: 'Investigation is not in accepted status' });
    }

    const ticket = new Ticket({
      investigation: investigationId,
      complaint: investigation.complaint,
      enforcer: req.user.userId,
      franchiseNumber: investigation.franchiseNumber,
      violations,
      additionalNotes,
      evidence: evidence || []
    });

    await ticket.save();

    // Update investigation status to completed
    investigation.status = 'completed';
    investigation.completionDate = Date.now();
    await investigation.save();

    // Update linked complaint status to resolved if exists
    if (investigation.complaint) {
      const Complaint = require('../models/Complaint');
      await Complaint.findByIdAndUpdate(investigation.complaint, {
        status: 'resolved'
      });
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('investigation')
      .populate('complaint')
      .populate('enforcer', 'firstName lastName email');

    // Emit real-time event for new ticket
    emitToRoles(req, ['admin'], 'ticket:created', populatedTicket);

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/tickets/:id/forward
// @desc    Forward ticket to higher ups
// @access  Admin
router.patch('/:id/forward', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { notes } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'forwarded';
    ticket.forwardedBy = req.user.userId;
    ticket.forwardedDate = Date.now();
    if (notes) ticket.notes = notes;

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('investigation')
      .populate('complaint')
      .populate('enforcer', 'firstName lastName email')
      .populate('forwardedBy', 'firstName lastName');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status
// @access  Admin
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (notes) ticket.notes = notes;

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('investigation')
      .populate('complaint')
      .populate('enforcer', 'firstName lastName email')
      .populate('forwardedBy', 'firstName lastName');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
