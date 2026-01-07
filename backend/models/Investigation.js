const mongoose = require('mongoose');

const investigationSchema = new mongoose.Schema({
  investigationNumber: {
    type: String,
    unique: true
  },
  franchiseNumber: {
    type: String,
    required: true
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Admin who created the investigation request
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Enforcer who accepted the investigation
  },
  status: {
    type: String,
    enum: ['open', 'accepted', 'completed', 'closed'],
    default: 'open'
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  acceptedDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

investigationSchema.pre('save', async function(next) {
  if (!this.investigationNumber) {
    const count = await mongoose.model('Investigation').countDocuments();
    this.investigationNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Investigation', investigationSchema);
